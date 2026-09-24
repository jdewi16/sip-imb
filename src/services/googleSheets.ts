import { ProjectReport } from './googleForms';

export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];

  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  sheetNames: string[];
}

export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetMetadata> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Gagal membaca Google Sheets (HTTP ${res.status}): ${errorText || res.statusText}`
    );
  }

  const data = await res.json();
  const sheetNames = (data.sheets || []).map(
    (s: any) => s.properties?.title || 'Sheet1'
  );

  return {
    spreadsheetId: data.spreadsheetId || cleanId,
    title: data.properties?.title || 'Data Pengawasan SIP-BG',
    sheetNames,
  };
}

export async function fetchSpreadsheetRows(
  spreadsheetId: string,
  accessToken: string,
  rangeName?: string
): Promise<ProjectReport[]> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = encodeURIComponent(rangeName || 'Sheet1!A1:Z500');

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal mengambil data baris (HTTP ${res.status}): ${errText}`);
  }

  const data = await res.json();
  const values: string[][] = data.values || [];
  if (values.length < 2) return [];

  const headers = values[0].map((h) => (h || '').toString().toLowerCase().trim());

  const getIdx = (keywords: string[]) => {
    return headers.findIndex((h) => keywords.some((kw) => h.includes(kw)));
  };

  const idIdx = getIdx(['id', 'register', 'kode']);
  const tglIdx = getIdx(['tanggal', 'tgl', 'date']);
  const namaIdx = getIdx(['nama', 'pemilik', 'bangunan', 'gedung', 'proyek']);
  const jenisIdx = getIdx(['jenis', 'tipe', 'fungsi']);
  const kecIdx = getIdx(['kecamatan', 'wilayah']);
  const alamatIdx = getIdx(['alamat', 'lokasi']);
  const statusIdx = getIdx(['status', 'imb', 'pbg', 'izin']);
  const latIdx = getIdx(['latitude', 'lat']);
  const lngIdx = getIdx(['longitude', 'lng', 'long']);
  const coordIdx = getIdx(['koordinat', 'gps']);
  const fotoIdx = getIdx(['foto', 'gambar', 'url']);
  const ketIdx = getIdx(['keterangan', 'catatan', 'deskripsi']);
  const verIdx = getIdx(['verifikasi', 'verified']);

  const reports: ProjectReport[] = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length === 0 || !row.some((cell) => cell && cell.trim() !== '')) {
      continue;
    }

    const id = idIdx !== -1 && row[idIdx] ? row[idIdx].trim() : `GS-${i}`;
    const tanggal = tglIdx !== -1 && row[tglIdx] ? row[tglIdx].trim() : new Date().toISOString().split('T')[0];
    const nama = namaIdx !== -1 && row[namaIdx] ? row[namaIdx].trim() : `Bangunan Baris ${i}`;
    const jenis = jenisIdx !== -1 && row[jenisIdx] ? row[jenisIdx].trim() : 'Ruko / Toko';
    const kecamatan = kecIdx !== -1 && row[kecIdx] ? row[kecIdx].trim() : 'Kota Masohi';
    const alamat = alamatIdx !== -1 && row[alamatIdx] ? row[alamatIdx].trim() : 'Maluku Tengah';
    const rawStatus = statusIdx !== -1 && row[statusIdx] ? row[statusIdx].trim().toLowerCase() : '';

    let status: 'Sudah IMB' | 'Sedang Proses' | 'Belum IMB' = 'Belum IMB';
    if (rawStatus.includes('sudah') || rawStatus.includes('lengkap') || rawStatus.includes('ada') || rawStatus.includes('terbit')) {
      status = 'Sudah IMB';
    } else if (rawStatus.includes('proses') || rawStatus.includes('kaji')) {
      status = 'Sedang Proses';
    }

    let lat = -3.3135;
    let lng = 128.9521;

    if (latIdx !== -1 && lngIdx !== -1 && row[latIdx] && row[lngIdx]) {
      const pLat = parseFloat(row[latIdx]);
      const pLng = parseFloat(row[lngIdx]);
      if (!isNaN(pLat) && !isNaN(pLng)) {
        lat = pLat;
        lng = pLng;
      }
    } else if (coordIdx !== -1 && row[coordIdx]) {
      const parts = row[coordIdx].split(/[,;\s]+/).map((n) => parseFloat(n.trim())).filter((n) => !isNaN(n));
      if (parts.length >= 2) {
        lat = parts[0];
        lng = parts[1];
      }
    }

    const foto =
      fotoIdx !== -1 && row[fotoIdx] && row[fotoIdx].startsWith('http')
        ? row[fotoIdx].trim()
        : 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=500&auto=format&fit=crop&q=60';

    const keterangan =
      ketIdx !== -1 && row[ketIdx] ? row[ketIdx].trim() : 'Data sinkronisasi dari Google Sheets.';

    const verified =
      verIdx !== -1 && row[verIdx]
        ? row[verIdx].toLowerCase().includes('ya') ||
          row[verIdx].toLowerCase().includes('true') ||
          row[verIdx].toLowerCase().includes('terverifikasi')
        : false;

    reports.push({
      id: id.startsWith('IMB-') || id.startsWith('BG-') || id.startsWith('GF-') || id.startsWith('GS-') ? id : `GS-${id}`,
      tanggal,
      nama,
      jenis,
      kecamatan,
      alamat,
      status,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      foto,
      keterangan,
      verified,
      source: 'google_form',
    });
  }

  return reports;
}

// Push/Export reports data into Google Sheets
export async function pushReportsToSpreadsheet(
  spreadsheetId: string,
  accessToken: string,
  reports: ProjectReport[],
  targetSheetName: string = 'Sheet1'
): Promise<number> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = encodeURIComponent(`${targetSheetName}!A1:K${reports.length + 1}`);

  const headerRow = [
    'ID Register',
    'Tanggal',
    'Nama Bangunan / Proyek',
    'Jenis Bangunan',
    'Kecamatan',
    'Alamat',
    'Status IMB/PBG',
    'Latitude',
    'Longitude',
    'Verifikasi Satpol PP',
    'Keterangan',
  ];

  const dataRows = reports.map((r) => [
    r.id,
    r.tanggal,
    r.nama,
    r.jenis,
    r.kecamatan,
    r.alamat,
    r.status,
    r.lat,
    r.lng,
    r.verified ? 'TERVERIFIKASI' : 'BELUM',
    r.keterangan || '-',
  ]);

  const body = {
    range: `${targetSheetName}!A1`,
    majorDimension: 'ROWS',
    values: [headerRow, ...dataRows],
  };

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menulis data ke Google Sheets (HTTP ${res.status}): ${errText}`);
  }

  return reports.length;
}
