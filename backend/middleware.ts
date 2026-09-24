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
  /^\/api\/facilities(\/.*)?$/,  // semua facilities bisa diakses publik
  /^\/api\/health$/,             // health check
  /^\/api\/test$/,               // testing endpoint
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // Hanya proses route API
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Handle CORS preflight (OPTIONS request)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  // Cek apakah route ini publik (tidak perlu auth)
  const isPublic = PUBLIC_API_ROUTES.some((pattern) => pattern.test(pathname));
  if (isPublic) {
    const response = NextResponse.next();
    Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // Ambil token dari header Authorization
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Autentikasi diperlukan. Sertakan token Bearer di header Authorization.' },
      { status: 401, headers: corsHeaders(origin) }
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

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    // Tambahkan CORS headers ke response
    Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Token tidak valid atau sudah kadaluarsa. Silakan login kembali.' },
      { status: 401, headers: corsHeaders(origin) }
    );
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
