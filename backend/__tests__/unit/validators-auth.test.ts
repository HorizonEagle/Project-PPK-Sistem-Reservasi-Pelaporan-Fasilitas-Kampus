import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  createUserSchema,
  verifyUserSchema,
} from '../../lib/validators/auth';

// ─── registerSchema ───────────────────────────────────────────────────────────

describe('registerSchema', () => {
  const validInput = {
    name: 'Budi Santoso',
    email: 'BUDI@kampus.ac.id',
    password: 'securepass123',
  };

  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('lowercases the email', () => {
    const result = registerSchema.safeParse(validInput);
    if (result.success) {
      expect(result.data.email).toBe('budi@kampus.ac.id');
    }
  });

  it('accepts optional role field', () => {
    const result = registerSchema.safeParse({ ...validInput, role: 'mahasiswa' });
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 chars', () => {
    const result = registerSchema.safeParse({ ...validInput, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ ...validInput, email: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 chars', () => {
    const result = registerSchema.safeParse({ ...validInput, password: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role value', () => {
    const result = registerSchema.safeParse({ ...validInput, role: 'admin' });
    expect(result.success).toBe(false);
  });

  it('allows registration without role', () => {
    const { role: _, ...noRole } = { ...validInput, role: undefined };
    void _;
    const result = registerSchema.safeParse(noRole);
    expect(result.success).toBe(true);
  });
});

// ─── loginSchema ──────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'admin@kampus.ac.id',
      password: 'admin123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@kampus.ac.id',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid',
      password: 'test123',
    });
    expect(result.success).toBe(false);
  });
});

// ─── createUserSchema ─────────────────────────────────────────────────────────

describe('createUserSchema', () => {
  const validAdmin = {
    name: 'Test Officer',
    email: 'officer@kampus.ac.id',
    password: 'password123',
    role: 'officer' as const,
  };

  it('accepts valid officer creation', () => {
    const result = createUserSchema.safeParse(validAdmin);
    expect(result.success).toBe(true);
  });

  it('accepts user role', () => {
    const result = createUserSchema.safeParse({ ...validAdmin, role: 'user' });
    expect(result.success).toBe(true);
  });

  it('rejects admin role (admin cannot create another admin)', () => {
    const result = createUserSchema.safeParse({ ...validAdmin, role: 'admin' });
    expect(result.success).toBe(false);
  });
});

// ─── verifyUserSchema ─────────────────────────────────────────────────────────

describe('verifyUserSchema', () => {
  it('accepts approve', () => {
    expect(verifyUserSchema.safeParse({ action: 'approve' }).success).toBe(true);
  });

  it('accepts reject', () => {
    expect(verifyUserSchema.safeParse({ action: 'reject' }).success).toBe(true);
  });

  it('rejects unknown action', () => {
    expect(verifyUserSchema.safeParse({ action: 'delete' }).success).toBe(false);
  });
});
