import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/test
 * Testing endpoint — tampilkan semua user dari database untuk verifikasi
 */
export async function GET() {
  try {
    // List semua user (tanpa password) untuk testing
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // List semua fasilitas
    const facilities = await prisma.facility.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        location: true,
        capacity: true,
      },
      orderBy: { name: 'asc' },
    });

    // Count reservations & reports
    const reservationCount = await prisma.reservation.count();
    const reportCount = await prisma.report.count();

    return NextResponse.json({
      message: '🧪 Test endpoint — Data dari database',
      timestamp: new Date().toISOString(),
      summary: {
        users: users.length,
        facilities: facilities.length,
        reservations: reservationCount,
        reports: reportCount,
      },
      testAccounts: [
        { role: 'Admin', email: 'admin@kampus.ac.id', password: 'admin123' },
        { role: 'Petugas', email: 'petugas@kampus.ac.id', password: 'petugas123' },
        { role: 'User', email: 'budi@mahasiswa.ac.id', password: 'user123' },
      ],
      data: {
        users,
        facilities,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Database query gagal',
        detail: err instanceof Error ? err.message : 'Unknown error',
        hint: 'Pastikan database sudah running dan migrasi sudah dijalankan.',
      },
      { status: 500 }
    );
  }
}
