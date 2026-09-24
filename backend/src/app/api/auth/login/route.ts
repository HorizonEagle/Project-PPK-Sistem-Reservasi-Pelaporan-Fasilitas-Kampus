import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validators/auth';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validasi input
    const validatedData = loginSchema.parse(body);

    // 2. Cari user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password salah.' },
        { status: 401 }
      );
    }

    // 3. Verifikasi password
    const isPasswordValid = await verifyPassword(
      validatedData.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email atau password salah.' },
        { status: 401 }
      );
    }

    // 4. Cek status akun
    if (user.status === 'pending_verification') {
      return NextResponse.json(
        {
          error:
            'Akun Anda belum diverifikasi oleh admin. Silakan tunggu atau hubungi administrator.',
        },
        { status: 403 }
      );
    }

    if (user.status === 'rejected') {
      return NextResponse.json(
        {
          error:
            'Akun Anda ditolak oleh admin. Silakan hubungi administrator untuk informasi lebih lanjut.',
        },
        { status: 403 }
      );
    }

    // 5. Generate JWT
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 6. Return token dan data user (tanpa passwordHash)
    return NextResponse.json({
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      message: 'Login berhasil.',
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

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
