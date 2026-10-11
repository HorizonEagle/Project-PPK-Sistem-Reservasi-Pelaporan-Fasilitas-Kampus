import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '../lib/jwt-secret';

/**
 * Proxy (di Next.js 16 menggantikan `middleware.ts`).
 *
 * Lokasinya HARUS di dalam `src/` karena aplikasi memakai `src/app`. Saat file ini
 * masih berupa `backend/middleware.ts` di luar `src/`, Next.js mengabaikannya: tidak
 * ada pengecekan token dan CORS dari lapis ini tidak pernah berjalan.
 *
 * Proxy hanyalah lapis pertama (401 lebih awal). Keputusan identitas dan peran tetap
 * diambil ulang oleh setiap route handler lewat `getAuthUser()` dari token yang
 * terverifikasi; proxy TIDAK meneruskan identitas lewat header.
 */

// CORS origins yang diizinkan
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Route yang tidak perlu autentikasi. Dicocokkan per METHOD, bukan hanya per path,
// supaya mis. POST /api/facilities (khusus admin) tidak ikut menjadi publik.
const PUBLIC_API_ROUTES: { pattern: RegExp; methods: string[] }[] = [
  { pattern: /^\/api\/auth\/register$/, methods: ['POST'] },
  { pattern: /^\/api\/auth\/login$/, methods: ['POST'] },
  { pattern: /^\/api\/auth\/logout$/, methods: ['POST'] },
  { pattern: /^\/api\/facilities(\/.*)?$/, methods: ['GET', 'HEAD'] }, // katalog publik, hanya baca
  { pattern: /^\/api\/health$/, methods: ['GET', 'HEAD'] },
  { pattern: /^\/api\/test$/, methods: ['GET', 'HEAD'] },    // hanya aktif di non-production
  { pattern: /^\/api\/metrics$/, methods: ['GET', 'HEAD'] }, // dilindungi METRICS_TOKEN
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/** Buat JSON error response dengan CORS headers (karena next.config headers
 *  TIDAK berlaku untuk response yang dibuat langsung oleh proxy). */
function corsJsonResponse(
  body: object,
  status: number,
  origin: string | null
): NextResponse {
  const response = NextResponse.json(body, { status });
  Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // Hanya proses route API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // ── OPTIONS preflight ─────────────────────────────────────────────────────
  // Langsung return 200 + CORS headers.
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: getCorsHeaders(origin),
    });
  }

  // ── Route publik — tidak perlu auth ───────────────────────────────────────
  const isPublic = PUBLIC_API_ROUTES.some(
    ({ pattern, methods }) => pattern.test(pathname) && methods.includes(request.method)
  );
  if (isPublic) {
    // Lanjutkan ke route handler; CORS headers ditambahkan oleh next.config.ts
    return NextResponse.next();
  }

  // ── Route yang memerlukan autentikasi ─────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return corsJsonResponse(
      { error: 'Autentikasi diperlukan. Sertakan token Bearer di header Authorization.' },
      401,
      origin
    );
  }

  const token = authHeader.slice(7);

  try {
    await jwtVerify(token, getJwtSecret());
    // Lanjutkan ke route handler; handler memverifikasi ulang token via getAuthUser()
    return NextResponse.next();
  } catch {
    return corsJsonResponse(
      { error: 'Token tidak valid atau sudah kadaluarsa. Silakan login kembali.' },
      401,
      origin
    );
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
