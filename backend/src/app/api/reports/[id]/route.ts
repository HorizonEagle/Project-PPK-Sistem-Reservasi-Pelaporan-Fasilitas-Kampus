import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { updateReportStatusSchema } from '../../../../../lib/validators/report';
import { getAuthUser } from '../../../../../lib/auth-utils';
export { OPTIONS } from '../../../../../lib/cors';

/** Dilempar di dalam transaksi bila laporan sudah diubah petugas lain setelah dibaca. */
class ReportAlreadyProcessedError extends Error {}

// ─── GET /api/reports/:id — Detail laporan ────────────────────────────────────

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

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        facility: { select: { id: true, name: true, location: true, type: true, imageUrl: true } },
        processor: { select: { id: true, name: true } },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Laporan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Pengguna biasa hanya bisa lihat laporan miliknya sendiri
    if (userRole === 'user' && report.userId !== userId) {
      return NextResponse.json(
        { error: 'Akses ditolak. Anda hanya bisa melihat laporan milik Anda sendiri.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: report });
  } catch (error) {
    console.error('GET /api/reports/:id error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil detail laporan' },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/reports/:id — Update status laporan (Petugas/Admin) ───────────
//
// Workflow status:
//   new_report → in_progress → resolved
//   new_report → rejected
//   in_progress → resolved
//   in_progress → rejected

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

    // Hanya petugas dan admin yang bisa update status
    if (userRole !== 'officer' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya petugas yang bisa memproses laporan.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validasi input
    const parsed = updateReportStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validasi gagal',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status: newStatus, resolutionNote } = parsed.data;

    // Cari laporan
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Laporan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validasi workflow status transisi
    const allowedTransitions: Record<string, string[]> = {
      new_report: ['in_progress', 'rejected'],
      in_progress: ['resolved', 'rejected'],
      resolved: [],   // Status final
      rejected: [],   // Status final
    };

    const allowed = allowedTransitions[report.status] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Transisi status tidak valid. Status "${report.status}" tidak bisa diubah menjadi "${newStatus}". Transisi yang diizinkan: ${allowed.length > 0 ? allowed.join(', ') : 'tidak ada (status final)'}`,
        },
        { status: 400 }
      );
    }

    // Update laporan + otomasi status fasilitas dalam satu transaksi, supaya laporan dan
    // fasilitas tidak pernah tersimpan setengah jalan.
    const isHeavyDamage = report.category === 'kerusakan_berat';
    let updated;
    try {
      updated = await prisma.$transaction(async (tx) => {
        // Update bersyarat atomik: hanya berhasil bila status laporan MASIH sama dengan
        // yang dibaca di atas. Bila dua petugas memproses laporan yang sama bersamaan
        // (satu menolak, satu menangani), yang kedua mendapat count 0 dan ditolak.
        const result = await tx.report.updateMany({
          where: { id, status: report.status },
          data: {
            status: newStatus,
            resolutionNote:
              newStatus === 'resolved' || newStatus === 'rejected'
                ? resolutionNote
                : report.resolutionNote,
            processedBy: userId,
            processedAt: new Date(),
          },
        });
        if (result.count === 0) throw new ReportAlreadyProcessedError();

        // Laporan kerusakan berat mulai ditangani: fasilitas ditutup (under_maintenance)
        if (newStatus === 'in_progress' && isHeavyDamage) {
          await tx.facility.update({
            where: { id: report.facilityId },
            data: { status: 'under_maintenance' },
          });
        }

        // Laporan kerusakan berat yang SEDANG ditangani lalu selesai ATAU ditolak:
        // fasilitas dibuka lagi bila tidak ada laporan kerusakan berat lain yang masih
        // ditangani. Hanya laporan berat yang menutup fasilitas, jadi hanya laporan
        // berat pula yang boleh membukanya kembali (laporan kebersihan dkk. tidak).
        const closesHeavyWork =
          isHeavyDamage &&
          report.status === 'in_progress' &&
          (newStatus === 'resolved' || newStatus === 'rejected');
        if (closesHeavyWork) {
          const facility = await tx.facility.findUnique({
            where: { id: report.facilityId },
            select: { status: true },
          });
          if (facility?.status === 'under_maintenance') {
            const otherHeavyInProgress = await tx.report.count({
              where: {
                facilityId: report.facilityId,
                category: 'kerusakan_berat',
                status: 'in_progress',
                id: { not: id },
              },
            });
            if (otherHeavyInProgress === 0) {
              await tx.facility.update({
                where: { id: report.facilityId },
                data: { status: 'active' },
              });
            }
          }
        }

        return tx.report.findUniqueOrThrow({
          where: { id },
          include: {
            user: { select: { id: true, name: true, email: true } },
            facility: { select: { id: true, name: true, location: true, type: true } },
            processor: { select: { id: true, name: true } },
          },
        });
      });
    } catch (error) {
      if (error instanceof ReportAlreadyProcessedError) {
        return NextResponse.json(
          {
            error:
              'Laporan sudah diproses oleh petugas lain. Muat ulang daftar lalu coba lagi.',
          },
          { status: 409 }
        );
      }
      throw error;
    }

    const statusLabels: Record<string, string> = {
      in_progress: 'sedang ditangani',
      resolved: 'selesai',
      rejected: 'ditolak',
    };

    return NextResponse.json({
      data: updated,
      message: `Laporan berhasil diperbarui menjadi "${statusLabels[newStatus]}"`,
    });
  } catch (error) {
    console.error('PATCH /api/reports/:id error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui status laporan' },
      { status: 500 }
    );
  }
}
