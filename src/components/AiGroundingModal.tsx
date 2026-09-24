import React, { useState, useEffect } from 'react';
import { ProjectReport } from '../services/googleForms';
import { Sparkles, MapPin, ExternalLink, X, Compass, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AiGroundingModalProps {
  project: ProjectReport | null;
  onClose: () => void;
}

export const AiGroundingModal: React.FC<AiGroundingModalProps> = ({ project, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [mapsLinks, setMapsLinks] = useState<Array<{ title: string; uri: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!project) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setMapsLinks([]);

    try {
      const res = await fetch('/api/ai/analyze-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: project.nama,
          address: project.alamat,
          kecamatan: project.kecamatan,
          lat: project.lat,
          lng: project.lng,
          buildingType: project.jenis,
          status: project.status,
          description: project.keterangan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses analisis Google Maps AI.');
      }

      setAnalysis(data.analysis);
      setMapsLinks(data.mapsLinks || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem saat menghubungi Gemini AI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project) {
      runAnalysis();
    }
  }, [project]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900/80 via-purple-900/60 to-slate-900 p-5 border-b border-indigo-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Analisis Lokasi & Google Maps Grounding
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-semibold border border-indigo-500/40">
                  Gemini 3.8 Flash + Maps
                </span>
              </h3>
              <p className="text-xs text-indigo-200/70">
                Verifikasi real-time lingkungan sekitar, akses jalan, sempadan & tata ruang Maluku Tengah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Project Summary Banner */}
          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-amber-400 font-mono font-bold">{project.id}</span>
              <h4 className="text-sm font-bold text-white mt-0.5">{project.nama}</h4>
              <p className="text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                {project.alamat} ({project.kecamatan})
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="px-2.5 py-1 rounded-full font-bold text-[11px] border bg-slate-900 border-slate-700 text-slate-300">
                {project.status}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                GPS: {project.lat.toFixed(5)}, {project.lng.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-indigo-300">
                Mengakses Data Google Maps Grounding...
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Memindai peta satelit, jaringan jalan, dan parameter tata ruang di sekitar {project.kecamatan}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-400">
                <AlertCircle className="w-4 h-4" />
                Gagal Memproses Analisis
              </div>
              <p>{error}</p>
              <button
                onClick={runAnalysis}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Lagi
              </button>
            </div>
          )}

          {/* Analysis Result */}
          {analysis && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    Laporan Geospasial Satpol PP
                  </span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tervalidasi Grounding
                  </span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
                  {analysis}
                </div>
              </div>

              {/* Official Google Maps Verified Sources */}
              {mapsLinks.length > 0 && (
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80 space-y-2">
                  <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    Tautan Google Maps Terverifikasi:
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {mapsLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold transition"
                      >
                        <span>{link.title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${project.lat},${project.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
          >
            <span>Buka Langsung di Google Maps Web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
          >
            Tutup Analisis
          </button>
        </div>
      </div>
    </div>
  );
};
