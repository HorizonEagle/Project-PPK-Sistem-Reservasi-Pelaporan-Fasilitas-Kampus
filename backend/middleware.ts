import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

// CORS origins yang diizinkan
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Route yang tidak perlu autentikasi
const PUBLIC_API_ROUTES = [
  /^\/api\/auth\/register$/,
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/logout$/,
  /^\/api\/facilities(\/.*)?$/,  // semua facilities bisa diakses publik
  /^\/api\/health$/,             // health check
  /^\/api\/test$/,               // testing endpoint
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
 *  TIDAK berlaku untuk response yang dibuat langsung oleh middleware). */
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // Hanya proses route API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // ── OPTIONS preflight ─────────────────────────────────────────────────────
  // Langsung return 200 + CORS headers. Ini adalah handler yang paling pasti,
  // karena di beberapa versi Next.js, auto-OPTIONS TIDAK melewati middleware.
  // Dengan menghandle di sini DAN di next.config.ts, kita punya double-safety.
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: getCorsHeaders(origin),
    });
  }

  // ── Route publik — tidak perlu auth ───────────────────────────────────────
  const isPublic = PUBLIC_API_ROUTES.some((pattern) => pattern.test(pathname));
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
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Inject user info ke request headers untuk dipakai route handler
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-user-email', payload.email as string);
    requestHeaders.set('x-user-role', payload.role as string);

    // Lanjutkan ke route handler; CORS headers ditambahkan oleh next.config.ts
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
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
