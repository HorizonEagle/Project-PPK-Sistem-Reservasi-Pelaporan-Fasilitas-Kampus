import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { createReservationSchema } from '../../../../lib/validators/reservation';
import {
  validateSlotTime,
  validateReservationDate,
  parseTimeToDate,
  prismaTimeToHHMM,
} from '../../../../lib/slot-utils';
import { Prisma } from '@prisma/client';

// ─── GET /api/reservations — List reservasi ───────────────────────────────────
//
// Pengguna: melihat riwayat reservasi sendiri
// Petugas: melihat antrian (filter by status)
// Admin: melihat semua

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

    const { searchParams } = request.nextUrl;

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status');
    const facilityId = searchParams.get('facility_id');
    const queryUserId = searchParams.get('user_id');

    // Build where clause
    const where: Prisma.ReservationWhereInput = {};

    // Pengguna biasa hanya bisa lihat miliknya sendiri
    if (userRole === 'user') {
      where.userId = userId;
    } else if (queryUserId && queryUserId !== 'me') {
      // Petugas/Admin bisa filter by user_id
      where.userId = queryUserId;
    } else if (queryUserId === 'me') {
      where.userId = userId;
    }

    // Filter status (mendukung multiple: ?status=pending,approved)
    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      if (statuses.length === 1) {
        where.status = statuses[0] as Prisma.ReservationWhereInput['status'];
      } else {
        where.status = { in: statuses as ('pending' | 'approved' | 'rejected' | 'cancelled_by_user' | 'cancelled_by_admin')[] };
      }
    }

    // Filter fasilitas
    if (facilityId) {
      where.facilityId = facilityId;
    }

    // Execute query
    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
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
      prisma.reservation.count({ where }),
    ]);

    // Format time fields untuk response
    const formattedReservations = reservations.map((r) => ({
      ...r,
      startTime: prismaTimeToHHMM(r.startTime),
      endTime: prismaTimeToHHMM(r.endTime),
    }));

    return NextResponse.json({
      data: formattedReservations,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/reservations error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil daftar reservasi' },
      { status: 500 }
    );
  }
}

// ─── POST /api/reservations — Ajukan reservasi baru (Pengguna) ────────────────

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json(
        { error: 'Autentikasi diperlukan' },
        { status: 401 }
      );
    }

    // Hanya pengguna biasa yang bisa ajukan reservasi
    if (userRole !== 'user') {
      return NextResponse.json(
        { error: 'Hanya pengguna biasa yang bisa mengajukan reservasi' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validasi input dengan Zod
    const parsed = createReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validasi gagal',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { facilityId, date, startTime, endTime, purpose } = parsed.data;

    // Validasi slot waktu (jam operasional, kelipatan 30 menit)
    const slotValidation = validateSlotTime(startTime, endTime);
    if (!slotValidation.valid) {
      return NextResponse.json(
        { error: slotValidation.error },
        { status: 400 }
      );
    }

    // Validasi tanggal (>= hari ini)
    const dateValidation = validateReservationDate(date);
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      );
    }

    // Cek fasilitas ada dan berstatus active
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      return NextResponse.json(
        { error: 'Fasilitas tidak ditemukan' },
        { status: 404 }
      );
    }

    if (facility.status !== 'active') {
      return NextResponse.json(
        { error: 'Fasilitas tidak aktif atau sedang dalam perbaikan. Tidak bisa melakukan reservasi.' },
        { status: 400 }
      );
    }

    // Parse tanggal dan waktu untuk database
    const reservationDate = new Date(date + 'T00:00:00.000Z');
    const startTimeDate = parseTimeToDate(startTime);
    const endTimeDate = parseTimeToDate(endTime);

    // Buat reservasi baru
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        facilityId,
        date: reservationDate,
        startTime: startTimeDate,
        endTime: endTimeDate,
        purpose,
        status: 'pending',
      },
      include: {
        facility: { select: { id: true, name: true, location: true, type: true } },
      },
    });

    return NextResponse.json(
      {
        data: {
          ...reservation,
          startTime: prismaTimeToHHMM(reservation.startTime),
          endTime: prismaTimeToHHMM(reservation.endTime),
        },
        message: 'Reservasi berhasil diajukan. Menunggu persetujuan petugas.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/reservations error:', error);
    return NextResponse.json(
      { error: 'Gagal membuat reservasi' },
      { status: 500 }
    );
  }
}
