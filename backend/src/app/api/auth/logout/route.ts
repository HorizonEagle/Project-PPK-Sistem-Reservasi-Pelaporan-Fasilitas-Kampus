import { NextRequest, NextResponse } from 'next/server';
export { OPTIONS } from '@/lib/cors';

// Logout dilakukan di client dengan menghapus token.
// Endpoint ini disediakan untuk konsistensi API dan bisa digunakan
// untuk logging/audit di masa depan.
export async function POST(request: NextRequest) {
  return NextResponse.json({
    data: null,
    message: 'Logout berhasil. Silakan hapus token dari client.',
  });
}
