import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { SatelliteMap } from './components/SatelliteMap';
import { GoogleFormSyncModal } from './components/GoogleFormSyncModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { AiGroundingModal } from './components/AiGroundingModal';
import { ReportForm } from './components/ReportForm';
import { AdminPortal } from './components/AdminPortal';
import { GuidelineTab } from './components/GuidelineTab';
import { ProjectReport, fetchGoogleFormResponses, extractFormId } from './services/googleForms';
import { getAccessToken } from './services/firebaseAuth';
import {
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  FileSpreadsheet,
  PlusCircle,
  Key,
  Layers,
  Shield,
  Radio,
  ExternalLink,
} from 'lucide-react';

const INITIAL_PROJECTS: ProjectReport[] = [
  {
    id: 'BG-2026-001',
    tanggal: '2026-09-20',
    nama: 'Ruko Sentosa Jaya Masohi',
    jenis: 'Ruko / Toko',
    kecamatan: 'Kota Masohi',
    alamat: 'Jl. Buano, Kelurahan Namaelo, Masohi',
    status: 'Belum IMB',
    lat: -3.3135,
    lng: 128.9521,
    foto: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=500&auto=format&fit=crop&q=60',
    keterangan: 'Pembangunan lantai 2 tanpa memasang plang izin PBG resmi.',
    verified: false,
    source: 'sample',
  },
  {
    id: 'BG-2026-002',
    tanggal: '2026-09-18',
    nama: 'Penginapan & Resto Amahai Beach',
    jenis: 'Gedung Komersial',
    kecamatan: 'Amahai',
    alamat: 'Jl. Laut Amahai, Pantai Rutah, Maluku Tengah',
    status: 'Sedang Proses',
    lat: -3.3421,
    lng: 128.9214,
    foto: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&auto=format&fit=crop&q=60',
    keterangan: 'Kajian kesesuaian sempadan pantai PUPR sedang diverifikasi.',
    verified: true,
    verifiedDate: '2026-09-19',
    source: 'sample',
  },
  {
    id: 'BG-2026-003',
    tanggal: '2026-09-15',
    nama: 'Gedung Serbaguna Banda Neira',
    jenis: 'Fasilitas Umum',
    kecamatan: 'Banda',
    alamat: 'Naira, Kepulauan Banda, Maluku Tengah',
    status: 'Sudah IMB',
    lat: -4.5245,
    lng: 129.8972,
    foto: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&auto=format&fit=crop&q=60',
    keterangan: 'PBG Resmi No: 503/PBG/MT/2026 lengkap.',
    verified: true,
    verifiedDate: '2026-09-16',
    source: 'sample',
  },
  {
    id: 'BG-2026-004',
    tanggal: '2026-09-10',
    nama: 'Rumah Tinggal Bpk. Sahal Lesane',
    jenis: 'Rumah Tinggal',
    kecamatan: 'Kota Masohi',
    alamat: 'Jl. Kartini, Kelurahan Lesane, Masohi',
    status: 'Belum IMB',
    lat: -3.3089,
    lng: 128.9588,
    foto: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&auto=format&fit=crop&q=60',
    keterangan: 'Penambahan bangunan di atas saluran drainase publik.',
    verified: false,
    source: 'sample',
  },
];

