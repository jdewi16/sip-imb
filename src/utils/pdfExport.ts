import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectReport } from '../services/googleForms';

// Helper to load image as base64 for jsPDF rendering
async function loadBase64Image(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    if (url.startsWith('data:image')) return resolve(url);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 200, 150);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
          return;
        }
      } catch (e) {
        // Tainted canvas fallback
      }
      resolve(null);
    };
    img.onerror = () => resolve(null);
    img.src = url;

    // Safety timeout in case image server is slow
    setTimeout(() => resolve(null), 2000);
  });
}

// Generate fallback placeholder image data if photo is unavailable or CORS-blocked
function createFallbackImage(text: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Red & white background
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 200, 75);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 75, 200, 75);

    // Border
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 196, 146);

    // Text
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('FOTO DOKUMENTASI', 100, 48);

    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText(text.slice(0, 20), 100, 115);
  }
  return canvas.toDataURL('image/jpeg', 0.9);
}

export async function exportProjectsToPDF(reports: ProjectReport[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Pre-load all report images in parallel
  const imageMap: Record<string, string> = {};
  await Promise.all(
    reports.map(async (item) => {
      const base64 = await loadBase64Image(item.foto);
      imageMap[item.id] = base64 || createFallbackImage(item.id);
    })
  );

  // --- HALAMAN 1: TABEL REKAPITULASI RESMI DENGAN FOTO BANGUNAN ---
  // Kop Surat Pemerintah Bernuansa Merah Putih
  // Pita Merah Putih di tepi atas
  doc.setFillColor(185, 28, 28); // Merah (#b91c1c)
  doc.rect(0, 0, 297, 4, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 4, 297, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('PEMERINTAH KABUPATEN MALUKU TENGAH', 148, 15, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(185, 28, 28); // Merah Resmi Satpol PP
  doc.text('SATUAN POLISI PAMONG PRAJA (SATPOL PP)', 148, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Jl. Buano, Kota Masohi, Kabupaten Maluku Tengah, Provinsi Maluku - Kode Pos 97511',
    148,
    27,
    { align: 'center' }
  );

  // Garis Ganda Pembatas Merah & Hitam
  doc.setLineWidth(1.2);
  doc.setDrawColor(185, 28, 28);
  doc.line(14, 30, 283, 30);
  doc.setLineWidth(0.3);
  doc.setDrawColor(15, 23, 42);
  doc.line(14, 31.5, 283, 31.5);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(185, 28, 28);
  doc.text(
    'REKAPITULASI PENGAWASAN BANGUNAN GEDUNG (SIP-BG)',
    148,
    37.5,
    { align: 'center' }
  );

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tanggal Cetak: ${printDate} | Sistem Informasi Pengawasan Bangunan Gedung (SIP-BG)`, 14, 43);

  // Summary Metrics Badge
  const total = reports.length;
  const sudah = reports.filter((r) => r.status === 'Sudah IMB').length;
  const proses = reports.filter((r) => r.status === 'Sedang Proses').length;
  const belum = reports.filter((r) => r.status === 'Belum IMB').length;
  const verified = reports.filter((r) => r.verified).length;

  doc.setFillColor(254, 242, 242); // Merah muda lembut
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(14, 45, 269, 7, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(153, 27, 27);
  doc.text(
    `TOTAL TERDATA: ${total} BANGUNAN   |   SUDAH PBG: ${sudah}   |   SEDANG PROSES: ${proses}   |   BELUM MEMILIKI IZIN: ${belum}   |   TERVERIFIKASI SATPOL PP: ${verified}`,
    148,
    49.7,
    { align: 'center' }
  );

  // Table Columns with Building Photo (Foto Bangunan)
  const tableColumns = [
    'No',
    'Foto Fisik Bangunan',
    'ID Register',
    'Tanggal',
    'Nama Bangunan / Pemilik',
    'Jenis Bangunan',
    'Wilayah & Alamat',
    'Status PBG',
    'Koordinat Satelit',
    'Verifikasi',
  ];

  const tableRows = reports.map((item, idx) => [
    idx + 1,
    '', // Cell placeholder for image drawing
    item.id,
    item.tanggal,
    item.nama,
    item.jenis,
    `${item.kecamatan}\n${item.alamat}`,
    item.status,
    `${item.lat.toFixed(4)},\n${item.lng.toFixed(4)}`,
    item.verified ? 'TERVERIFIKASI' : 'BELUM',
  ]);

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 54,
    theme: 'grid',
    headStyles: {
      fillColor: [185, 28, 28], // Merah resmi
      textColor: [255, 255, 255], // Putih
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
      minCellHeight: 9,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      minCellHeight: 18, // Ample space for building thumbnail
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' }, // Foto Bangunan
      2: { cellWidth: 23, fontStyle: 'bold', halign: 'center' },
      3: { cellWidth: 19, halign: 'center' },
      4: { cellWidth: 42, fontStyle: 'bold' },
      5: { cellWidth: 28 },
      6: { cellWidth: 50 },
      7: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 24, halign: 'center' },
      9: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [255, 245, 245], // Nuansa Merah-Putih selang-seling
    },
    didDrawCell: (data) => {
      // Draw building thumbnail inside Column 1 (Foto Bangunan)
      if (data.section === 'body' && data.column.index === 1) {
        const report = reports[data.row.index];
        if (report && imageMap[report.id]) {
          const imgData = imageMap[report.id];
          const imgWidth = 22;
          const imgHeight = 15;
          const x = data.cell.x + (data.cell.width - imgWidth) / 2;
          const y = data.cell.y + (data.cell.height - imgHeight) / 2;

          try {
            doc.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);
            // Thin red-white border around photo
            doc.setDrawColor(185, 28, 28);
            doc.setLineWidth(0.3);
            doc.rect(x, y, imgWidth, imgHeight);
          } catch (e) {
            // Ignore image drawing errors
          }
        }
      }

      // Colorize Status PBG column
      if (data.section === 'body' && data.column.index === 7) {
        const status = data.cell.raw;
        if (status === 'Sudah IMB') {
          doc.setTextColor(22, 101, 52);
        } else if (status === 'Sedang Proses') {
          doc.setTextColor(180, 83, 9);
        } else {
          doc.setTextColor(185, 28, 28);
        }
      }
    },
  });

  // Signature Block Satpol PP Maluku Tengah
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  let signatureY = finalY + 10;

  // If table extends close to the bottom, create a new page for signature
  if (signatureY > 170) {
    doc.addPage();
    // Red-white top banner on new page
    doc.setFillColor(185, 28, 28);
    doc.rect(0, 0, 297, 4, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 4, 297, 2, 'F');
    signatureY = 25;
  }

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Masohi, ${printDate}`, 215, signatureY);
  doc.text('Kepala Satuan Polisi Pamong Praja', 215, signatureY + 4.5);
  doc.text('Kabupaten Maluku Tengah', 215, signatureY + 9);
  doc.text('( ___________________________ )', 215, signatureY + 28);
  doc.text('NIP. ', 215, signatureY + 33);

  // --- HALAMAN 2: DOKUMENTASI LAMPIRAN FOTO BANGUNAN GEDUNG LENGKAP ---
  doc.addPage();

  // Pita Merah Putih Halaman Lampiran
  doc.setFillColor(185, 28, 28);
  doc.rect(0, 0, 297, 4, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 4, 297, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(185, 28, 28);
  doc.text('LAMPIRAN DOKUMENTASI FOTO BANGUNAN GEDUNG (SIP-BG)', 148, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Satuan Polisi Pamong Praja Kabupaten Maluku Tengah • Pemantauan Citra Satelit & Lapangan', 148, 19, {
    align: 'center',
  });

  doc.setLineWidth(0.6);
  doc.setDrawColor(185, 28, 28);
  doc.line(14, 22, 283, 22);

  // Grid of Photo Cards (3 cards per row, 2 rows per page)
  const cardWidth = 85;
  const cardHeight = 70;
  const startX = 16;
  let currentCardY = 27;

  reports.forEach((item, index) => {
    // If we exceed 6 cards on page 2, add new page
    if (index > 0 && index % 6 === 0) {
      doc.addPage();
      doc.setFillColor(185, 28, 28);
      doc.rect(0, 0, 297, 4, 'F');
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 4, 297, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(185, 28, 28);
      doc.text(`LAMPIRAN DOKUMENTASI FOTO BANGUNAN (Lanjutan ${Math.floor(index / 6) + 1})`, 148, 14, {
        align: 'center',
      });
      doc.setLineWidth(0.6);
      doc.setDrawColor(185, 28, 28);
      doc.line(14, 18, 283, 18);
      currentCardY = 23;
    }

    const colIndex = index % 3;
    const rowIndex = Math.floor((index % 6) / 3);
    const cardX = startX + colIndex * (cardWidth + 6);
    const cardY = currentCardY + rowIndex * (cardHeight + 6);

    // Card border with Merah Putih theme
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.4);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'FD');

    // Header strip of card
    doc.setFillColor(185, 28, 28);
    doc.roundedRect(cardX, cardY, cardWidth, 6, 2, 2, 'F');
    doc.rect(cardX, cardY + 3, cardWidth, 3, 'F'); // Square bottom corners of header

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`${item.id} - ${item.kecamatan}`, cardX + 3, cardY + 4.5);

    // Draw Image
    const imgBase64 = imageMap[item.id];
    if (imgBase64) {
      try {
        doc.addImage(imgBase64, 'JPEG', cardX + 3, cardY + 8, cardWidth - 6, 38);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.2);
        doc.rect(cardX + 3, cardY + 8, cardWidth - 6, 38);
      } catch (e) {
        // ignore
      }
    }

    // Status Badge inside Card
    let badgeColor: [number, number, number] = [185, 28, 28]; // Merah
    if (item.status === 'Sudah IMB') badgeColor = [22, 101, 52]; // Hijau
    else if (item.status === 'Sedang Proses') badgeColor = [180, 83, 9]; // Amber

    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.roundedRect(cardX + cardWidth - 28, cardY + 9.5, 24, 4.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text(item.status, cardX + cardWidth - 16, cardY + 12.8, { align: 'center' });

    // Details Text inside Card
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(item.nama.length > 32 ? item.nama.slice(0, 30) + '...' : item.nama, cardX + 3, cardY + 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Jenis: ${item.jenis} | Tgl: ${item.tanggal}`, cardX + 3, cardY + 54);

    const alamatLine = item.alamat.length > 40 ? item.alamat.slice(0, 38) + '...' : item.alamat;
    doc.text(`Alamat: ${alamatLine}`, cardX + 3, cardY + 58);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text(`GPS: ${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}`, cardX + 3, cardY + 62);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`Verifikasi Satpol PP: ${item.verified ? 'SUDAH' : 'BELUM'}`, cardX + 3, cardY + 66);
  });

  // Save PDF
  doc.save(`Laporan_SIP-BG_SatpolPP_MalukuTengah_${new Date().toISOString().split('T')[0]}.pdf`);
}
