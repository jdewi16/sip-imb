import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ProjectReport } from '../services/googleForms';
import { Layers, Navigation, ExternalLink, Sparkles, MapPin } from 'lucide-react';

interface SatelliteMapProps {
  reports: ProjectReport[];
  onSelectReport: (report: ProjectReport) => void;
  onAnalyzeReport: (report: ProjectReport) => void;
}

export const SatelliteMap: React.FC<SatelliteMapProps> = ({
  reports,
  onSelectReport,
  onAnalyzeReport,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center coordinates Masohi, Maluku Tengah (-3.3135, 128.9521)
    const map = L.map(mapContainerRef.current, {
      center: [-3.3135, 128.9521],
      zoom: 13,
      zoomControl: true,
    });

    // Google Maps Satellite Layers
    const googleHybrid = L.tileLayer(
      'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps Satelit Hybrid',
      }
    );

    const googleSat = L.tileLayer(
      'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps Satelit Murni',
      }
    );

    const googleStreets = L.tileLayer(
      'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps Peta Jalan',
      }
    );

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    });

    // Default to Google Satellite Hybrid for best aerial clarity with labels
    googleHybrid.addTo(map);

    const baseMaps = {
      'Satelit Google Maps (Hybrid)': googleHybrid,
      'Satelit Google Maps (Murni)': googleSat,
      'Peta Jalan Google Maps': googleStreets,
      'OpenStreetMap': osm,
    };

    L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers whenever reports change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    reports.forEach((item) => {
      let pinColor = '#10b981'; // Emerald (Sudah IMB)
      let statusBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      if (item.status === 'Sedang Proses') {
        pinColor = '#f59e0b'; // Amber
        statusBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      } else if (item.status === 'Belum IMB') {
        pinColor = '#f43f5e'; // Rose
        statusBg = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      }

      const icon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: ${pinColor}; width: 34px; height: 34px; border-radius: 9999px; border: 3px solid #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
              <path d="M9 22v-4h6v4"/>
              <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/>
              <path d="M12 10h.01"/><path d="M12 14h.01"/>
              <path d="M16 10h.01"/><path d="M16 14h.01"/>
              <path d="M8 10h.01"/><path d="M8 14h.01"/>
            </svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const gmapsNavUrl = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;

      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-3 text-xs w-64 space-y-2 text-slate-200';
      popupDiv.innerHTML = `
        <div class="relative rounded-lg overflow-hidden border border-slate-700 h-28 bg-slate-800">
          <img src="${item.foto}" class="w-full h-full object-cover" alt="${item.nama}" />
          <div class="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold border ${statusBg}">
            ${item.status}
          </div>
          ${
            item.source === 'google_form'
              ? `<div class="absolute bottom-2 left-2 bg-indigo-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow">
                  Google Form Live
                </div>`
              : ''
          }
        </div>
        <div>
          <h4 class="font-bold text-sm text-white truncate">${item.nama}</h4>
          <p class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <span>📍 ${item.kecamatan} • ${item.jenis}</span>
          </p>
          <p class="text-[11px] text-slate-300 mt-1 line-clamp-2">${item.alamat}</p>
        </div>
        <div class="pt-1 flex flex-col gap-1.5">
          <a href="${gmapsNavUrl}" target="_blank" rel="noreferrer" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-center py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition text-[11px]">
            <span>Buka Google Maps</span>
          </a>
          <button id="btn-analyze-${item.id}" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition text-[11px]">
            <span>Analisis AI & Maps Grounding</span>
          </button>
          <button id="btn-detail-${item.id}" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition text-[11px]">
            <span>Lihat Detail Lengkap</span>
          </button>
        </div>
      `;

      // Attach click listeners
      const btnAnalyze = popupDiv.querySelector(`#btn-analyze-${item.id}`);
      if (btnAnalyze) {
        btnAnalyze.addEventListener('click', () => {
          onAnalyzeReport(item);
        });
      }

      const btnDetail = popupDiv.querySelector(`#btn-detail-${item.id}`);
      if (btnDetail) {
        btnDetail.addEventListener('click', () => {
          onSelectReport(item);
        });
      }

      const marker = L.marker([item.lat, item.lng], { icon });
      marker.bindPopup(popupDiv, { className: 'custom-popup', maxWidth: 300 });
      markersLayerRef.current?.addLayer(marker);
    });
  }, [reports, onSelectReport, onAnalyzeReport]);

  const setViewRegion = (lat: number, lng: number, zoom: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Quick Region Switcher Buttons */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 shadow-lg text-xs">
        <span className="text-[11px] font-bold text-slate-400 px-2 py-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          Fokus:
        </span>
        <button
          onClick={() => setViewRegion(-3.3135, 128.9521, 14)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-600 transition"
        >
          Kota Masohi
        </button>
        <button
          onClick={() => setViewRegion(-3.3421, 128.9214, 14)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-600 transition"
        >
          Amahai
        </button>
        <button
          onClick={() => setViewRegion(-4.5245, 129.8972, 13)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-600 transition"
        >
          Kepulauan Banda
        </button>
        <button
          onClick={() => setViewRegion(-3.575, 128.625, 12)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-600 transition"
        >
          Saparua
        </button>
      </div>

      {/* Satellite Imagery Badge */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-2 text-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-slate-300 font-medium">Satelit Google Maps Aktif</span>
        <span className="text-slate-500">|</span>
        <span className="text-amber-400 font-semibold">{reports.length} Titik Proyek Terpetakan</span>
      </div>
    </div>
  );
};
