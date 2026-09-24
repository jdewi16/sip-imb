import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { ProjectReport } from '../services/googleForms';
import {
  MapPin,
  Crosshair,
  UploadCloud,
  Send,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface ReportFormProps {
  onSubmitReport: (report: ProjectReport) => void;
  onSuccessNavigateToMap: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  onSubmitReport,
  onSuccessNavigateToMap,
}) => {
  const [nama, setNama] = useState('');
  const [jenis, setJenis] = useState('Ruko / Toko');
  const [kecamatan, setKecamatan] = useState('Kota Masohi');
  const [status, setStatus] = useState<'Sudah IMB' | 'Sedang Proses' | 'Belum IMB'>('Belum IMB');
  const [alamat, setAlamat] = useState('');
  const [lat, setLat] = useState(-3.3135);
  const [lng, setLng] = useState(128.9521);
  const [keterangan, setKeterangan] = useState('');
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  const pickerMapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!pickerMapRef.current || mapInstance.current) return;

    const map = L.map(pickerMapRef.current, {
      center: [-3.3135, 128.9521],
      zoom: 13,
      zoomControl: false,
    });

    const googleHybrid = L.tileLayer(
      'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps Satelit',
      }
    );
    googleHybrid.addTo(map);

    const marker = L.marker([-3.3135, 128.9521], { draggable: true }).addTo(map);

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setLat(Number(pos.lat.toFixed(6)));
      setLng(Number(pos.lng.toFixed(6)));
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setLat(Number(e.latlng.lat.toFixed(6)));
      setLng(Number(e.latlng.lng.toFixed(6)));
    });

    mapInstance.current = map;
    markerInstance.current = marker;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Browser Anda tidak mendukung geolokasi GPS.');
      return;
    }

    setGpsStatus('Mengambil titik koordinat GPS presisi...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        setLat(latitude);
        setLng(longitude);
        setGpsStatus('Lokasi GPS Anda berhasil disematkan!');

        if (mapInstance.current && markerInstance.current) {
          mapInstance.current.setView([latitude, longitude], 16);
          markerInstance.current.setLatLng([latitude, longitude]);
        }
      },
      (err) => {
        setGpsStatus('Gagal mengambil GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFotoPreview(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const newReport: ProjectReport = {
      id: `BG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      tanggal: new Date().toISOString().split('T')[0],
      nama: nama.trim() || 'Bangunan Baru',
      jenis,
      kecamatan,
      alamat: alamat.trim(),
      status,
      lat,
      lng,
      foto:
        fotoPreview ||
        'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=500&auto=format&fit=crop&q=60',
      keterangan: keterangan.trim() || 'Laporan peninjauan fisik bangunan gedung.',
      verified: false,
      source: 'manual',
    };

    onSubmitReport(newReport);
    setSubmitting(false);
    onSuccessNavigateToMap();
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-900 border-2 border-red-800/60 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Pita Merah Putih */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-white to-red-600" />
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-slate-900 p-6 border-b border-red-800/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-700 to-red-500 border-2 border-white/80 flex items-center justify-center text-white shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              Formulir Pelaporan Bangunan Gedung (SIP-BG)
            </h2>
            <p className="text-xs text-red-100/90 mt-0.5">
              Satuan Polisi Pamong Praja Kabupaten Maluku Tengah • Terintegrasi Satelit Google Maps
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 leading-relaxed">
          <strong>Perhatian:</strong> Data yang dilaporkan akan dipetakan langsung pada layer Satelit Google Maps real-time dan diverifikasi oleh Satuan Polisi Pamong Praja Kabupaten Maluku Tengah.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              Nama Pemilik / Bangunan / Proyek <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Toko Maju Seram / Bpk. La Ode"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              Jenis Bangunan <span className="text-rose-400">*</span>
            </label>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Rumah Tinggal">Rumah Tinggal</option>
              <option value="Ruko / Toko">Ruko / Toko / Tempat Usaha</option>
              <option value="Gedung Komersial">Gedung Komersial / Hotel / Penginapan</option>
              <option value="Gudang / Pabrik">Gudang / Industri / Pabrik</option>
              <option value="Fasilitas Umum">Fasilitas Umum / Rumah Ibadah</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              Wilayah Kecamatan <span className="text-rose-400">*</span>
            </label>
            <select
              value={kecamatan}
              onChange={(e) => setKecamatan(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Kota Masohi">Kota Masohi</option>
              <option value="Amahai">Amahai</option>
              <option value="Banda">Banda</option>
              <option value="Teon Nila Serua">Teon Nila Serua (TNS)</option>
              <option value="Saparua">Saparua</option>
              <option value="Nusa Laut">Nusa Laut</option>
              <option value="Lainnya">Kecamatan Lainnya</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              Status Perizinan IMB / PBG <span className="text-rose-400">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="Belum IMB" className="text-rose-400">Belum Memiliki IMB (Penertiban)</option>
              <option value="Sedang Proses" className="text-amber-400">Sedang Dalam Proses IMB/PBG</option>
              <option value="Sudah IMB" className="text-emerald-400">Sudah Memiliki IMB/PBG Resmi</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-300 mb-1.5">
            Alamat Lengkap / Patokan Jalan <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Jln. Buano, Kelurahan Namaelo, Masohi..."
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Location Picker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-slate-300">
              Titik Koordinat Satelit Google Maps <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={handleGetGps}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 transition"
            >
              <Crosshair className="w-3.5 h-3.5" />
              Ambil Lokasi GPS Saya
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-400">Latitude:</span>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono text-xs"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Longitude:</span>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono text-xs"
              />
            </div>
          </div>

          {gpsStatus && (
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {gpsStatus}
            </p>
          )}

          <p className="text-[11px] text-slate-400">
            Klik atau geser pin pada peta satelit di bawah untuk memposisikan titik proyek secara presisi:
          </p>

          <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-700">
            <div ref={pickerMapRef} className="w-full h-full" />
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block font-bold text-slate-300 mb-1.5">
            Unggah Foto Fisik Bangunan
          </label>
          <div className="border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center hover:bg-slate-800/50 transition cursor-pointer relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {fotoPreview ? (
              <div className="space-y-2">
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="max-h-40 mx-auto rounded-xl object-cover border border-slate-700"
                />
                <p className="text-[11px] text-amber-400 font-semibold">Klik untuk mengganti foto</p>
              </div>
            ) : (
              <div className="space-y-1 py-3 text-slate-400">
                <UploadCloud className="w-8 h-8 mx-auto text-amber-400" />
                <p className="font-semibold text-white">Pilih atau Seret Foto Bangunan</p>
                <p className="text-[10px] text-slate-500">Format JPG, PNG (Maks 5MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block font-bold text-slate-300 mb-1.5">
            Keterangan Tambahan / Temuan Lapangan
          </label>
          <textarea
            rows={2}
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Contoh: Jumlah lantai, perkiraan luas bangunan, atau belum ada plang izin..."
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-extrabold py-3.5 rounded-2xl transition shadow-xl shadow-red-950/50 flex items-center justify-center gap-2 text-sm disabled:opacity-50 border border-white/30"
          >
            <Send className="w-4 h-4 text-white" />
            <span>Kirim Laporan & Petakan ke Satelit Google Maps</span>
          </button>
        </div>
      </form>
    </div>
  );
};
