import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/:id
 * Detail user (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestRole = request.headers.get('x-user-role');
    if (requestRole !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reservations: true,
            reports: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user, message: 'Berhasil.' });
  } catch (error) {
    console.error('GET /api/users/:id error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/:id
 * Update data user (Admin only) — nama, role, status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requestRole = request.headers.get('x-user-role');
    if (requestRole !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Hanya update field yang diizinkan
    const { name, role, status } = body;
    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (role && ['admin', 'officer', 'user'].includes(role)) updateData.role = role;
    if (status && ['active', 'pending_verification', 'rejected'].includes(status)) {
      updateData.status = status;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan.' },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: updatedUser,
      message: 'Data user berhasil diperbarui.',
    });
  } catch (error) {
    console.error('PATCH /api/users/:id error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}
