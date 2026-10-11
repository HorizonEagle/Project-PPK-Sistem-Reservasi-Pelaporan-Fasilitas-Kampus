import client from 'prom-client';
import type { NextRequest } from 'next/server';
import { prisma } from './prisma';

function createMetrics() {
  const register = new client.Registry();
  register.setDefaultLabels({ app: 'campus-facility-backend' });
  client.collectDefaultMetrics({ register });

  const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests handled by instrumented API routes',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [register],
  });

  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of instrumented API route handlers in seconds',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
  });

  // Gauges below are filled from the database on every scrape, so they always
  // reflect current state and survive process restarts.
  const countGauge = (
    name: string,
    help: string,
    query: () => Promise<{ status: string; count: number }[]>
  ) =>
    new client.Gauge({
      name,
      help,
      labelNames: ['status'] as const,
      registers: [register],
      async collect() {
        try {
          const rows = await query();
          this.reset();
          for (const row of rows) this.set({ status: row.status }, row.count);
        } catch {
          // DB unreachable: keep the last values; campus_db_up reports the outage.
        }
      },
    });

  countGauge('campus_users', 'Users by account status', async () =>
    (await prisma.user.groupBy({ by: ['status'], _count: { _all: true } })).map((r) => ({
      status: r.status,
      count: r._count._all,
    }))
  );
  countGauge('campus_facilities', 'Facilities by status', async () =>
    (await prisma.facility.groupBy({ by: ['status'], _count: { _all: true } })).map((r) => ({
      status: r.status,
      count: r._count._all,
    }))
  );
  countGauge('campus_reservations', 'Reservations by status', async () =>
    (await prisma.reservation.groupBy({ by: ['status'], _count: { _all: true } })).map((r) => ({
      status: r.status,
      count: r._count._all,
    }))
  );
  countGauge('campus_reports', 'Damage reports by status', async () =>
    (await prisma.report.groupBy({ by: ['status'], _count: { _all: true } })).map((r) => ({
      status: r.status,
      count: r._count._all,
    }))
  );

  new client.Gauge({
    name: 'campus_db_up',
    help: '1 if the database answered a probe query during the last scrape, else 0',
    registers: [register],
    async collect() {
      try {
        await prisma.$queryRaw`SELECT 1`;
        this.set(1);
      } catch {
        this.set(0);
      }
    },
  });

  return { register, httpRequestsTotal, httpRequestDuration };
}

// Survive Next.js hot reload and module re-evaluation: registering the same
// metric name twice in one registry throws.
const globalForMetrics = globalThis as unknown as {
  campusMetrics?: ReturnType<typeof createMetrics>;
};

export const metrics = globalForMetrics.campusMetrics ?? createMetrics();
globalForMetrics.campusMetrics = metrics;

/**
 * Wrap a route handler to record request count and latency.
 * `route` is the static path pattern (e.g. "/api/auth/login") to keep label
 * cardinality bounded, never the raw URL.
 */
export function withMetrics<Args extends unknown[]>(
  route: string,
  handler: (request: NextRequest, ...args: Args) => Promise<Response>
) {
  return async (request: NextRequest, ...args: Args): Promise<Response> => {
    const stopTimer = metrics.httpRequestDuration.startTimer();
    let status = 500;
    try {
      const response = await handler(request, ...args);
      status = response.status;
      return response;
    } finally {
      const labels = { method: request.method, route, status: String(status) };
      stopTimer(labels);
      metrics.httpRequestsTotal.inc(labels);
    }
  };
}
