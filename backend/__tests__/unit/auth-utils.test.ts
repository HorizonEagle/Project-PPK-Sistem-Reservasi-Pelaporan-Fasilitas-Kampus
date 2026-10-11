import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { getAuthUser } from '../../lib/auth-utils';
import { generateToken } from '../../lib/auth';
import { getJwtSecret } from '../../lib/jwt-secret';

function requestWith(headers: Record<string, string>) {
  return new NextRequest('http://localhost:3001/api/users', { headers });
}

async function signRaw(payload: Record<string, unknown>, secret: Uint8Array = getJwtSecret()) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

describe('getAuthUser', () => {
  it('returns null when there is no Authorization header', async () => {
    expect(await getAuthUser(requestWith({}))).toBeNull();
  });

  // Regresi: sebelumnya header x-user-* dipercaya mentah-mentah sehingga siapa pun bisa
  // menjadi admin tanpa token (GET /api/users dengan `x-user-role: admin` mengembalikan 200).
  it('ignores spoofed x-user-* headers when no token is sent', async () => {
    const user = await getAuthUser(
      requestWith({
        'x-user-id': 'attacker',
        'x-user-email': 'attacker@evil.test',
        'x-user-role': 'admin',
      })
    );
    expect(user).toBeNull();
  });

  it('takes identity from the verified token, never from x-user-* headers', async () => {
    const token = await generateToken({ userId: 'u1', email: 'budi@mahasiswa.ac.id', role: 'user' });
    const user = await getAuthUser(
      requestWith({
        authorization: `Bearer ${token}`,
        'x-user-id': 'attacker',
        'x-user-email': 'attacker@evil.test',
        'x-user-role': 'admin',
      })
    );
    expect(user).toEqual({ userId: 'u1', email: 'budi@mahasiswa.ac.id', role: 'user' });
  });

  it('returns the user for a valid token', async () => {
    const token = await generateToken({ userId: 'a1', email: 'admin@kampus.ac.id', role: 'admin' });
    const user = await getAuthUser(requestWith({ authorization: `Bearer ${token}` }));
    expect(user).toEqual({ userId: 'a1', email: 'admin@kampus.ac.id', role: 'admin' });
  });

  it('returns null for a malformed token', async () => {
    expect(await getAuthUser(requestWith({ authorization: 'Bearer abc.def.ghi' }))).toBeNull();
  });

  it('returns null when the scheme is not Bearer', async () => {
    const token = await generateToken({ userId: 'u1', email: 'a@b.test', role: 'user' });
    expect(await getAuthUser(requestWith({ authorization: `Basic ${token}` }))).toBeNull();
  });

  it('returns null for a token signed with a different secret', async () => {
    const forged = await signRaw(
      { userId: 'u1', email: 'a@b.test', role: 'admin' },
      new TextEncoder().encode('some-other-secret')
    );
    expect(await getAuthUser(requestWith({ authorization: `Bearer ${forged}` }))).toBeNull();
  });

  it('returns null when the role claim is not a known role', async () => {
    const token = await signRaw({ userId: 'u1', email: 'a@b.test', role: 'superadmin' });
    expect(await getAuthUser(requestWith({ authorization: `Bearer ${token}` }))).toBeNull();
  });

  it('returns null when the token has no userId', async () => {
    const token = await signRaw({ email: 'a@b.test', role: 'user' });
    expect(await getAuthUser(requestWith({ authorization: `Bearer ${token}` }))).toBeNull();
  });
});
