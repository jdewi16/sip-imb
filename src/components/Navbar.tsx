import React, { useState } from 'react';
import {
  Shield,
  MapPin,
  PlusCircle,
  BookOpen,
  UserCheck,
  RefreshCw,
  Radio,
  FileSpreadsheet,
  Menu,
  X,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'report' | 'guide' | 'admin' | 'gforms';
  onSelectTab: (tab: any) => void;
  isAdminLoggedIn: boolean;
  onOpenGoogleFormModal: () => void;
  autoSyncEnabled: boolean;
  totalProjects?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  isAdminLoggedIn,
  onOpenGoogleFormModal,
  autoSyncEnabled,
  totalProjects = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-red-950 via-red-900 to-red-950 backdrop-blur-md border-b-2 border-red-700 text-white shadow-xl shadow-red-950/40">
      {/* Pita Merah Putih di tepi paling atas */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-white to-red-600"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand - Merah Putih Maluku Tengah */}
          <div
            onClick={() => onSelectTab('map')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-700 to-red-500 flex items-center justify-center border-2 border-white/90 shadow-lg shadow-red-950/50 group-hover:scale-105 transition">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-sm">SIP-BG</span>
                <span className="bg-white text-red-700 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider shadow-sm border border-red-200">
                  Malteng
                </span>
                <span className="text-[10px] bg-red-800/80 text-white px-2 py-0.5 rounded-full border border-red-600 hidden sm:inline-block">
                  {totalProjects} Terdata
                </span>
              </div>
              <p className="text-[11px] text-red-100/90 font-medium hidden sm:block">
                Satuan Polisi Pamong Praja Kabupaten Maluku Tengah
              </p>
            </div>
          </div>

          {/* Real-time Indicator & Google Workspace Sync Button */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={onOpenGoogleFormModal}
              className="flex items-center gap-2 bg-red-950/80 hover:bg-red-900/90 text-white border border-red-500/40 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm"
              title="Kelola & Sinkronkan Google Form & Sheets"
            >
              <Radio className={`w-3.5 h-3.5 ${autoSyncEnabled ? 'animate-pulse text-white' : 'text-red-300'}`} />
              <span className="text-red-100">Sync Form & Sheets:</span>
              <span className="bg-white text-red-700 px-1.5 py-0.2 rounded text-[10px] font-bold">
                {autoSyncEnabled ? 'Live' : 'Siap'}
              </span>
              <RefreshCw className="w-3 h-3 text-red-200 ml-1" />
            </button>
          </div>

          {/* Desktop Navigation - Merah Putih */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => onSelectTab('map')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-white text-red-700 shadow-md font-bold'
                  : 'text-red-100 hover:text-white hover:bg-red-800/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Peta Satelit Proyek</span>
            </button>

            <button
              onClick={onOpenGoogleFormModal}
              className="px-3.5 py-2 rounded-xl text-red-100 hover:text-white hover:bg-red-800/60 transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
              <span>Google Form & Sheets</span>
            </button>

            <button
              onClick={() => onSelectTab('report')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'bg-white text-red-700 shadow-md font-bold'
                  : 'text-red-100 hover:text-white hover:bg-red-800/60'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Lapor Bangunan</span>
            </button>

            <button
              onClick={() => onSelectTab('guide')}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-white text-red-700 shadow-md font-bold'
                  : 'text-red-100 hover:text-white hover:bg-red-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Panduan IMB/PBG</span>
            </button>

            <button
              onClick={() => onSelectTab('admin')}
              className={`px-4 py-2 rounded-xl border transition flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-red-700 border-white shadow-md font-bold'
                  : 'bg-red-950/70 text-white border-red-500/50 hover:bg-red-900/80'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-red-300" />
              <span>{isAdminLoggedIn ? 'Dashboard Admin' : 'Portal Admin Satpol PP'}</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={onOpenGoogleFormModal}
              className="p-2 text-white hover:bg-red-800 rounded-xl"
              title="Sync Google Form"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white hover:bg-red-800 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-red-950 border-b border-red-800 px-4 py-3 space-y-1.5 text-xs font-semibold animate-in slide-in-from-top duration-150">
          <button
            onClick={() => {
              onSelectTab('map');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2 ${
              activeTab === 'map' ? 'bg-white text-red-700 font-bold' : 'text-red-100 hover:bg-red-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Peta Satelit Proyek</span>
          </button>

          <button
            onClick={() => {
              onOpenGoogleFormModal();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left p-2.5 rounded-xl text-red-100 hover:bg-red-900 flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Google Form & Sheets</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('report');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2 ${
              activeTab === 'report' ? 'bg-white text-red-700 font-bold' : 'text-red-100 hover:bg-red-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lapor Bangunan</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('guide');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2 ${
              activeTab === 'guide' ? 'bg-white text-red-700 font-bold' : 'text-red-100 hover:bg-red-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Panduan IMB/PBG</span>
          </button>

          <button
            onClick={() => {
              onSelectTab('admin');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left p-2.5 rounded-xl text-white bg-red-800 border border-red-600 flex items-center gap-2 font-bold"
          >
            <UserCheck className="w-4 h-4 text-red-200" />
            <span>{isAdminLoggedIn ? 'Dashboard Admin' : 'Portal Admin Satpol PP'}</span>
          </button>
        </div>
      )}
    </header>
  );
};
