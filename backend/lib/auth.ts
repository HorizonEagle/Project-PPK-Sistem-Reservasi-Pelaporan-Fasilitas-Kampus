import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'officer' | 'user';
}

export type UserRole = 'admin' | 'officer' | 'user';

// ─── Password Hashing ─────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

/**
 * Hash plain text password menggunakan bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifikasi password terhadap hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

/**
 * Generate JWT token dengan payload user
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
}

/**
 * Verifikasi dan decode JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// ─── Request Auth Helpers ─────────────────────────────────────────────────────

/**
 * Ekstrak token dari request header Authorization: Bearer <token>
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Verifikasi autentikasi dari request.
 * Return payload jika valid, null jika tidak.
 */
export async function authenticate(
  request: NextRequest
): Promise<JWTPayload | null> {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Verifikasi autentikasi DAN role tertentu dari request.
 * Return payload jika valid dan memiliki role yang diizinkan, null jika tidak.
 */
export async function authenticateWithRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<JWTPayload | null> {
  const payload = await authenticate(request);
  if (!payload) return null;
  if (!allowedRoles.includes(payload.role)) return null;
  return payload;
}

// ─── Response Helpers ─────────────────────────────────────────────────────────

/**
 * Standard unauthorized response
 */
export function unauthorizedResponse(message = 'Autentikasi diperlukan') {
  return Response.json({ error: message }, { status: 401 });
}

/**
 * Standard forbidden response
 */
export function forbiddenResponse(message = 'Akses ditolak') {
  return Response.json({ error: message }, { status: 403 });
}
