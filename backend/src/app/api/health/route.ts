import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/health
 * Health check endpoint — untuk monitoring apakah backend & database berjalan
 */
export async function GET() {
  const checks: Record<string, { status: string; message?: string; latency?: string }> = {};

  // 1. App check
  checks.app = { status: 'ok', message: 'Backend is running' };

  // 2. Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'ok',
      message: 'PostgreSQL connected',
      latency: `${Date.now() - dbStart}ms`,
    };
  } catch (err) {
    checks.database = {
      status: 'error',
      message: err instanceof Error ? err.message : 'Database connection failed',
      latency: `${Date.now() - dbStart}ms`,
    };
  }

  // 3. User count (quick sanity check seeder sudah jalan)
  try {
    const userCount = await prisma.user.count();
    const facilityCount = await prisma.facility.count();
    checks.data = {
      status: userCount > 0 ? 'ok' : 'warning',
      message: `Users: ${userCount}, Facilities: ${facilityCount}${
        userCount === 0 ? ' — Jalankan `npx prisma db seed` untuk isi data awal' : ''
      }`,
    };
  } catch (err) {
    checks.data = {
      status: 'error',
      message: err instanceof Error ? err.message : 'Query failed',
    };
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
