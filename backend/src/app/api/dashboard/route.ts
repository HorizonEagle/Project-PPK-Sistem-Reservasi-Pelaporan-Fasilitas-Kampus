import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getAuthUser } from '../../../../lib/auth-utils';
export { OPTIONS } from '../../../../lib/cors';

// ─── GET /api/dashboard — Statistik dashboard ─────────────────────────────────
//
// Admin & Petugas: dashboard lengkap
// Pengguna: statistik personal

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

    if (userRole === 'user') {
      // Dashboard personal pengguna
      const [
        totalReservations,
        pendingReservations,
        approvedReservations,
        totalReports,
        newReports,
        resolvedReports,
      ] = await Promise.all([
        prisma.reservation.count({ where: { userId } }),
        prisma.reservation.count({ where: { userId, status: 'pending' } }),
        prisma.reservation.count({ where: { userId, status: 'approved' } }),
        prisma.report.count({ where: { userId } }),
        prisma.report.count({ where: { userId, status: 'new_report' } }),
        prisma.report.count({ where: { userId, status: 'resolved' } }),
      ]);

      return NextResponse.json({
        data: {
          totalReservations,
          pendingReservations,
          approvedReservations,
          totalReports,
          newReports,
          resolvedReports,
          totalFacilities: 0,
          activeFacilities: 0,
        },
      });
    }

    // Dashboard admin/petugas — statistik global
    const [
      totalReservations,
      pendingReservations,
      totalReports,
      newReports,
      inProgressReports,
      resolvedReports,
      totalFacilities,
      activeFacilities,
      maintenanceFacilities,
      totalUsers,
      pendingUsers,
      // Data agregasi untuk chart
      reportsByCategory,
      reportsByFacility,
      recentReports,
      recentReservations,
    ] = await Promise.all([
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: 'pending' } }),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'new_report' } }),
      prisma.report.count({ where: { status: 'in_progress' } }),
      prisma.report.count({ where: { status: 'resolved' } }),
      prisma.facility.count(),
      prisma.facility.count({ where: { status: 'active' } }),
      prisma.facility.count({ where: { status: 'under_maintenance' } }),
      prisma.user.count(),
      prisma.user.count({ where: { status: 'pending_verification' } }),
      // Laporan per kategori
      prisma.report.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
      // Top 5 fasilitas dengan laporan terbanyak
      prisma.report.groupBy({
        by: ['facilityId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      // 5 laporan terbaru
      prisma.report.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          facility: { select: { id: true, name: true, location: true } },
        },
      }),
      // 5 reservasi terbaru
      prisma.reservation.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          facility: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Resolve facility names untuk reportsByFacility
    const facilityIds = reportsByFacility.map((r) => r.facilityId);
    const facilities = await prisma.facility.findMany({
      where: { id: { in: facilityIds } },
      select: { id: true, name: true, location: true },
    });
    const facilityMap = new Map(facilities.map((f) => [f.id, f]));

    const reportsByFacilityWithNames = reportsByFacility.map((r) => ({
      facilityId: r.facilityId,
      facilityName: facilityMap.get(r.facilityId)?.name || 'Unknown',
      facilityLocation: facilityMap.get(r.facilityId)?.location || '',
      count: r._count.id,
    }));

    const reportsByCategoryFormatted = reportsByCategory.map((r) => ({
      category: r.category,
      count: r._count.id,
    }));

    return NextResponse.json({
      data: {
        totalReservations,
        pendingReservations,
        totalReports,
        newReports,
        inProgressReports,
        resolvedReports,
        totalFacilities,
        activeFacilities,
        maintenanceFacilities,
        totalUsers,
        pendingUsers,
        reportsByCategory: reportsByCategoryFormatted,
        reportsByFacility: reportsByFacilityWithNames,
        recentReports,
        recentReservations,
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data dashboard' },
      { status: 500 }
    );
  }
}
