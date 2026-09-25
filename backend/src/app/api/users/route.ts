import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { createUserSchema } from '@/lib/validators/auth';
import { ZodError } from 'zod';
import { getAuthUser } from '@/lib/auth-utils';
export { OPTIONS } from '../../../../lib/cors';

/**
 * GET /api/users
 * List semua user (Admin only)
 * Query params: ?role=user|officer|admin&status=active|pending_verification|rejected&page=1&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const requestRole = authUser?.role ?? null;
    if (requestRole !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang dapat melihat daftar user.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as 'admin' | 'officer' | 'user' | null;
    const status = searchParams.get('status') as
      | 'active'
      | 'pending_verification'
      | 'rejected'
      | null;
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Buat akun pengguna/petugas baru (Admin only)
 * Akun langsung berstatus active
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    const requestRole = authUser?.role ?? null;
    if (requestRole !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang dapat membuat akun.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Cek email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(validatedData.password);

    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        status: 'active', // Admin bypass verifikasi
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        data: newUser,
        message: `Akun ${validatedData.role === 'officer' ? 'petugas' : 'pengguna'} berhasil dibuat.`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Data yang dikirim tidak valid',
          details: error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    console.error('POST /api/users error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}
