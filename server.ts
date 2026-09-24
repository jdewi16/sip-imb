import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Google GenAI with recommended telemetry
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SIP-IMB Maluku Tengah API',
    hasApiKey: !!apiKey,
    time: new Date().toISOString(),
  });
});

// AI Maps Grounding & Geographic Analysis Endpoint
app.post('/api/ai/analyze-project', async (req, res) => {
  try {
    const { name, address, kecamatan, lat, lng, buildingType, status, description } = req.body;

    if (!apiKey) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY belum dikonfigurasi di server Secrets.',
      });
    }

    const latitude = typeof lat === 'number' ? lat : parseFloat(lat);
    const longitude = typeof lng === 'number' ? lng : parseFloat(lng);

    const prompt = `Anda adalah Asisten Analis Tata Ruang & Pengawasan Fisik Bangunan untuk Satpol PP Kabupaten Maluku Tengah.
Lakukan analisis spasial & geospasial real-time berbasis Google Maps untuk lokasi proyek bangunan berikut:

- Nama Bangunan/Proyek: ${name || 'Bangunan'}
- Jenis Bangunan: ${buildingType || 'Umum'}
- Status IMB/PBG Saat Ini: ${status || 'Dalam Pemeriksaan'}
- Alamat: ${address || 'Tidak ditentukan'}
- Kecamatan: ${kecamatan || 'Maluku Tengah'}
- Titik Koordinat: Latitude ${latitude}, Longitude ${longitude}
- Catatan Tambahan: ${description || '-'}

Tugas Anda dengan data satelit & Google Maps:
1. Identifikasi lingkungan sekitar pada koordinat ini (apakah dekat pesisir pantai, jalan arteri, pusat perkotaan Masohi/Amahai/Banda, atau perbukitan).
2. Tinjau potensi pelanggaran tata ruang atau garis sempadan (Sempadan Jalan/Sempadan Pantai/Kawasan Lindung) berdasarkan lokasi ini di Maluku Tengah.
3. Berikan rekomendasi langkah penertiban lapangan konkret untuk Satpol PP (misal: pemasangan plang pengawasan, cek berkas rekomendasi teknis Dinas PUPR, atau penerbitan SP1/SP2/SP3).
4. Buat rangkuman ringkas, profesional, dan gunakan poin-poin tegas.`;

    const config: any = {
      tools: [{ googleMaps: {} }],
    };

    if (!isNaN(latitude) && !isNaN(longitude)) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude,
            longitude,
          },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config,
    });

    const analysisText = response.text || 'Analisis lokasi tidak dapat dihasilkan.';
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Extract links from maps grounding chunks
    const mapsLinks: Array<{ title: string; uri: string }> = [];
    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks as any[]) {
        if (chunk.maps?.uri) {
          mapsLinks.push({
            title: chunk.maps.title || 'Lokasi Google Maps',
            uri: chunk.maps.uri,
          });
        }
        if (chunk.web?.uri) {
          mapsLinks.push({
            title: chunk.web.title || 'Tautan Verifikasi',
            uri: chunk.web.uri,
          });
        }
      }
    }

    return res.json({
      success: true,
      analysis: analysisText,
      groundingChunks,
      mapsLinks,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating AI maps analysis:', error);
    return res.status(500).json({
      error: error.message || 'Gagal menghasilkan analisis geospasial AI.',
    });
  }
});

// Setup Vite in development or static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIP-IMB Server] Running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
