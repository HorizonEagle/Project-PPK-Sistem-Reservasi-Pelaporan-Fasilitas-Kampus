import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { cancelReservationSchema } from '../../../../../../lib/validators/reservation';
import { prismaTimeToHHMM } from '../../../../../../lib/slot-utils';

// ─── PATCH /api/reservations/:id/cancel — Batalkan reservasi ──────────────────
//
// Pengguna: batalkan reservasi miliknya (pending/approved, sebelum waktu mulai)
// Petugas/Admin: cancel darurat (dari approved), wajib sertakan alasan

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Autentikasi diperlukan' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Validasi input
    const parsed = cancelReservationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validasi gagal',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { cancellationReason } = parsed.data;

    // Cari reservasi
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        facility: { select: { id: true, name: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservasi tidak ditemukan' },
        { status: 404 }
      );
    }

    // ─── Logika Cancel berdasarkan Role ──────────────────────────────────────

    if (userRole === 'user') {
      // Pengguna hanya bisa cancel miliknya sendiri
      if (reservation.userId !== userId) {
        return NextResponse.json(
          { error: 'Akses ditolak. Anda hanya bisa membatalkan reservasi milik Anda sendiri.' },
          { status: 403 }
        );
      }

      // Hanya bisa cancel dari status pending atau approved
      if (reservation.status !== 'pending' && reservation.status !== 'approved') {
        return NextResponse.json(
          {
            error: `Reservasi tidak bisa dibatalkan. Status saat ini: "${reservation.status}". Hanya reservasi berstatus "pending" atau "approved" yang bisa dibatalkan.`,
          },
          { status: 400 }
        );
      }

      // Cek waktu mulai belum lewat (untuk reservasi yang sudah approved)
      if (reservation.status === 'approved') {
        const now = new Date();
        const reservationDateTime = new Date(reservation.date);
        const startTime = prismaTimeToHHMM(reservation.startTime);
        const [startH, startM] = startTime.split(':').map(Number);
        reservationDateTime.setUTCHours(startH, startM, 0, 0);

        if (now >= reservationDateTime) {
          return NextResponse.json(
            { error: 'Tidak bisa membatalkan reservasi yang sudah melewati waktu mulai.' },
            { status: 400 }
          );
        }
      }

      // Cancel oleh user
      const updated = await prisma.reservation.update({
        where: { id },
        data: {
          status: 'cancelled_by_user',
          cancellationReason: cancellationReason || null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          facility: { select: { id: true, name: true, location: true, type: true } },
        },
      });

      return NextResponse.json({
        data: {
          ...updated,
          startTime: prismaTimeToHHMM(updated.startTime),
          endTime: prismaTimeToHHMM(updated.endTime),
        },
        message: 'Reservasi berhasil dibatalkan',
      });
    }

    // ─── Cancel oleh Petugas/Admin ────────────────────────────────────────────

    if (userRole === 'officer' || userRole === 'admin') {
      // Petugas bisa cancel dari status pending atau approved
      if (reservation.status !== 'pending' && reservation.status !== 'approved') {
        return NextResponse.json(
          {
            error: `Reservasi tidak bisa dibatalkan. Status saat ini: "${reservation.status}".`,
          },
          { status: 400 }
        );
      }

      // Petugas wajib sertakan alasan cancellation
      if (!cancellationReason || cancellationReason.trim().length < 5) {
        return NextResponse.json(
          { error: 'Alasan pembatalan wajib diisi (minimal 5 karakter) saat petugas membatalkan reservasi.' },
          { status: 400 }
        );
      }

      const updated = await prisma.reservation.update({
        where: { id },
        data: {
          status: 'cancelled_by_admin',
          cancellationReason,
          processedBy: userId,
          processedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          facility: { select: { id: true, name: true, location: true, type: true } },
          processor: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({
        data: {
          ...updated,
          startTime: prismaTimeToHHMM(updated.startTime),
          endTime: prismaTimeToHHMM(updated.endTime),
        },
        message: 'Reservasi berhasil dibatalkan oleh petugas',
      });
    }

    return NextResponse.json(
      { error: 'Role tidak dikenali' },
      { status: 403 }
    );
  } catch (error) {
    console.error('PATCH /api/reservations/:id/cancel error:', error);
    return NextResponse.json(
      { error: 'Gagal membatalkan reservasi' },
      { status: 500 }
    );
  }
}
