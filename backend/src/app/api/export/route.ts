import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { Prisma } from '@prisma/client';
import { getAuthUser } from '../../../../lib/auth-utils';
export { OPTIONS } from '../../../../lib/cors';

// ─── GET /api/export — Export data ke CSV / Excel / PDF ─────────────────────
//
// Query params:
//   type: 'reports' | 'reservations'
//   format: 'csv' | 'excel' | 'pdf' (default: csv)
//   status: filter by status
//   facility_id: filter by facility
//   date_from: filter dari tanggal (YYYY-MM-DD)
//   date_to: filter sampai tanggal (YYYY-MM-DD)

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.userId ?? null;
    const userRole = authUser?.role ?? null;

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Autentikasi diperlukan' },
        { status: 401 }
      );
    }

    // Hanya admin dan petugas yang bisa export
    if (userRole !== 'admin' && userRole !== 'officer') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin dan petugas yang bisa mengekspor data.' },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') || 'reports';
    const format = searchParams.get('format') || 'csv';
    const status = searchParams.get('status');
    const facilityId = searchParams.get('facility_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const filters = { status, facilityId, dateFrom, dateTo };

    if (type === 'reports') {
      return exportReports(filters, format);
    } else if (type === 'reservations') {
      return exportReservations(filters, format);
    } else {
      return NextResponse.json(
        { error: 'Tipe export tidak valid. Gunakan: reports atau reservations' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('GET /api/export error:', error);
    return NextResponse.json(
      { error: 'Gagal mengekspor data' },
      { status: 500 }
    );
  }
}

// ─── Format builders ──────────────────────────────────────────────────────────

function buildCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

function buildExcelXml(headers: string[], rows: string[][], title: string): string {
  // Generate a proper Excel XML Spreadsheet (supported by Excel, LibreOffice, Google Sheets)
  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const headerCells = headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join('');

  const dataRows = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          // Remove CSV quotes
          const clean = cell.replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
          return `<Cell><Data ss:Type="String">${escapeXml(clean)}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF" ss:Bold="1"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(title)}">
    <Table>
      <Row ss:StyleID="header">${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

function buildPdfHtml(headers: string[], rows: string[][], title: string, dateRange: string): string {
  const headerCells = headers
    .map((h) => `<th style="border:1px solid #ddd;padding:8px 12px;background:#4472C4;color:white;font-size:11px;text-align:left;">${h}</th>`)
    .join('');

  const dataRows = rows
    .map((row, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f8f9fa';
      const cells = row
        .map((cell) => {
          const clean = cell.replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
          return `<td style="border:1px solid #ddd;padding:6px 12px;font-size:11px;">${clean}</td>`;
        })
        .join('');
      return `<tr style="background:${bg};">${cells}</tr>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: landscape; margin: 1cm; }
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { font-size: 18px; color: #1a365d; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #666; margin-bottom: 16px; }
    .stats { font-size: 11px; color: #888; margin-bottom: 8px; }
    table { border-collapse: collapse; width: 100%; }
  </style>
</head>
<body>
  <h1>📄 ${title}</h1>
  <p class="subtitle">${dateRange}</p>
  <p class="stats">Total: ${rows.length} data | Diekspor: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${dataRows}</tbody>
  </table>
</body>
</html>`;
}

function formatResponse(
  headers: string[],
  rows: string[][],
  format: string,
  fileBaseName: string,
  title: string,
  dateRange: string
): NextResponse {
  const dateSuffix = new Date().toISOString().split('T')[0];

  if (format === 'excel') {
    const xml = buildExcelXml(headers, rows, title);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileBaseName}_${dateSuffix}.xls"`,
      },
    });
  }

  if (format === 'pdf') {
    const html = buildPdfHtml(headers, rows, title, dateRange);
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileBaseName}_${dateSuffix}.html"`,
      },
    });
  }

  // Default: CSV
  const csv = buildCsv(headers, rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileBaseName}_${dateSuffix}.csv"`,
    },
  });
}

// ─── Helper: Date range label ─────────────────────────────────────────────────

function getDateRangeLabel(dateFrom: string | null, dateTo: string | null): string {
  if (dateFrom && dateTo) {
    return `Periode: ${new Date(dateFrom).toLocaleDateString('id-ID')} — ${new Date(dateTo).toLocaleDateString('id-ID')}`;
  }
  if (dateFrom) {
    return `Dari: ${new Date(dateFrom).toLocaleDateString('id-ID')}`;
  }
  if (dateTo) {
    return `Sampai: ${new Date(dateTo).toLocaleDateString('id-ID')}`;
  }
  return 'Semua periode';
}

