import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';
export { OPTIONS } from '@/lib/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics
 * Prometheus scrape endpoint. If METRICS_TOKEN is set, the request must carry
 * `Authorization: Bearer <METRICS_TOKEN>` (Prometheus: `authorization` block).
 */
export async function GET(request: NextRequest) {
  const expected = process.env.METRICS_TOKEN;
  if (expected) {
    const header = request.headers.get('authorization');
    if (header !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 });
    }
  }

  const body = await metrics.register.metrics();
  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': metrics.register.contentType },
  });
}
