import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { updateReservationStatusSchema } from '../../../../../lib/validators/reservation';
import {
  checkConflict,
  prismaTimeToHHMM,
  reservationStartMs,
} from '../../../../../lib/slot-utils';
import { getAuthUser } from '../../../../../lib/auth-utils';
import { Prisma } from '@prisma/client';
export { OPTIONS } from '../../../../../lib/cors';

/** Dilempar di dalam transaksi persetujuan bila slot sudah ditempati reservasi approved lain. */
class SlotConflictError extends Error {}

/**
 * Jalankan transaksi Serializable; ulang beberapa kali bila PostgreSQL membatalkannya
 * karena konflik serialisasi (Prisma P2034), yang memang diharapkan terjadi saat dua
 * permintaan menyentuh slot yang sama bersamaan.
 */
async function runWithSerializableRetry<T>(run: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
      if (!retryable || attempt >= maxAttempts) throw error;
    }
  }
}

// ─── GET /api/reservations/:id — Detail reservasi ─────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const userId = authUser?.userId ?? null;
    const userRole = authUser?.role ?? null;

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Autentikasi diperlukan' },
        { status: 401 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        facility: { select: { id: true, name: true, location: true, type: true, imageUrl: true } },
        processor: { select: { id: true, name: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservasi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Pengguna biasa hanya bisa lihat reservasi miliknya sendiri
    if (userRole === 'user' && reservation.userId !== userId) {
      return NextResponse.json(
        { error: 'Akses ditolak. Anda hanya bisa melihat reservasi milik Anda sendiri.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: {
        ...reservation,
        startTime: prismaTimeToHHMM(reservation.startTime),
        endTime: prismaTimeToHHMM(reservation.endTime),
      },
    });
  } catch (error) {
    console.error('GET /api/reservations/:id error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil detail reservasi' },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/reservations/:id — Approve/Reject reservasi (Petugas) ─────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(request);
    const userId = authUser?.userId ?? null;
    const userRole = authUser?.role ?? null;

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Autentikasi diperlukan' },
        { status: 401 }
      );
    }

    // Hanya petugas dan admin yang bisa approve/reject
    if (userRole !== 'officer' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya petugas yang bisa memproses reservasi.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validasi input
    const parsed = updateReservationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validasi gagal',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status: newStatus, rejectionReason } = parsed.data;

    // Cari reservasi
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        facility: { select: { id: true, name: true, status: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservasi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hanya bisa approve/reject dari status pending
    if (reservation.status !== 'pending') {
      return NextResponse.json(
        {
          error: `Reservasi tidak bisa diproses. Status saat ini: "${reservation.status}". Hanya reservasi berstatus "pending" yang bisa diapprove/reject.`,
        },
        { status: 400 }
      );
    }

    const startTimeStr = prismaTimeToHHMM(reservation.startTime);
    const endTimeStr = prismaTimeToHHMM(reservation.endTime);

    if (newStatus === 'approved') {
      // Cek apakah fasilitas masih aktif
      if (reservation.facility.status !== 'active') {
        return NextResponse.json(
          {
            error: `Fasilitas "${reservation.facility.name}" tidak aktif atau sedang dalam perbaikan. Tidak bisa menyetujui reservasi.`,
          },
          { status: 400 }
        );
      }

      // Reservasi yang waktu mulainya sudah lewat tidak boleh disetujui lagi
      // (permohonan pending yang basi tidak punya masa kedaluwarsa otomatis)
      const dateStr = reservation.date.toISOString().slice(0, 10);
      if (reservationStartMs(dateStr, startTimeStr) <= Date.now()) {
        return NextResponse.json(
          {
            error:
              'Tidak bisa menyetujui reservasi yang waktu mulainya sudah lewat. Silakan tolak permohonan ini.',
          },
          { status: 400 }
        );
      }
    }

    // Cek konflik dan update status dijalankan dalam SATU transaksi Serializable.
    // Tanpa ini, dua petugas yang menyetujui dua reservasi bentrok bersamaan sama-sama
    // melihat "belum ada konflik" lalu sama-sama menulis (double booking, TOCTOU).
    // Pada isolasi Serializable, salah satu transaksi gagal dengan P2034 dan diulang;
    // pada percobaan ulang ia melihat reservasi yang sudah disetujui dan dijawab 409.
    let updated;
    try {
      updated = await runWithSerializableRetry(() =>
        prisma.$transaction(
          async (tx) => {
            if (newStatus === 'approved') {
              const hasConflict = await checkConflict(
                reservation.facilityId,
                reservation.date,
                startTimeStr,
                endTimeStr,
                reservation.id, // exclude reservasi ini sendiri
                tx
              );
              if (hasConflict) throw new SlotConflictError();
            }

            // `status: 'pending'` di where membuat update gagal (P2025) bila
            // petugas lain sudah memproses reservasi yang sama lebih dulu
            return tx.reservation.update({
              where: { id, status: 'pending' },
              data: {
                status: newStatus,
                rejectionReason: newStatus === 'rejected' ? rejectionReason : null,
                processedBy: userId,
                processedAt: new Date(),
              },
              include: {
                user: { select: { id: true, name: true, email: true } },
                facility: { select: { id: true, name: true, location: true, type: true } },
                processor: { select: { id: true, name: true } },
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        )
      );
    } catch (error) {
      if (error instanceof SlotConflictError) {
        return NextResponse.json(
          {
            error:
              'Tidak bisa menyetujui reservasi. Terdapat reservasi lain yang sudah disetujui pada slot waktu yang sama.',
          },
          { status: 409 }
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2025' || error.code === 'P2034')
      ) {
        return NextResponse.json(
          {
            error:
              'Reservasi sedang atau sudah diproses oleh petugas lain. Muat ulang daftar lalu coba lagi.',
          },
          { status: 409 }
        );
      }
      throw error;
    }

    const statusLabel = newStatus === 'approved' ? 'disetujui' : 'ditolak';

    return NextResponse.json({
      data: {
        ...updated,
        startTime: prismaTimeToHHMM(updated.startTime),
        endTime: prismaTimeToHHMM(updated.endTime),
      },
      message: `Reservasi berhasil ${statusLabel}`,
    });
  } catch (error) {
    console.error('PATCH /api/reservations/:id error:', error);
    return NextResponse.json(
      { error: 'Gagal memproses reservasi' },
      { status: 500 }
    );
  }
}