// ─── Helper: Export Reports ───────────────────────────────────────────────────

interface ExportFilters {
  status: string | null;
  facilityId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

async function exportReports(filters: ExportFilters, format: string) {
  const where: Prisma.ReportWhereInput = {};

  if (filters.status) {
    where.status = filters.status as Prisma.ReportWhereInput['status'];
  }
  if (filters.facilityId) {
    where.facilityId = filters.facilityId;
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }
  }

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      facility: { select: { name: true, location: true, type: true } },
      processor: { select: { name: true } },
    },
  });

  const headers = [
    'ID', 'Tanggal', 'Pelapor', 'Email Pelapor', 'Fasilitas', 'Lokasi',
    'Kategori', 'Deskripsi', 'Status', 'Catatan Resolusi', 'Diproses Oleh', 'Tanggal Diproses',
  ];

  const categoryLabels: Record<string, string> = {
    kerusakan_ringan: 'Kerusakan Ringan',
    kerusakan_berat: 'Kerusakan Berat',
    kebersihan: 'Kebersihan',
    keamanan: 'Keamanan',
    lainnya: 'Lainnya',
  };

  const statusLabels: Record<string, string> = {
    new_report: 'Baru',
    in_progress: 'Sedang Ditangani',
    resolved: 'Selesai',
    rejected: 'Ditolak',
  };

  const rows = reports.map((r) => [
    r.id,
    new Date(r.createdAt).toLocaleDateString('id-ID'),
    r.user.name,
    r.user.email,
    r.facility.name,
    r.facility.location,
    categoryLabels[r.category] || r.category,
    `"${r.description.replace(/"/g, '""')}"`,
    statusLabels[r.status] || r.status,
    r.resolutionNote ? `"${r.resolutionNote.replace(/"/g, '""')}"` : '',
    r.processor?.name || '',
    r.processedAt ? new Date(r.processedAt).toLocaleDateString('id-ID') : '',
  ]);

  return formatResponse(
    headers, rows, format,
    'laporan_kerusakan', 'Laporan Kerusakan Fasilitas',
    getDateRangeLabel(filters.dateFrom, filters.dateTo)
  );
}

// ─── Helper: Export Reservations ──────────────────────────────────────────────

async function exportReservations(filters: ExportFilters, format: string) {
  const where: Prisma.ReservationWhereInput = {};

  if (filters.status) {
    where.status = filters.status as Prisma.ReservationWhereInput['status'];
  }
  if (filters.facilityId) {
    where.facilityId = filters.facilityId;
  }
  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) {
      (where.date as Prisma.DateTimeFilter).gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      (where.date as Prisma.DateTimeFilter).lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }
  }

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      facility: { select: { name: true, location: true, type: true } },
      processor: { select: { name: true } },
    },
  });

  const headers = [
    'ID', 'Tanggal Reservasi', 'Waktu Mulai', 'Waktu Selesai', 'Pemohon', 'Email',
    'Fasilitas', 'Lokasi', 'Keperluan', 'Status', 'Alasan Penolakan', 'Diproses Oleh', 'Tanggal Dibuat',
  ];

  const statusLabels: Record<string, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    cancelled_by_user: 'Dibatalkan (User)',
    cancelled_by_admin: 'Dibatalkan (Petugas)',
  };

  const formatTime = (d: Date) => {
    const h = d.getUTCHours().toString().padStart(2, '0');
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const rows = reservations.map((r) => [
    r.id,
    new Date(r.date).toLocaleDateString('id-ID'),
    formatTime(r.startTime),
    formatTime(r.endTime),
    r.user.name,
    r.user.email,
    r.facility.name,
    r.facility.location,
    `"${r.purpose.replace(/"/g, '""')}"`,
    statusLabels[r.status] || r.status,
    r.rejectionReason ? `"${r.rejectionReason.replace(/"/g, '""')}"` : '',
    r.processor?.name || '',
    new Date(r.createdAt).toLocaleDateString('id-ID'),
  ]);

  return formatResponse(
    headers, rows, format,
    'reservasi', 'Data Reservasi Fasilitas',
    getDateRangeLabel(filters.dateFrom, filters.dateTo)
  );
}
