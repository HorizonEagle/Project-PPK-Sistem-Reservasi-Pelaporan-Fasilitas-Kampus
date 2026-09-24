import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createFacilitySchema } from '../../../../lib/validators/facility';
import { FacilityType, Prisma } from '@prisma/client';

// ─── GET /api/facilities — List fasilitas (publik, dengan search/filter) ──────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;

    // Filters
    const type = searchParams.get('type') as FacilityType | null;
    const location = searchParams.get('location');
    const capacityMin = searchParams.get('capacity_min');
    const search = searchParams.get('search');
    const status = searchParams.get('status'); // untuk admin: bisa lihat semua status

    // Build where clause
    const where: Prisma.FacilityWhereInput = {};

    // Cek role dari header (inject oleh middleware)
    const userRole = request.headers.get('x-user-role');

    // Jika bukan admin/officer, hanya tampilkan fasilitas aktif
    if (!userRole || (userRole !== 'admin' && userRole !== 'officer')) {
      where.status = 'active';
    } else if (status) {
      // Admin/officer bisa filter berdasarkan status
      where.status = status as 'active' | 'inactive' | 'under_maintenance';
    }

    // Filter tipe fasilitas
    if (type && ['classroom', 'auditorium', 'laboratory', 'equipment', 'field'].includes(type)) {
      where.type = type;
    }

    // Filter lokasi (partial match, case-insensitive)
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    // Filter kapasitas minimum
    if (capacityMin) {
      const minCap = parseInt(capacityMin);
      if (!isNaN(minCap) && minCap > 0) {
        where.capacity = { gte: minCap };
      }
    }

    // Search nama/lokasi/deskripsi
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query
    const [facilities, total] = await Promise.all([
      prisma.facility.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.facility.count({ where }),
    ]);

    return NextResponse.json({
      data: facilities,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/facilities error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil daftar fasilitas' },
      { status: 500 }
    );
  }
}

// ─── POST /api/facilities — Tambah fasilitas (Admin only) ─────────────────────

export async function POST(request: NextRequest) {
  try {
    // Cek role dari header (inject oleh middleware)
    const userRole = request.headers.get('x-user-role');
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang bisa menambah fasilitas.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validasi input
    const parsed = createFacilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validasi gagal',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, type, location, capacity, description, imageUrl } = parsed.data;

    // Buat fasilitas baru
    const facility = await prisma.facility.create({
      data: {
        name,
        type,
        location,
        capacity,
        description: description || null,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(
      { data: facility, message: 'Fasilitas berhasil ditambahkan' },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/facilities error:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan fasilitas' },
      { status: 500 }
    );
  }
}
