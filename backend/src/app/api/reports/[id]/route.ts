import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { updateReportStatusSchema } from '../../../../../lib/validators/report';

// ─── GET /api/reports/:id — Detail laporan ────────────────────────────────────

export async function GET(
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

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        facility: { select: { id: true, name: true, location: true, type: true } },
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
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

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

    // Update laporan
    const updated = await prisma.report.update({
      where: { id },
      data: {
        status: newStatus,
        resolutionNote:
          newStatus === 'resolved' || newStatus === 'rejected'
            ? resolutionNote
            : report.resolutionNote,
        processedBy: userId,
        processedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        facility: { select: { id: true, name: true, location: true, type: true } },
        processor: { select: { id: true, name: true } },
      },
    });

    // Jika laporan kerusakan berat dan status in_progress,
    // set fasilitas ke under_maintenance
    if (
      newStatus === 'in_progress' &&
      (report.category === 'kerusakan_berat')
    ) {
      await prisma.facility.update({
        where: { id: report.facilityId },
        data: { status: 'under_maintenance' },
      });
    }

    // Jika resolved, kembalikan fasilitas ke active (jika sebelumnya under_maintenance)
    if (newStatus === 'resolved') {
      const facility = await prisma.facility.findUnique({
        where: { id: report.facilityId },
      });
      if (facility?.status === 'under_maintenance') {
        // Cek apakah masih ada laporan lain yang in_progress untuk fasilitas ini
        const otherActiveReports = await prisma.report.count({
          where: {
            facilityId: report.facilityId,
            status: 'in_progress',
            id: { not: id },
          },
        });
        if (otherActiveReports === 0) {
          await prisma.facility.update({
            where: { id: report.facilityId },
            data: { status: 'active' },
          });
        }
      }
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
