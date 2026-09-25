import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserSchema } from '@/lib/validators/auth';
import { ZodError } from 'zod';
import { getAuthUser } from '@/lib/auth-utils';
export { OPTIONS } from '@/lib/cors';

/**
 * PATCH /api/users/:id/verify
 * Verifikasi atau tolak akun pending (Admin only)
 * Body: { action: 'approve' | 'reject' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);
    const requestRole = authUser?.role ?? null;
    if (requestRole !== 'admin') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang dapat memverifikasi akun.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = verifyUserSchema.parse(body);

    // Cari user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Hanya bisa verifikasi akun pending
    if (user.status !== 'pending_verification') {
      return NextResponse.json(
        {
          error: `Akun ini tidak dalam status pending. Status saat ini: ${user.status}`,
        },
        { status: 400 }
      );
    }

    // Tidak boleh verifikasi admin via endpoint ini
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Tidak dapat memverifikasi akun admin melalui endpoint ini.' },
        { status: 400 }
      );
    }

    const newStatus = validatedData.action === 'approve' ? 'active' : 'rejected';

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status: newStatus },
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
      message:
        validatedData.action === 'approve'
          ? 'Akun berhasil diverifikasi dan diaktifkan.'
          : 'Akun berhasil ditolak.',
    });
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

    console.error('PATCH /api/users/:id/verify error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.' },
      { status: 500 }
    );
  }
}
