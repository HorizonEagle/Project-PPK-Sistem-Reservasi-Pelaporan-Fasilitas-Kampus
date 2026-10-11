import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
} from '../../lib/auth';
import type { JWTPayload } from '../../lib/auth';

// ─── Password Hashing ────────────────────────────────────────────────────────

describe('hashPassword / verifyPassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const plain = 'mysecretpassword';
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);

    const isValid = await verifyPassword(plain, hash);
    expect(isValid).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('correct');
    const isValid = await verifyPassword('wrong', hash);
    expect(isValid).toBe(false);
  });

  it('produces different hashes for same input (salt)', async () => {
    const hash1 = await hashPassword('samepassword');
    const hash2 = await hashPassword('samepassword');
    expect(hash1).not.toBe(hash2);
  });
});

// ─── JWT Token ────────────────────────────────────────────────────────────────

describe('generateToken / verifyToken', () => {
  const payload: JWTPayload = {
    userId: 'user-123',
    email: 'test@kampus.ac.id',
    role: 'user',
  };

  it('generates a string token', async () => {
    const token = await generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  it('round-trips: generate then verify', async () => {
    const token = await generateToken(payload);
    const decoded = await verifyToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe(payload.userId);
    expect(decoded!.email).toBe(payload.email);
    expect(decoded!.role).toBe(payload.role);
  });

  it('returns null for invalid token', async () => {
    const decoded = await verifyToken('invalid.token.here');
    expect(decoded).toBeNull();
  });

  it('returns null for tampered token', async () => {
    const token = await generateToken(payload);
    const tampered = token.slice(0, -5) + 'XXXXX';
    const decoded = await verifyToken(tampered);
    expect(decoded).toBeNull();
  });

  it('preserves role across different role values', async () => {
    for (const role of ['admin', 'officer', 'user'] as const) {
      const token = await generateToken({ ...payload, role });
      const decoded = await verifyToken(token);
      expect(decoded!.role).toBe(role);
    }
  });
});
