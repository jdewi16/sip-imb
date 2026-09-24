import React from 'react';
import { BookOpen, FileCheck, Wrench, ShieldAlert, Phone, MapPin } from 'lucide-react';

export const GuidelineTab: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border-2 border-red-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Pita Merah Putih */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-white to-red-600" />
        <div className="flex items-center gap-3 border-b border-red-900/40 pb-5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-700 to-red-500 border-2 border-white/80 flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              Panduan Pengawasan Bangunan Gedung (PBG / SIP-BG)
            </h2>
            <p className="text-xs text-red-200/90">
              Dasar hukum penertiban & persyaratan Persetujuan Bangunan Gedung (PBG) Satpol PP Kabupaten Maluku Tengah
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Box 1 */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-amber-400" />
              Syarat Administratif
            </h3>
            <ul className="space-y-2 text-slate-400 list-disc list-inside">
              <li>Fotokopi KTP Pemohon / Penanggung Jawab Proyek</li>
              <li>Surat Bukti Kepemilikan Tanah Sah (Sertifikat Hak Milik/Girik)</li>
              <li>Surat Pernyataan Bebas Sengketa Kepemilikan Lahan</li>
              <li>Bukti Pelunasan PBB Tahun Berjalan</li>
              <li>Surat Izin Tetangga / RT setempat</li>
            </ul>
          </div>

          {/* Box 2 */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-indigo-400" />
              Dokumen Teknis
            </h3>
            <ul className="space-y-2 text-slate-400 list-disc list-inside">
              <li>Gambar Rencana Arsitektur Bangunan lengkap</li>
              <li>Gambar Denah & Potongan Struktur Konstruksi</li>
              <li>Rencana Utilitas Gedung (Jalur Listrik, Air & Drainase)</li>
              <li>Perhitungan Struktur Khusus (Bangunan &gt; 2 Lantai)</li>
              <li>Rekomendasi Teknis Dinas PUPR Kab. Maluku Tengah</li>
            </ul>
          </div>

          {/* Box 3 */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Tahapan Penertiban
            </h3>
            <ul className="space-y-2 text-slate-400 list-disc list-inside">
              <li>Pemeriksaan Lapangan & Pemasangan Stiker Pengawasan</li>
              <li>Penerbitan Surat Peringatan Teguran I, II, dan III</li>
              <li>Penghentian Sementara Kegiatan Konstruksi Proyek</li>
              <li>Penyegelan Resmi Bangunan bagi yang membandel</li>
              <li>Sanksi Denda Administrasi sesuai Peraturan Daerah</li>
            </ul>
          </div>
        </div>

        {/* Call Center Satpol PP Info */}
        <div className="bg-gradient-to-r from-red-950/60 to-slate-950 p-5 rounded-2xl border border-red-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Pusat Informasi & Pengaduan Langsung</h4>
              <p className="text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Kantor Satpol PP Kabupaten Maluku Tengah • Jl. Buano, Masohi
              </p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 font-mono font-bold">
            Call Center: (0812) 4700-1122
          </div>
        </div>
      </div>
    </div>
  );
};
