import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { groupBy: vi.fn() },
    facility: { groupBy: vi.fn() },
    reservation: { groupBy: vi.fn() },
    report: { groupBy: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { GET as metricsRoute } from '@/app/api/metrics/route';
import { metrics, withMetrics } from '@/lib/metrics';

const db = prisma as unknown as {
  user: { groupBy: ReturnType<typeof vi.fn> };
  facility: { groupBy: ReturnType<typeof vi.fn> };
  reservation: { groupBy: ReturnType<typeof vi.fn> };
  report: { groupBy: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
};

const scrape = (headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost:3001/api/metrics', { headers });

beforeEach(() => {
  metrics.httpRequestsTotal.reset();
  metrics.httpRequestDuration.reset();
  db.user.groupBy.mockResolvedValue([{ status: 'active', _count: { _all: 3 } }]);
  db.facility.groupBy.mockResolvedValue([]);
  db.reservation.groupBy.mockResolvedValue([
    { status: 'pending', _count: { _all: 2 } },
    { status: 'approved', _count: { _all: 5 } },
  ]);
  db.report.groupBy.mockResolvedValue([]);
  db.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
});

afterEach(() => {
  delete process.env.METRICS_TOKEN;
});

describe('GET /api/metrics', () => {
  it('serves Prometheus text format', async () => {
    const res = await metricsRoute(scrape());
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const body = await res.text();
    expect(body).toContain('# TYPE process_cpu_user_seconds_total counter');
    expect(body).toContain('app="campus-facility-backend"');
  });

  it('exposes business gauges from the database', async () => {
    const body = await (await metricsRoute(scrape())).text();
    expect(body).toMatch(/campus_users\{[^}]*status="active"[^}]*\} 3/);
    expect(body).toMatch(/campus_reservations\{[^}]*status="approved"[^}]*\} 5/);
    expect(body).toMatch(/campus_reservations\{[^}]*status="pending"[^}]*\} 2/);
    expect(body).toMatch(/campus_db_up\{[^}]*\} 1/);
  });

  it('reports campus_db_up 0 and still answers 200 when the database is down', async () => {
    db.$queryRaw.mockRejectedValue(new Error('down'));
    db.user.groupBy.mockRejectedValue(new Error('down'));
    const res = await metricsRoute(scrape());
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/campus_db_up\{[^}]*\} 0/);
  });

  it('requires the bearer token when METRICS_TOKEN is set', async () => {
    process.env.METRICS_TOKEN = 's3cret';
    expect((await metricsRoute(scrape())).status).toBe(401);
    expect((await metricsRoute(scrape({ authorization: 'Bearer wrong' }))).status).toBe(401);
    expect((await metricsRoute(scrape({ authorization: 'Bearer s3cret' }))).status).toBe(200);
  });
});

describe('withMetrics', () => {
  const req = (method = 'POST') => new NextRequest('http://localhost:3001/x', { method });

  it('counts requests by method, route and status', async () => {
    const handler = withMetrics('/x', async () => new Response(null, { status: 201 }));
    await handler(req());
    await handler(req());

    const body = await metrics.register.metrics();
    expect(body).toContain('http_requests_total{method="POST",route="/x",status="201",app="campus-facility-backend"} 2');
    expect(body).toMatch(
      /http_request_duration_seconds_count\{(?=[^}]*method="POST")(?=[^}]*route="\/x")(?=[^}]*status="201")[^}]*\} 2/
    );
  });

  it('records a 500 and rethrows when the handler throws', async () => {
    const handler = withMetrics('/boom', async () => {
      throw new Error('boom');
    });
    await expect(handler(req('GET'))).rejects.toThrow('boom');

    const body = await metrics.register.metrics();
    expect(body).toContain('route="/boom",status="500"');
  });
});
