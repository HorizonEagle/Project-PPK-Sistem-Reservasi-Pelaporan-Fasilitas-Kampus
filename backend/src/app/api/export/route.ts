import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { Prisma } from '@prisma/client';

// ─── GET /api/export — Export data ke CSV ─────────────────────────────────────
//
// Query params:
//   type: 'reports' | 'reservations'
//   format: 'csv' (default)
//   status: filter by status
//   facility_id: filter by facility
//   date_from: filter dari tanggal
//   date_to: filter sampai tanggal

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

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
    const status = searchParams.get('status');
    const facilityId = searchParams.get('facility_id');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    if (type === 'reports') {
      return exportReports({ status, facilityId, dateFrom, dateTo });
    } else if (type === 'reservations') {
      return exportReservations({ status, facilityId, dateFrom, dateTo });
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

// ─── Helper: Export Reports ───────────────────────────────────────────────────

async function exportReports(filters: {
  status: string | null;
  facilityId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}) {
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

  // Build CSV
  const headers = [
    'ID',
    'Tanggal',
    'Pelapor',
    'Email Pelapor',
    'Fasilitas',
    'Lokasi',
    'Kategori',
    'Deskripsi',
    'Status',
    'Catatan Resolusi',
    'Diproses Oleh',
    'Tanggal Diproses',
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

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="laporan_kerusakan_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

// ─── Helper: Export Reservations ──────────────────────────────────────────────

async function exportReservations(filters: {
  status: string | null;
  facilityId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}) {
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
    'ID',
    'Tanggal Reservasi',
    'Waktu Mulai',
    'Waktu Selesai',
    'Pemohon',
    'Email',
    'Fasilitas',
    'Lokasi',
    'Keperluan',
    'Status',
    'Alasan Penolakan',
    'Diproses Oleh',
    'Tanggal Dibuat',
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

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reservasi_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
