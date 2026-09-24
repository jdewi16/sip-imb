import React, { useState, useEffect } from 'react';
import {
  fetchGoogleFormDetails,
  fetchGoogleFormResponses,
  GoogleFormDetails,
  ProjectReport,
  extractFormId,
} from '../services/googleForms';
import {
  fetchSpreadsheetRows,
  pushReportsToSpreadsheet,
  extractSpreadsheetId,
  fetchSpreadsheetMetadata,
} from '../services/googleSheets';
import {
  googleSignIn,
  getAccessToken,
  logoutGoogle,
  auth,
} from '../services/firebaseAuth';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  LogOut,
  Sparkles,
  Layers,
  Radio,
  Table,
  UploadCloud,
  DownloadCloud,
  X,
} from 'lucide-react';

interface GoogleFormSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess: (newReports: ProjectReport[], sourceTitle: string) => void;
  autoSyncEnabled: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  lastSyncTime: string | null;
  currentReports: ProjectReport[];
}

export const GoogleFormSyncModal: React.FC<GoogleFormSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncSuccess,
  autoSyncEnabled,
  onToggleAutoSync,
  lastSyncTime,
  currentReports,
}) => {
  const [activeTab, setActiveTab] = useState<'forms' | 'sheets'>('forms');
  const [user, setUser] = useState<User | null>(null);

  // Form State
  const [formIdInput, setFormIdInput] = useState(
    localStorage.getItem('sipimb_gform_id') || ''
  );
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [formDetails, setFormDetails] = useState<GoogleFormDetails | null>(null);

  // Sheets State
  const [sheetIdInput, setSheetIdInput] = useState(
    localStorage.getItem('sipimb_gsheet_id') || ''
  );
  const [sheetTabName, setSheetTabName] = useState('Sheet1');
  const [isSheetSyncing, setIsSheetSyncing] = useState(false);
  const [isSheetPushing, setIsSheetPushing] = useState(false);
  const [showPushConfirmModal, setShowPushConfirmModal] = useState(false);

  // Status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setSuccessMessage('Berhasil terhubung dengan Akun Google (Forms & Sheets)!');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Gagal melakukan login Google. Periksa koneksi atau izin pop-up.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    setFormDetails(null);
    setSuccessMessage('Telah keluar dari sesi akun Google.');
  };

  // Google Forms Sync
  const handleSyncForm = async () => {
    const cleanId = extractFormId(formIdInput);
    if (!cleanId) {
      setErrorMessage('Harap masukkan ID Formulir atau URL Google Form yang valid.');
      return;
    }

    setIsSyncing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error(
          'Token Google belum aktif. Silakan klik tombol "Sign in with Google" terlebih dahulu.'
        );
      }

      localStorage.setItem('sipimb_gform_id', cleanId);

      const details = await fetchGoogleFormDetails(cleanId, token);
      setFormDetails(details);

      const qLookup: Record<string, string> = {};
      details.questions.forEach((q) => {
        qLookup[q.id] = q.title;
      });

      const submissions = await fetchGoogleFormResponses(cleanId, token, qLookup);
      onSyncSuccess(submissions, details.title);

      setSuccessMessage(
        `Sinkronisasi Form berhasil! Ditemukan ${submissions.length} respons data dari Google Form.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyinkronkan data dari Google Forms.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Google Sheets: Pull/Import
  const handleSyncSheets = async () => {
    const cleanId = extractSpreadsheetId(sheetIdInput);
    if (!cleanId) {
      setErrorMessage('Harap masukkan ID Spreadsheet atau tautan URL Google Sheets yang valid.');
      return;
    }

    setIsSheetSyncing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error(
          'Token Google belum aktif. Silakan klik "Sign in with Google" terlebih dahulu.'
        );
      }

      localStorage.setItem('sipimb_gsheet_id', cleanId);

      const metadata = await fetchSpreadsheetMetadata(cleanId, token);
      const targetTab = metadata.sheetNames.includes(sheetTabName) ? sheetTabName : metadata.sheetNames[0] || 'Sheet1';
      setSheetTabName(targetTab);

      const sheetRows = await fetchSpreadsheetRows(cleanId, token, targetTab);
      onSyncSuccess(sheetRows, `Google Sheets (${metadata.title})`);

      setSuccessMessage(
        `Sukses memuat ${sheetRows.length} baris proyek pembangunan dari Google Sheets "${metadata.title}"!`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membaca data dari Google Sheets.');
    } finally {
      setIsSheetSyncing(false);
    }
  };

  // Google Sheets: Push/Export
  const handleExecutePushToSheets = async () => {
    setShowPushConfirmModal(false);
    const cleanId = extractSpreadsheetId(sheetIdInput);
    if (!cleanId) {
      setErrorMessage('Harap masukkan ID atau URL Google Sheets terlebih dahulu.');
      return;
    }

    setIsSheetPushing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error(
          'Token Google belum aktif. Silakan login dengan akun Google terlebih dahulu.'
        );
      }

      localStorage.setItem('sipimb_gsheet_id', cleanId);

      const count = await pushReportsToSpreadsheet(
        cleanId,
        token,
        currentReports,
        sheetTabName.trim() || 'Sheet1'
      );

      setSuccessMessage(
        `Berhasil mengekspor ${count} rekaman proyek pengawasan ke Google Sheets (${sheetTabName})!`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim data ke Google Sheets.');
    } finally {
      setIsSheetPushing(false);
    }
  };

  // Simulation for Google Form
  const handleSimulateGoogleForm = () => {
    const sampleSubmissions: ProjectReport[] = [
      {
        id: `GF-2026-${Math.floor(100 + Math.random() * 900)}`,
        tanggal: new Date().toISOString().split('T')[0],
        nama: 'Pembangunan Wisma Pelangi Masohi',
        jenis: 'Gedung Komersial',
        kecamatan: 'Kota Masohi',
        alamat: 'Jl. Pemuda No. 45, Kelurahan Namaelo',
        status: 'Sedang Proses',
        lat: -3.3156,
        lng: 128.9542,
        foto: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=500&auto=format&fit=crop&q=60',
        keterangan: 'Laporan Form Warga: Rekomendasi teknis tata ruang sedang diverifikasi.',
        verified: false,
        source: 'google_form',
      },
      {
        id: `GF-2026-${Math.floor(100 + Math.random() * 900)}`,
        tanggal: new Date().toISOString().split('T')[0],
        nama: 'Gudang CV Seram Bersatu',
        jenis: 'Gudang / Pabrik',
        kecamatan: 'Amahai',
        alamat: 'Jalur Lintas Seram, Amahai Barat',
        status: 'Belum IMB',
        lat: -3.3398,
        lng: 128.9189,
        foto: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&auto=format&fit=crop&q=60',
        keterangan: 'Laporan Form Warga: Belum memiliki izin resmi PBG.',
        verified: false,
        source: 'google_form',
      },
    ];

    onSyncSuccess(sampleSubmissions, 'Formulir Pelaporan Warga (Simulasi Real-Time)');
    setSuccessMessage('2 data respons Google Form berhasil disimulasikan & masuk ke Peta Satelit!');
  };

  // Simulation for Google Sheets
  const handleSimulateGoogleSheets = () => {
    const sampleRows: ProjectReport[] = [
      {
        id: `GS-2026-${Math.floor(100 + Math.random() * 900)}`,
        tanggal: new Date().toISOString().split('T')[0],
        nama: 'Ruko Baru Saparua Indah',
        jenis: 'Ruko / Toko',
        kecamatan: 'Saparua',
        alamat: 'Jl. Pasar Kota Saparua, Maluku Tengah',
        status: 'Belum IMB',
        lat: -3.575,
        lng: 128.625,
        foto: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=500&auto=format&fit=crop&q=60',
        keterangan: 'Sinkronisasi Spreadsheet: Belum terdaftar pada portal SIMBG Maluku Tengah.',
        verified: false,
        source: 'google_form',
      },
      {
        id: `GS-2026-${Math.floor(100 + Math.random() * 900)}`,
        tanggal: new Date().toISOString().split('T')[0],
        nama: 'Penginapan Wisata Banda Naira Resort',
        jenis: 'Gedung Komersial',
        kecamatan: 'Banda',
        alamat: 'Desa Nusantara, Kepulauan Banda',
        status: 'Sudah IMB',
        lat: -4.526,
        lng: 129.901,
        foto: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=500&auto=format&fit=crop&q=60',
        keterangan: 'Sinkronisasi Spreadsheet: Surat Persetujuan Bangunan Gedung (PBG) sah.',
        verified: true,
        verifiedDate: new Date().toISOString().split('T')[0],
        source: 'google_form',
      },
    ];

    onSyncSuccess(sampleRows, 'Google Sheets Terpadu Satpol PP (Simulasi)');
    setSuccessMessage('2 baris data dari Google Sheets berhasil disinkronkan ke Dashboard & Peta Satelit!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 p-5 border-b border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Integrasi Google Forms & Google Sheets
              </h3>
              <p className="text-xs text-emerald-200/70">
                SIP-BG Satpol PP Kabupaten Maluku Tengah • Sinkronisasi Data Real-Time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>

        {/* Tab Navigation: Forms vs Sheets */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 pt-3 gap-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('forms')}
            className={`pb-3 font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'forms'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Forms (Laporan Warga)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheets')}
            className={`pb-3 font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'sheets'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Google Sheets (Spreadsheet Database)</span>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* Shared Step 1: Authentication */}
          <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/40">
                  1
                </span>
                <h4 className="font-bold text-sm text-white">Otentikasi Akun Google</h4>
              </div>
              {user && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Terhubung (Forms & Sheets)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300">
              Masuk dengan akun Google untuk memberikan otorisasi membaca formulir Google Forms dan membaca/menulis ke Google Sheets secara aman.
            </p>

            {user ? (
              <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{user.displayName || 'Pengguna Google'}</p>
                    <p className="text-[11px] text-slate-400">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-600 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md transition disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>
                    {isSigningIn ? 'Menghubungkan Akun Google...' : 'Sign in with Google'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* TAB 1: GOOGLE FORMS */}
          {activeTab === 'forms' && (
            <div className="space-y-4">
              <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/40">
                    2
                  </span>
                  <h4 className="font-bold text-sm text-white">Masukkan Form ID / Tautan Google Form</h4>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Google Form ID atau URL Lengkap
                  </label>
                  <input
                    type="text"
                    value={formIdInput}
                    onChange={(e) => setFormIdInput(e.target.value)}
                    placeholder="Contoh: 1FAIpQLSc... atau https://docs.google.com/forms/d/e/.../viewform"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSyncForm}
                    disabled={isSyncing || !user}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Mengambil Respons...' : 'Sinkronkan Google Form'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateGoogleForm}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-semibold py-2.5 px-3 rounded-xl transition text-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Simulasi Form</span>
                  </button>
                </div>
              </div>

              {/* Real-time Toggle */}
              <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/80 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-4 h-4 ${autoSyncEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                    <h4 className="font-bold text-xs text-white">Sinkronisasi Otomatis Real-Time (15 Detik)</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Memantau kiriman baru secara otomatis sehingga peta satelit langsung diperbarui.
                  </p>
                  {lastSyncTime && (
                    <p className="text-[10px] text-emerald-400">Terakhir sinkron: {lastSyncTime}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onToggleAutoSync(!autoSyncEnabled)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                    autoSyncEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {autoSyncEnabled ? 'Otomatis: AKTIF' : 'Otomatis: NONAKTIF'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center border border-teal-500/40">
                    2
                  </span>
                  <h4 className="font-bold text-sm text-white">Pengaturan Spreadsheet Google Sheets</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Spreadsheet ID atau URL Lengkap
                    </label>
                    <input
                      type="text"
                      value={sheetIdInput}
                      onChange={(e) => setSheetIdInput(e.target.value)}
                      placeholder="Contoh: 1BxiMVs0... atau https://docs.google.com/spreadsheets/d/.../edit"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Sheet (Tab)
                    </label>
                    <input
                      type="text"
                      value={sheetTabName}
                      onChange={(e) => setSheetTabName(e.target.value)}
                      placeholder="Sheet1"
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSyncSheets}
                    disabled={isSheetSyncing || !user}
                    className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <DownloadCloud className={`w-3.5 h-3.5 ${isSheetSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSheetSyncing ? 'Membaca Data Sheets...' : 'Tarik Data dari Google Sheets'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPushConfirmModal(true)}
                    disabled={isSheetPushing || !user || currentReports.length === 0}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-3 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <UploadCloud className={`w-3.5 h-3.5 ${isSheetPushing ? 'animate-spin' : ''}`} />
                    <span>Ekspor Data ke Sheets ({currentReports.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateGoogleSheets}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-semibold py-2.5 px-3 rounded-xl transition text-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Simulasi Sheets</span>
                  </button>
                </div>
              </div>

              {/* Structure Explanation for Google Sheets */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <h5 className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-teal-400" />
                  Format Kolom Google Sheets yang Didukung Otomatis:
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400 font-mono">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <strong className="text-white block">ID Register</strong> Kolom A
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <strong className="text-white block">Nama Bangunan</strong> Kolom B
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <strong className="text-white block">Jenis / Tipe</strong> Kolom C
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <strong className="text-white block">Kecamatan</strong> Kolom D
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <strong className="text-white block">Alamat</strong> Kolom E
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <strong className="text-white block">Status IMB/PBG</strong> Kolom F
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <strong className="text-white block">Latitude</strong> Kolom G
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <strong className="text-white block">Longitude</strong> Kolom H
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Feedback */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/70 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/70 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Terhubung dengan Google Forms API & Google Sheets API v4
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Writing to Google Sheets */}
      {showPushConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Konfirmasi Ekspor Google Sheets</h4>
                <p className="text-slate-400 text-[11px]">Tindakan Menulis Data ke Spreadsheet</p>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Anda akan mengekspor sebanyak <strong className="text-emerald-400">{currentReports.length} data proyek</strong> ke Google Spreadsheet (Sheet: <strong className="text-white">{sheetTabName}</strong>). Baris lama di lembar kerja tersebut akan diperbarui dengan data sistem SIP-BG terkini.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleExecutePushToSheets}
                className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-xl transition shadow"
              >
                Ya, Lanjutkan Ekspor
              </button>
              <button
                type="button"
                onClick={() => setShowPushConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
