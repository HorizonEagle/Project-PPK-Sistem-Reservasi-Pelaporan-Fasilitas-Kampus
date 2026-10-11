import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), groupBy: vi.fn().mockResolvedValue([]) },
    facility: { groupBy: vi.fn().mockResolvedValue([]) },
    reservation: { groupBy: vi.fn().mockResolvedValue([]) },
    report: { groupBy: vi.fn().mockResolvedValue([]) },
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}));

import { prisma } from '@/lib/prisma';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as register } from '@/app/api/auth/register/route';
import { hashPassword, verifyToken } from '@/lib/auth';

const mockedUser = prisma.user as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(`http://localhost:3001${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  const baseUser = {
    id: 'u1',
    name: 'Budi',
    email: 'budi@mahasiswa.ac.id',
    role: 'user',
    status: 'active',
    passwordHash: '',
  };

  beforeEach(async () => {
    baseUser.passwordHash = await hashPassword('user12345');
  });

  it('returns 200 with a valid JWT and no passwordHash on correct credentials', async () => {
    mockedUser.findUnique.mockResolvedValue(baseUser);

    const res = await login(
      jsonRequest('/api/auth/login', { email: 'budi@mahasiswa.ac.id', password: 'user12345' })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.user).toEqual({
      id: 'u1',
      name: 'Budi',
      email: 'budi@mahasiswa.ac.id',
      role: 'user',
      status: 'active',
    });
    expect(json.data.user.passwordHash).toBeUndefined();

    const payload = await verifyToken(json.data.token);
    expect(payload).toMatchObject({ userId: 'u1', role: 'user' });
  });

  it('returns 401 for an unknown email', async () => {
    mockedUser.findUnique.mockResolvedValue(null);
    const res = await login(
      jsonRequest('/api/auth/login', { email: 'nobody@kampus.ac.id', password: 'whatever1' })
    );
    expect(res.status).toBe(401);
  });

  it('returns 401 for a wrong password, with the same message as unknown email', async () => {
    mockedUser.findUnique.mockResolvedValue(baseUser);
    const wrongPw = await login(
      jsonRequest('/api/auth/login', { email: baseUser.email, password: 'wrong-password' })
    );
    mockedUser.findUnique.mockResolvedValue(null);
    const unknown = await login(
      jsonRequest('/api/auth/login', { email: 'nobody@kampus.ac.id', password: 'wrong-password' })
    );

    expect(wrongPw.status).toBe(401);
    expect((await wrongPw.json()).error).toBe((await unknown.json()).error);
  });

  it('returns 403 for accounts pending verification', async () => {
    mockedUser.findUnique.mockResolvedValue({ ...baseUser, status: 'pending_verification' });
    const res = await login(
      jsonRequest('/api/auth/login', { email: baseUser.email, password: 'user12345' })
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 for rejected accounts', async () => {
    mockedUser.findUnique.mockResolvedValue({ ...baseUser, status: 'rejected' });
    const res = await login(
      jsonRequest('/api/auth/login', { email: baseUser.email, password: 'user12345' })
    );
    expect(res.status).toBe(403);
  });

  it('returns 422 with field details on invalid payload', async () => {
    const res = await login(jsonRequest('/api/auth/login', { email: 'bad', password: '' }));
    const json = await res.json();
    expect(res.status).toBe(422);
    expect(json.details.email).toBeDefined();
    expect(mockedUser.findUnique).not.toHaveBeenCalled();
  });

  it('returns 500 when the database throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedUser.findUnique.mockRejectedValue(new Error('db down'));
    const res = await login(
      jsonRequest('/api/auth/login', { email: baseUser.email, password: 'user12345' })
    );
    expect(res.status).toBe(500);
  });
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  const payload = { name: 'Siti Aminah', email: 'Siti@Mahasiswa.ac.id', password: 'password123' };

  it('creates a pending user with a hashed password and returns 201', async () => {
    mockedUser.findUnique.mockResolvedValue(null);
    mockedUser.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'u2',
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      createdAt: new Date(),
    }));

    const res = await register(jsonRequest('/api/auth/register', payload));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data).toMatchObject({
      email: 'siti@mahasiswa.ac.id',
      role: 'user',
      status: 'pending_verification',
    });

    const created = mockedUser.create.mock.calls[0][0].data;
    expect(created.passwordHash).toBeTypeOf('string');
    expect(created.passwordHash).not.toBe(payload.password);
  });

  it('ignores a client-supplied role (no privilege escalation)', async () => {
    mockedUser.findUnique.mockResolvedValue(null);
    mockedUser.create.mockResolvedValue({ id: 'u3' });

    await register(jsonRequest('/api/auth/register', { ...payload, role: 'mahasiswa' }));

    expect(mockedUser.create.mock.calls[0][0].data.role).toBe('user');
  });

  it('returns 409 when the email already exists', async () => {
    mockedUser.findUnique.mockResolvedValue({ id: 'existing' });
    const res = await register(jsonRequest('/api/auth/register', payload));
    expect(res.status).toBe(409);
    expect(mockedUser.create).not.toHaveBeenCalled();
  });

  it('returns 422 for a short password', async () => {
    const res = await register(jsonRequest('/api/auth/register', { ...payload, password: 'short' }));
    expect(res.status).toBe(422);
  });
});
