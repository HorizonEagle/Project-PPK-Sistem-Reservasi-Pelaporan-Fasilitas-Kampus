import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

// ─── Route Protection Rules ───────────────────────────────────────────────────

const ROLE_ROUTES: Record<string, string[]> = {
  '/dashboard': ['user'],
  '/petugas': ['officer'],
  '/admin': ['admin'],
};

function getRequiredRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      return roles;
    }
  }
  return null; // Rute publik
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requiredRoles = getRequiredRoles(pathname);
  if (!requiredRoles) {
    // Rute publik — tidak perlu cek auth
    return NextResponse.next();
  }

  // Ambil token dari localStorage tidak bisa di middleware.
  // Workaround: cek cookie 'token' (kita simpan juga di cookie saat login)
  const token = request.cookies.get('token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;

    if (!requiredRoles.includes(userRole)) {
      // User tidak punya role yang tepat → redirect ke halaman sesuai role-nya
      const redirectMap: Record<string, string> = {
        admin: '/admin',
        officer: '/petugas',
        user: '/dashboard',
      };
      return NextResponse.redirect(new URL(redirectMap[userRole] || '/', request.url));
    }

    return NextResponse.next();
  } catch {
    // Token tidak valid → redirect ke login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/petugas/:path*', '/admin/:path*'],
};
