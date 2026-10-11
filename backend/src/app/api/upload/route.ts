import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth-utils';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export { OPTIONS } from '../../../../lib/cors';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Akses ditolak. Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Tidak ada file yang diunggah.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap unggah foto berekstensi JPG, PNG, WEBP, atau GIF.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file melebihi batas ketentuan 5MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) ? ext : 'jpg';
    const filename = `fac_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'facilities');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const url = `/uploads/facilities/${filename}`;

    return NextResponse.json({
      data: {
        url,
        filename,
        size: file.size,
      },
      message: 'Foto fasilitas berhasil diunggah',
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Gagal mengunggah foto fasilitas. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
