import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createReportSchema } from '../../../../lib/validators/report';
import { Prisma } from '@prisma/client';
import { getAuthUser } from '../../../../lib/auth-utils';
export { OPTIONS } from '../../../../lib/cors';

// ─── GET /api/reports — List laporan kerusakan ────────────────────────────────
//
// Pengguna: melihat riwayat laporan sendiri
// Petugas/Admin: melihat semua laporan (bisa filter)

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

    const { searchParams } = request.nextUrl;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const facilityId = searchParams.get('facility_id');
    const queryUserId = searchParams.get('user_id');

    // Build where clause
    const where: Prisma.ReportWhereInput = {};

    // Pengguna biasa hanya bisa lihat miliknya sendiri
    if (userRole === 'user') {
      where.userId = userId;
    } else if (queryUserId && queryUserId !== 'me') {
      // Petugas/Admin bisa filter by user_id
      where.userId = queryUserId;
    } else if (queryUserId === 'me') {
      where.userId = userId;
    }

    // Filter status (mendukung multiple: ?status=new_report,in_progress)
    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      if (statuses.length === 1) {
        where.status = statuses[0] as Prisma.ReportWhereInput['status'];
      } else {
        where.status = {
          in: statuses as ('new_report' | 'in_progress' | 'resolved' | 'rejected')[],
        };
      }
    }

    // Filter kategori
    if (category) {
      where.category = category as Prisma.ReportWhereInput['category'];
    }

    // Filter fasilitas
    if (facilityId) {
      where.facilityId = facilityId;
    }

    // Execute query
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          facility: { select: { id: true, name: true, location: true, type: true } },
          processor: { select: { id: true, name: true } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      data: reports,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil daftar laporan' },
      { status: 500 }
    );
  }
}

// ─── POST /api/reports — Buat laporan kerusakan baru (Pengguna) ───────────────

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const userId = authUser?.userId ?? null;
    const userRole = authUser?.role ?? null;

    if (!userId) {
      return NextResponse.json(
        { error: 'Autentikasi diperlukan' },
        { status: 401 }
      );
    }

    // Hanya pengguna biasa yang bisa buat laporan
    if (userRole !== 'user') {
      return NextResponse.json(
        { error: 'Hanya pengguna biasa yang bisa membuat laporan kerusakan' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validasi input dengan Zod
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validasi gagal',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { facilityId, category, description, photoUrl } = parsed.data;

    // Cek fasilitas ada
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      return NextResponse.json(
        { error: 'Fasilitas tidak ditemukan' },
        { status: 404 }
      );
    }

    // Buat laporan baru
    const report = await prisma.report.create({
      data: {
        userId,
        facilityId,
        category,
        description,
        photoUrl: photoUrl || null,
        status: 'new_report',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        facility: { select: { id: true, name: true, location: true, type: true } },
      },
    });

    return NextResponse.json(
      {
        data: report,
        message: 'Laporan kerusakan berhasil dibuat. Petugas akan segera menindaklanjuti.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/reports error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat laporan kerusakan' },
      { status: 500 }
    );
  }
}
