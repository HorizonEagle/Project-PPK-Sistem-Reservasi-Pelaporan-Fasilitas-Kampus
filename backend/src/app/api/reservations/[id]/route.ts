import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { updateReservationStatusSchema } from '../../../../../lib/validators/reservation';
import { checkConflict, prismaTimeToHHMM } from '../../../../../lib/slot-utils';
import { getAuthUser } from '../../../../../lib/auth-utils';
export { OPTIONS } from '../../../../../lib/cors';

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
        facility: { select: { id: true, name: true, location: true, type: true } },
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

    // Jika approve, lakukan conflict check
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

      // Cek conflict dengan reservasi approved lain
      const startTimeStr = prismaTimeToHHMM(reservation.startTime);
      const endTimeStr = prismaTimeToHHMM(reservation.endTime);

      const hasConflict = await checkConflict(
        reservation.facilityId,
        reservation.date,
        startTimeStr,
        endTimeStr,
        reservation.id // exclude reservasi ini sendiri
      );

      if (hasConflict) {
        return NextResponse.json(
          {
            error:
              'Tidak bisa menyetujui reservasi. Terdapat reservasi lain yang sudah disetujui pada slot waktu yang sama.',
          },
          { status: 409 }
        );
      }
    }

    // Update status reservasi
    const updated = await prisma.reservation.update({
      where: { id },
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
