import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from './jwt-secret';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'officer' | 'user';
}

const VALID_ROLES: AuthUser['role'][] = ['admin', 'officer', 'user'];

/**
 * Ekstrak dan verifikasi JWT dari request header Authorization.
 *
 * Identitas HANYA diambil dari token yang tanda tangannya terverifikasi.
 * Header `x-user-*` sengaja TIDAK dipercaya: header itu bisa ditulis siapa pun
 * dari sisi klien, sehingga membacanya sama dengan membiarkan penyerang memilih
 * perannya sendiri (mis. `x-user-role: admin` tanpa token).
 *
 * @returns AuthUser jika token valid dan berisi payload yang lengkap, null jika tidak
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    const { userId, email, role } = payload as Record<string, unknown>;
    if (
      typeof userId !== 'string' ||
      typeof email !== 'string' ||
      typeof role !== 'string' ||
      !VALID_ROLES.includes(role as AuthUser['role'])
    ) {
      return null;
    }

    return { userId, email, role: role as AuthUser['role'] };
  } catch {
    return null;
  }
}
