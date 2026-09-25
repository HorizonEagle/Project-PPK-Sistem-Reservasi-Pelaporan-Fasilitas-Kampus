import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'officer' | 'user';
}

/**
 * Ekstrak dan verifikasi JWT dari request header Authorization.
 * Digunakan langsung di route handler karena Next.js 16 TIDAK meneruskan
 * custom headers yang di-set oleh middleware ke route handlers.
 *
 * @returns AuthUser jika token valid, null jika tidak ada/tidak valid
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');

  // Juga cek x-user-id untuk backward compatibility (jika middleware berhasil inject)
  const xUserId = request.headers.get('x-user-id');
  const xUserEmail = request.headers.get('x-user-email');
  const xUserRole = request.headers.get('x-user-role');

  if (xUserId && xUserEmail && xUserRole) {
    return {
      userId: xUserId,
      email: xUserEmail,
      role: xUserRole as AuthUser['role'],
    };
  }

  // Fallback: decode JWT langsung dari Authorization header
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as AuthUser['role'],
    };
  } catch {
    return null;
  }
}
