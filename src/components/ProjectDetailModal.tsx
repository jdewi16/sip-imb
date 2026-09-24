import React from 'react';
import { ProjectReport } from '../services/googleForms';
import {
  X,
  MapPin,
  Calendar,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Clock,
  Building,
  Tag,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: ProjectReport | null;
  onClose: () => void;
  onOpenAiAnalysis: (project: ProjectReport) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onOpenAiAnalysis,
}) => {
  if (!project) return null;

  let statusBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  if (project.status === 'Sedang Proses') {
    statusBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  } else if (project.status === 'Belum IMB') {
    statusBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  }

  const gmapsNavUrl = `https://www.google.com/maps/search/?api=1&query=${project.lat},${project.lng}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative h-48 sm:h-56 bg-slate-950">
          <img
            src={project.foto}
            alt={project.nama}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white bg-slate-900/70 hover:bg-slate-900 p-2 rounded-xl backdrop-blur-md border border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <div>
              <span className="font-mono text-xs font-bold text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                {project.id}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1 drop-shadow">
                {project.nama}
              </h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge} shrink-0`}>
              {project.status}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
          {/* Verification Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 font-medium">Status Verifikasi Fisik:</span>
            {project.verified ? (
              <span className="inline-flex items-center gap-1.5 text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Terverifikasi Petugas Satpol PP {project.verifiedDate ? `(${project.verifiedDate})` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-slate-400 font-semibold bg-slate-700/40 px-2.5 py-1 rounded-full border border-slate-600">
                <Clock className="w-3.5 h-3.5" />
                Menunggu Peninjauan Lapangan
              </span>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] block">Jenis Bangunan</span>
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                {project.jenis}
              </p>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] block">Wilayah Kecamatan</span>
              <p className="font-semibold text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {project.kecamatan}
              </p>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
              <span className="text-slate-500 text-[11px] block">Alamat Lengkap</span>
              <p className="font-medium text-slate-200">{project.alamat}</p>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] block">Titik Koordinat Satelit GPS</span>
              <p className="font-mono text-emerald-400 font-semibold">
                {project.lat.toFixed(6)}, {project.lng.toFixed(6)}
              </p>
            </div>

            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[11px] block">Tanggal Laporan</span>
              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {project.tanggal}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-400 font-bold block text-[11px]">
              Catatan Lapangan / Keterangan Penertiban:
            </span>
            <p className="text-slate-300 leading-relaxed">{project.keterangan || 'Tidak ada catatan tambahan.'}</p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href={gmapsNavUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl transition text-center flex items-center justify-center gap-2 shadow-lg"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Navigasi Google Maps Satelit</span>
            </a>
            <button
              onClick={() => {
                onClose();
                onOpenAiAnalysis(project);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analisis AI & Maps Grounding</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
