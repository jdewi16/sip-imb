export interface ProjectReport {
  id: string;
  tanggal: string;
  nama: string;
  jenis: string;
  kecamatan: string;
  alamat: string;
  status: 'Sudah IMB' | 'Sedang Proses' | 'Belum IMB';
  lat: number;
  lng: number;
  foto: string;
  keterangan: string;
  verified: boolean;
  verifiedDate?: string;
  source?: 'google_form' | 'manual' | 'sample';
}

export interface GoogleFormQuestion {
  id: string;
  title: string;
}

export interface GoogleFormDetails {
  formId: string;
  title: string;
  description?: string;
  questions: GoogleFormQuestion[];
  responderUri?: string;
}

// Extract clean Form ID from either a raw ID or full Google Form URL
export function extractFormId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Matching: https://docs.google.com/forms/d/e/.../viewform or /forms/d/{formId}/edit
  const matchD = trimmed.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];

  const matchE = trimmed.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]+)/);
  if (matchE && matchE[1]) return matchE[1];

  // If already an ID
  if (/^[a-zA-Z0-9_-]{16,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

// Fetch Google Form schema metadata
export async function fetchGoogleFormDetails(
  formId: string,
  accessToken: string
): Promise<GoogleFormDetails> {
  const cleanId = extractFormId(formId);
  const response = await fetch(`https://forms.googleapis.com/v1/forms/${cleanId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gagal mengambil formulir Google (HTTP ${response.status}): ${errorBody || response.statusText}`
    );
  }

  const data = await response.json();
  const questions: GoogleFormQuestion[] = [];

  if (Array.isArray(data.items)) {
    for (const item of data.items) {
      if (item.questionItem?.question?.questionId) {
        questions.push({
          id: item.questionItem.question.questionId,
          title: item.title || 'Pertanyaan',
        });
      }
    }
  }

  return {
    formId: data.formId || cleanId,
    title: data.info?.title || 'Formulir Pelaporan IMB Maluku Tengah',
    description: data.info?.description || '',
    questions,
    responderUri: data.responderUri,
  };
}

// Fetch Google Form responses and convert them into ProjectReports
export async function fetchGoogleFormResponses(
  formId: string,
  accessToken: string,
  questionsLookup?: Record<string, string>
): Promise<ProjectReport[]> {
  const cleanId = extractFormId(formId);
  const response = await fetch(
    `https://forms.googleapis.com/v1/forms/${cleanId}/responses`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gagal mengambil respons formulir (HTTP ${response.status}): ${errorBody || response.statusText}`
    );
  }

  const data = await response.json();
  const submissions: ProjectReport[] = [];

  if (!data.responses || !Array.isArray(data.responses)) {
    return [];
  }

  for (const resp of data.responses) {
    const responseId = resp.responseId || `GF-${Math.random().toString(36).substring(2, 8)}`;
    const submitTime = resp.lastSubmittedTime || resp.createTime || new Date().toISOString();
    const dateStr = submitTime.split('T')[0];

    // Collect field answers by question title if available
    const answerMap: Record<string, string> = {};
    if (resp.answers) {
      for (const [qId, qData] of Object.entries<any>(resp.answers)) {
        const textVal = qData.textAnswers?.answers?.[0]?.value || '';
        const qTitle = (questionsLookup?.[qId] || qId).toLowerCase();
        answerMap[qTitle] = textVal;
      }
    }

    // Heuristic matching based on Indonesian question titles
    const findAnswer = (keywords: string[], fallback = ''): string => {
      for (const [key, val] of Object.entries(answerMap)) {
        for (const kw of keywords) {
          if (key.includes(kw.toLowerCase()) && val) {
            return val;
          }
        }
      }
      return fallback;
    };

    const nama = findAnswer(['nama', 'pemilik', 'gedung', 'proyek', 'bangunan'], 'Bangunan Tanpa Nama');
    const jenis = findAnswer(['jenis', 'fungsi', 'tipe'], 'Ruko / Toko');
    const kecamatan = findAnswer(['kecamatan', 'wilayah'], 'Kota Masohi');
    const alamat = findAnswer(['alamat', 'lokasi', 'jalan', 'patokan'], 'Kawasan Masohi, Maluku Tengah');
    const rawStatus = findAnswer(['status', 'izin', 'imb', 'pbg'], 'Belum IMB');
    const rawCoords = findAnswer(['koordinat', 'gps', 'lat', 'long', 'titik'], '');
    const keterangan = findAnswer(['keterangan', 'catatan', 'deskripsi', 'detail'], 'Data sinkronisasi otomatis Google Form.');
    const foto = findAnswer(['foto', 'gambar', 'unggah', 'dokumen'], 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=500&auto=format&fit=crop&q=60');

    // Parse status
    let status: 'Sudah IMB' | 'Sedang Proses' | 'Belum IMB' = 'Belum IMB';
    if (rawStatus.toLowerCase().includes('sudah') || rawStatus.toLowerCase().includes('lengkap') || rawStatus.toLowerCase().includes('ada')) {
      status = 'Sudah IMB';
    } else if (rawStatus.toLowerCase().includes('proses') || rawStatus.toLowerCase().includes('pengurusan')) {
      status = 'Sedang Proses';
    }

    // Parse coordinates or fallback to default coordinates around Masohi
    let lat = -3.3135;
    let lng = 128.9521;
    if (rawCoords) {
      const parts = rawCoords.split(/[,;\s]+/).map((p) => parseFloat(p.trim())).filter((n) => !isNaN(n));
      if (parts.length >= 2) {
        lat = parts[0];
        lng = parts[1];
      }
    } else {
      // Check if lat/lng are separate questions
      const latVal = parseFloat(findAnswer(['latitude', 'lat'], ''));
      const lngVal = parseFloat(findAnswer(['longitude', 'lng', 'long'], ''));
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        lat = latVal;
        lng = lngVal;
      } else {
        // Slight random jitter around Masohi center so markers don't overlap completely
        lat = -3.3135 + (Math.random() - 0.5) * 0.02;
        lng = 128.9521 + (Math.random() - 0.5) * 0.02;
      }
    }

    submissions.push({
      id: `GF-${responseId.substring(0, 10).toUpperCase()}`,
      tanggal: dateStr,
      nama,
      jenis,
      kecamatan,
      alamat,
      status,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      foto,
      keterangan,
      verified: false,
      source: 'google_form',
    });
  }

  return submissions;
}
