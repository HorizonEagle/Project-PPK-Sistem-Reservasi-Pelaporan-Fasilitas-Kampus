import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validators/auth';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validasi input dengan Zod
    const validatedData = registerSchema.parse(body);

    // 2. Cek email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Gunakan email lain atau login.' },
        { status: 409 }
      );
    }

    // 3. Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // 4. Simpan user baru (status: pending_verification)
    const newUser = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: 'user',
        status: 'pending_verification',
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
        message:
          'Registrasi berhasil. Akun Anda sedang menunggu verifikasi oleh admin sebelum dapat digunakan.',
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

    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