export default function App() {
  const [reports, setReports] = useState<ProjectReport[]>(() => {
    const saved = localStorage.getItem('sipimb_reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PROJECTS;
      }
    }
    return INITIAL_PROJECTS;
  });

  const [activeTab, setActiveTab] = useState<'map' | 'report' | 'guide' | 'admin' | 'gforms'>('map');
  const [selectedProject, setSelectedProject] = useState<ProjectReport | null>(null);
  const [aiAnalysisProject, setAiAnalysisProject] = useState<ProjectReport | null>(null);
  const [isGoogleFormModalOpen, setIsGoogleFormModalOpen] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Search & Map Filters
  const [mapSearch, setMapSearch] = useState('');
  const [mapStatusFilter, setMapStatusFilter] = useState('ALL');
  const [mapKecamatanFilter, setMapKecamatanFilter] = useState('ALL');

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; title: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((title: string, message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Save to localStorage whenever reports change
  useEffect(() => {
    localStorage.setItem('sipimb_reports', JSON.stringify(reports));
  }, [reports]);

  // Google Form Live Polling Loop
  useEffect(() => {
    if (!autoSyncEnabled) return;

    const interval = setInterval(async () => {
      const formId = localStorage.getItem('sipimb_gform_id');
      if (!formId) return;

      try {
        const token = await getAccessToken();
        if (!token) return;

        const freshReports = await fetchGoogleFormResponses(extractFormId(formId), token);
        if (freshReports.length > 0) {
          setReports((prev) => {
            // Merge by ID
            const existingIds = new Set(prev.map((p) => p.id));
            const brandNew = freshReports.filter((r) => !existingIds.has(r.id));
            if (brandNew.length > 0) {
              showToast(
                'Laporan Baru Masuk',
                `Diterima ${brandNew.length} respons data pembangunan baru dari Google Form.`,
                'success'
              );
              return [...brandNew, ...prev];
            }
            return prev;
          });
          setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        }
      } catch (err) {
        // Silent polling error to avoid disrupting UI
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, showToast]);

  const handleSyncSuccess = (newReports: ProjectReport[], formTitle: string) => {
    setReports((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const filtered = newReports.filter((r) => !existingIds.has(r.id));
      return [...filtered, ...prev];
    });
    setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
    showToast(
      'Sinkronisasi Google Form Sukses',
      `Data respons dari "${formTitle}" telah dimuat ke peta satelit.`,
      'success'
    );
  };

  const handleAddReport = (newReport: ProjectReport) => {
    setReports((prev) => [newReport, ...prev]);
    showToast(
      'Laporan Berhasil Disimpan',
      `Data ${newReport.id} berhasil ditambahkan dan dipetakan di satelit Google Maps.`,
      'success'
    );
  };

  const handleUpdateStatus = (id: string, newStatus: 'Sudah IMB' | 'Sedang Proses' | 'Belum IMB') => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    showToast('Status Diperbarui', `Status ${id} diubah menjadi ${newStatus}.`, 'success');
  };

  const handleVerifyReport = (id: string, verified: boolean, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              verified,
              verifiedDate: verified ? today : undefined,
              keterangan: notes !== undefined ? notes : r.keterangan,
            }
          : r
      )
    );
    showToast(
      'Verifikasi Diperbarui',
      `Data laporan ${id} berhasil diverifikasi oleh Satpol PP.`,
      'success'
    );
  };

  const handleDeleteReport = (id: string) => {
    if (window.confirm(`Yakin ingin menghapus laporan ${id} secara permanen?`)) {
      setReports((prev) => prev.filter((r) => r.id !== id));
      showToast('Data Dihapus', `Laporan ${id} telah dihapus.`, 'info');
    }
  };

  // Filter for Map View
  const filteredMapReports = reports.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(mapSearch.toLowerCase()) ||
      item.alamat.toLowerCase().includes(mapSearch.toLowerCase()) ||
      item.id.toLowerCase().includes(mapSearch.toLowerCase());

    const matchStatus = mapStatusFilter === 'ALL' || item.status === mapStatusFilter;
    const matchKecamatan = mapKecamatanFilter === 'ALL' || item.kecamatan === mapKecamatanFilter;

    return matchSearch && matchStatus && matchKecamatan;
  });

  const countSudah = reports.filter((r) => r.status === 'Sudah IMB').length;
  const countProses = reports.filter((r) => r.status === 'Sedang Proses').length;
  const countBelum = reports.filter((r) => r.status === 'Belum IMB').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenGoogleFormModal={() => setIsGoogleFormModalOpen(true)}
        autoSyncEnabled={autoSyncEnabled}
        isAdminLoggedIn={isAdminLoggedIn}
        totalProjects={reports.length}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-5 z-50 animate-in slide-in-from-right max-w-sm w-full bg-slate-900 border border-slate-700 p-4 rounded-2xl shadow-2xl flex items-start gap-3">
          <div className="p-1 rounded-lg bg-slate-800 text-amber-400 shrink-0 mt-0.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-white text-sm">{toast.title}</h4>
            <p className="text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: PETA SEBARAN SATELIT */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* Header Status & Sync Banner - Nuansa Merah Putih */}
            <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border-2 border-red-800/50 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-white to-red-600" />
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h1 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    Pemantauan Bangunan Gedung (SIP-BG) & Data Satelit
                  </h1>
                </div>
                <p className="text-xs text-red-100/80 mt-1">
                  Sistem Informasi Pengawasan Bangunan Gedung (SIP-BG) Satpol PP Kabupaten Maluku Tengah • Terintegrasi Google Form & Google Sheets
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <button
                  onClick={() => setIsGoogleFormModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-white border border-red-500/40 flex items-center gap-1.5 transition shadow"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  <span>Google Form & Sheets Sync</span>
                </button>

                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Sudah PBG: <strong className="text-white">{countSudah}</strong></span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-800/80 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Sedang Proses: <strong className="text-white">{countProses}</strong></span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-red-950/90 text-red-200 border border-red-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Belum Izin: <strong className="text-white">{countBelum}</strong></span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                  placeholder="Cari nama proyek, pemilik, atau ID..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <select
                  value={mapStatusFilter}
                  onChange={(e) => setMapStatusFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">-- Semua Status IMB/PBG --</option>
                  <option value="Sudah IMB">Sudah Memiliki IMB/PBG</option>
                  <option value="Sedang Proses">Sedang Dalam Proses IMB</option>
                  <option value="Belum IMB">Belum Memiliki IMB (Penertiban)</option>
                </select>
              </div>

              <div>
                <select
                  value={mapKecamatanFilter}
                  onChange={(e) => setMapKecamatanFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">-- Semua Kecamatan Maluku Tengah --</option>
                  <option value="Kota Masohi">Kota Masohi</option>
                  <option value="Amahai">Amahai</option>
                  <option value="Banda">Kepulauan Banda</option>
                  <option value="Teon Nila Serua">Teon Nila Serua (TNS)</option>
                  <option value="Saparua">Saparua</option>
                  <option value="Nusa Laut">Nusa Laut</option>
                  <option value="Lainnya">Kecamatan Lainnya</option>
                </select>
              </div>
            </div>

            {/* Interactive Satellite Map */}
            <SatelliteMap
              reports={filteredMapReports}
              onSelectReport={(report) => setSelectedProject(report)}
              onAnalyzeReport={(report) => setAiAnalysisProject(report)}
            />

            {/* Quick Action Footer Banner */}
            <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-red-800/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1.5 text-center md:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Layanan Terpadu Satpol PP & Google Workspace
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Pantau & Laporkan Proyek Tanpa Izin Secara Cepat
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Laporan warga yang dikirimkan melalui Google Form atau aplikasi ini akan langsung muncul dengan koordinat presisi pada citra satelit Google Maps untuk verifikasi petugas.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button
                  onClick={() => setActiveTab('report')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Buat Laporan Baru</span>
                </button>

                <button
                  onClick={() => setIsGoogleFormModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-lg flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Koneksi Google Form</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LAPOR BANGUNAN */}
        {activeTab === 'report' && (
          <ReportForm
            onSubmitReport={handleAddReport}
            onSuccessNavigateToMap={() => setActiveTab('map')}
          />
        )}

        {/* TAB 3: PANDUAN IMB/PBG */}
        {activeTab === 'guide' && <GuidelineTab />}

        {/* TAB 4: PORTAL ADMIN SATPOL PP */}
        {activeTab === 'admin' && (
          <AdminPortal
            reports={reports}
            onUpdateReportStatus={handleUpdateStatus}
            onVerifyReport={handleVerifyReport}
            onDeleteReport={handleDeleteReport}
            onSelectReport={(r) => setSelectedProject(r)}
            onOpenAiAnalysis={(r) => setAiAnalysisProject(r)}
            onOpenGoogleFormModal={() => setIsGoogleFormModalOpen(true)}
            isAdminLoggedIn={isAdminLoggedIn}
            onLoginSuccess={() => {
              setIsAdminLoggedIn(true);
              showToast('Login Berhasil', 'Selamat datang di Portal Admin Satpol PP Maluku Tengah.', 'success');
            }}
            onLogout={() => {
              setIsAdminLoggedIn(false);
              showToast('Logout', 'Sesi admin telah berakhir.', 'info');
            }}
          />
        )}
      </main>

      {/* MODALS */}
      <GoogleFormSyncModal
        isOpen={isGoogleFormModalOpen}
        onClose={() => setIsGoogleFormModalOpen(false)}
        onSyncSuccess={handleSyncSuccess}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={setAutoSyncEnabled}
        lastSyncTime={lastSyncTime}
        currentReports={reports}
      />

      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onOpenAiAnalysis={(proj) => {
          setSelectedProject(null);
          setAiAnalysisProject(proj);
        }}
      />

      <AiGroundingModal
        project={aiAnalysisProject}
        onClose={() => setAiAnalysisProject(null)}
      />

      {/* Footer - Nuansa Merah Putih */}
      <footer className="bg-slate-950 border-t-2 border-red-800 text-slate-300 text-xs py-6 mt-12 relative">
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-white to-red-600 absolute top-0 left-0" />
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left pt-2">
          <div className="space-y-1">
            <p className="font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
              <Shield className="w-4 h-4 text-red-500" />
              SIP-BG • Satuan Polisi Pamong Praja Kabupaten Maluku Tengah
            </p>
            <p className="text-[11px] text-slate-400">
              Jl. Buano, Kota Masohi, Kabupaten Maluku Tengah, Provinsi Maluku
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-red-300 font-medium">Sistem Informasi Pengawasan Bangunan Gedung</span>
            <span className="text-slate-600">|</span>
            <span className="text-white font-semibold">Tema Merah Putih Satpol PP</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">Terintegrasi Google Workspace</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
