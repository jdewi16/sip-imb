import React, { useState } from 'react';
import { ProjectReport } from '../services/googleForms';
import { exportProjectsToPDF } from '../utils/pdfExport';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Key,
  FileText,
  Trash2,
  Edit3,
  Eye,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Building,
  UserCheck,
  Camera,
  Layers,
} from 'lucide-react';

interface AdminPortalProps {
  reports: ProjectReport[];
  onUpdateReportStatus: (id: string, newStatus: 'Sudah IMB' | 'Sedang Proses' | 'Belum IMB') => void;
  onVerifyReport: (id: string, verified: boolean, notes?: string) => void;
  onDeleteReport: (id: string) => void;
  onSelectReport: (report: ProjectReport) => void;
  onOpenAiAnalysis: (report: ProjectReport) => void;
  onOpenGoogleFormModal: () => void;
  isAdminLoggedIn: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  reports,
  onUpdateReportStatus,
  onVerifyReport,
  onDeleteReport,
  onSelectReport,
  onOpenAiAnalysis,
  onOpenGoogleFormModal,
  isAdminLoggedIn,
  onLoginSuccess,
  onLogout,
}) => {
  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Table filters
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'VERIFIED'>('ALL');

  // Change password modal
  const [showPassModal, setShowPassModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Verification Edit Modal
  const [editingItem, setEditingItem] = useState<ProjectReport | null>(null);
  const [editStatus, setEditStatus] = useState<'Sudah IMB' | 'Sedang Proses' | 'Belum IMB'>('Belum IMB');
  const [editVerified, setEditVerified] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  // PDF Generation State with Loading Feedback
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const currentAdminPass = localStorage.getItem('sipimb_admin_pass') || 'admin123';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim() === 'satpolpp' && passwordInput.trim() === currentAdminPass) {
      onLoginSuccess();
      setLoginError(null);
      setUsernameInput('');
      setPasswordInput('');
    } else {
      setLoginError('Username atau Password salah! Periksa kembali kredensial Anda.');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (oldPass !== currentAdminPass) {
      setPassError('Kata sandi saat ini yang Anda masukkan salah!');
      return;
    }
    if (newPass.length < 5) {
      setPassError('Kata sandi baru minimal 5 karakter!');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    localStorage.setItem('sipimb_admin_pass', newPass);
    setPassSuccess('Kata sandi administrator berhasil diperbarui!');
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => {
      setShowPassModal(false);
      setPassSuccess(null);
    }, 1500);
  };

  const openEditModal = (item: ProjectReport) => {
    setEditingItem(item);
    setEditStatus(item.status);
    setEditVerified(!!item.verified);
    setEditNotes(item.keterangan || '');
  };

  const handleSaveVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    onUpdateReportStatus(editingItem.id, editStatus);
    onVerifyReport(editingItem.id, editVerified, editNotes);
    setEditingItem(null);
  };

  const handleExportPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      await exportProjectsToPDF(reports);
    } catch (err) {
      console.error('Failed to export PDF with photos:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const filteredReports = reports.filter((item) => {
    const matchSearch =
      item.nama.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.alamat.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.id.toLowerCase().includes(tableSearch.toLowerCase()) ||
      item.kecamatan.toLowerCase().includes(tableSearch.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchVerified = activeSubTab === 'ALL' || item.verified;

    return matchSearch && matchStatus && matchVerified;
  });

  const countSudah = reports.filter((r) => r.status === 'Sudah IMB').length;
  const countProses = reports.filter((r) => r.status === 'Sedang Proses').length;
  const countBelum = reports.filter((r) => r.status === 'Belum IMB').length;
  const countVerified = reports.filter((r) => r.verified).length;

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-10 bg-slate-900 border-2 border-red-700/60 p-8 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
        {/* Pita Merah Putih Atas */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-white to-red-600" />

        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-red-700 to-red-500 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl border-2 border-white/80 shadow-xl shadow-red-950/50">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Portal Admin SIP-BG</h2>
          <p className="text-xs text-slate-300">
            Sistem Informasi Pengawasan Bangunan Gedung (SIP-BG)<br />
            <span className="text-red-400 font-semibold">Satuan Polisi Pamong Praja Kabupaten Maluku Tengah</span>
          </p>
        </div>

        {loginError && (
          <div className="p-3 bg-red-950/60 border border-red-700 text-red-200 rounded-xl text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-200 mb-1">Username / ID Petugas</label>
            <input
              type="text"
              required
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Masukkan username petugas"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-200 mb-1">Kata Sandi</label>
            <input
              type="password"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500 focus:outline-none placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-extrabold py-3 rounded-xl transition shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 border border-red-500"
          >
            <UserCheck className="w-4 h-4" />
            <span>Masuk ke Dashboard Petugas</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner - Nuansa Merah Putih */}
      <div className="bg-gradient-to-r from-red-950 via-red-900 to-slate-950 p-6 rounded-3xl border-2 border-red-700/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        {/* Pita Merah Putih */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-white to-red-600" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-700 to-red-500 flex items-center justify-center text-white border-2 border-white/80 shadow-lg shrink-0">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-red-700 px-2.5 py-0.5 rounded-full shadow-sm border border-red-200">
              SIP-BG • Dashboard Pengawasan Bangunan Gedung
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              Satuan Polisi Pamong Praja Kabupaten Maluku Tengah
            </h2>
            <p className="text-xs text-red-100/90">
              Pengawasan Geospasial Satelit Google Maps • Google Forms & Sheets Real-Time
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={onOpenGoogleFormModal}
            className="bg-red-950 hover:bg-red-900 text-white font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow border border-red-600"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Form & Sheets</span>
          </button>

          {/* Tombol Cetak PDF Resmi Bernuansa Merah Putih dengan Tabel Foto */}
          <button
            onClick={handleExportPDF}
            disabled={isGeneratingPdf}
            className="bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-extrabold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-red-950/60 border border-white/40 disabled:opacity-60"
            title="Cetak Laporan PDF Resmi Satpol PP lengkap dengan tabel foto dan lampiran visual"
          >
            <Camera className={`w-4 h-4 ${isGeneratingPdf ? 'animate-spin' : 'text-white'}`} />
            <span>{isGeneratingPdf ? 'Memproses Foto & Cetak...' : 'Cetak PDF (Tabel Foto & Rekap)'}</span>
          </button>

          <button
            onClick={() => setShowPassModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold px-3 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
          >
            <Key className="w-3.5 h-3.5 text-red-400" />
            <span>Ubah Sandi</span>
          </button>

          <button
            onClick={onLogout}
            className="bg-slate-900 hover:bg-slate-800 text-red-300 border border-red-800/60 px-3 py-2.5 rounded-xl font-semibold transition"
            title="Keluar Sesi Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Cards - Merah Putih Accents */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-slate-400 block text-[11px] font-medium">Total Bangunan Terdata</span>
          <p className="text-2xl font-black text-white mt-1">{reports.length}</p>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border-l-4 border-l-blue-500 border border-slate-800 shadow-md">
          <span className="text-blue-400 block text-[11px] font-medium">Terverifikasi Lapangan</span>
          <p className="text-2xl font-black text-blue-400 mt-1">{countVerified}</p>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border-l-4 border-l-emerald-500 border border-slate-800 shadow-md">
          <span className="text-emerald-400 block text-[11px] font-medium">Sudah PBG / IMB Sah</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{countSudah}</p>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border-l-4 border-l-amber-500 border border-slate-800 shadow-md">
          <span className="text-amber-400 block text-[11px] font-medium">Sedang Proses Izin</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{countProses}</p>
        </div>

        <div className="bg-slate-900 p-4 rounded-2xl border-l-4 border-l-red-600 border border-slate-800 shadow-md col-span-2 sm:col-span-1">
          <span className="text-red-400 block text-[11px] font-bold">Belum Memiliki Izin</span>
          <p className="text-2xl font-black text-red-500 mt-1">{countBelum}</p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Table Filters Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('ALL')}
              className={`px-3.5 py-2 rounded-xl font-bold transition ${
                activeSubTab === 'ALL'
                  ? 'bg-red-700 text-white shadow border border-red-500'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              Semua Laporan ({reports.length})
            </button>
            <button
              onClick={() => setActiveSubTab('VERIFIED')}
              className={`px-3.5 py-2 rounded-xl font-bold transition ${
                activeSubTab === 'VERIFIED'
                  ? 'bg-blue-700 text-white shadow border border-blue-500'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              Terverifikasi Satpol PP ({countVerified})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Cari ID, pemilik, alamat..."
                className="pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
            >
              <option value="ALL">Semua Status</option>
              <option value="Belum IMB">Belum IMB / PBG</option>
              <option value="Sedang Proses">Sedang Proses</option>
              <option value="Sudah IMB">Sudah PBG Sah</option>
            </select>
          </div>
        </div>

        {/* Table - Nuansa Merah Putih */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-red-950/70 text-red-200 font-bold uppercase tracking-wider border-b border-red-800/80">
              <tr>
                <th className="py-3 px-4">Register & Tgl</th>
                <th className="py-3 px-4 text-center">Foto Bangunan</th>
                <th className="py-3 px-4">Nama Bangunan & Pemilik</th>
                <th className="py-3 px-4">Wilayah & Alamat</th>
                <th className="py-3 px-4">Status Izin PBG</th>
                <th className="py-3 px-4 text-center">Verifikasi</th>
                <th className="py-3 px-4 text-center">Aksi Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ditemukan data laporan pembangunan fisik bangunan.
                  </td>
                </tr>
              ) : (
                filteredReports.map((item) => (
                  <tr key={item.id} className="hover:bg-red-950/20 transition group">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      <div className="text-red-400">{item.id}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{item.tanggal}</span>
                      {item.source === 'google_form' && (
                        <span className="block mt-0.5 text-[9px] text-emerald-400 font-bold">
                          [Google Form]
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="relative inline-block group/img">
                        <img
                          src={item.foto}
                          alt={item.nama}
                          className="w-16 h-12 object-cover rounded-xl border-2 border-red-700/60 shadow-md bg-slate-950 group-hover/img:scale-110 transition duration-150"
                        />
                        <span className="absolute bottom-0 right-0 bg-red-700 text-white text-[8px] px-1 rounded-tl font-bold">
                          FOTO
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <strong className="text-white block font-bold text-sm">{item.nama}</strong>
                      <span className="text-slate-400 text-[11px]">{item.jenis}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200 block">{item.kecamatan}</span>
                      <span className="text-slate-400 text-[11px] line-clamp-1">{item.alamat}</span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          onUpdateReportStatus(item.id, e.target.value as any)
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="Belum IMB" className="text-red-400">Belum IMB</option>
                        <option value="Sedang Proses" className="text-amber-400">Sedang Proses</option>
                        <option value="Sudah IMB" className="text-emerald-400">Sudah IMB</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.verified ? (
                        <span className="inline-flex items-center gap-1 text-blue-300 text-[10px] font-bold bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-500/40">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 text-[10px] font-semibold bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                          <Clock className="w-3 h-3" />
                          Belum
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          title="Edit & Verifikasi"
                          className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/40 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenAiAnalysis(item)}
                          title="Analisis AI Grounding Lokasi"
                          className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectReport(item)}
                          title="Lihat Detail Bangunan"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteReport(item.id)}
                          title="Hapus Data"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit & Verification Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-700/80 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-white to-red-600" />
            
            <div className="flex items-center gap-3">
              <img
                src={editingItem.foto}
                alt={editingItem.nama}
                className="w-14 h-14 object-cover rounded-xl border-2 border-red-600 shadow"
              />
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-red-400" />
                  Verifikasi Penertiban: {editingItem.id}
                </h3>
                <p className="text-slate-400 text-[11px]">{editingItem.nama} • {editingItem.kecamatan}</p>
              </div>
            </div>

            <form onSubmit={handleSaveVerification} className="space-y-3 pt-1">
              <div>
                <label className="block font-bold text-slate-200 mb-1">Status Perizinan PBG</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold focus:ring-2 focus:ring-red-500"
                >
                  <option value="Belum IMB">Belum IMB / PBG (Perlu Penertiban)</option>
                  <option value="Sedang Proses">Sedang Proses Verifikasi Dinas</option>
                  <option value="Sudah IMB">Sudah Memiliki Izin PBG Sah</option>
                </select>
              </div>

              <div className="p-3.5 bg-red-950/30 border border-red-800/60 rounded-xl space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-white">
                  <input
                    type="checkbox"
                    checked={editVerified}
                    onChange={(e) => setEditVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Tandai Terverifikasi Resmi Satpol PP Maluku Tengah</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Centang bila fisik bangunan dan legalitas telah diverifikasi langsung oleh petugas Satpol PP di lapangan.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1">Catatan Penertiban Lapangan</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Status surat peringatan (SP), pemeriksaan fisik, atau rekomendasi tindakan..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-2.5 rounded-xl transition shadow border border-red-500"
                >
                  Simpan Verifikasi
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-700/80 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-white to-red-600" />
            
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-red-400" />
              Ubah Kata Sandi Admin Satpol PP
            </h3>

            {passError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl">
                {passError}
              </div>
            )}
            {passSuccess && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl">
                {passSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  required
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-2.5 rounded-xl transition shadow border border-red-500"
                >
                  Simpan Kata Sandi
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
