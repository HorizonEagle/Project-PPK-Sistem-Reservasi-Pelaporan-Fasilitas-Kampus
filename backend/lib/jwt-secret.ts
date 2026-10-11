/**
 * Sumber tunggal JWT secret untuk auth.ts, auth-utils.ts, dan src/proxy.ts.
 *
 * Di production, JWT_SECRET WAJIB diatur: tanpa itu siapa pun yang tahu string bawaan
 * dapat menandatangani token palsu. Di development/test dipakai secret bawaan agar
 * `npm run dev` dan Vitest tetap jalan tanpa konfigurasi.
 *
 * Dibaca saat dipakai (bukan saat import) supaya `next build` di Docker, yang tidak
 * memiliki env runtime, tidak gagal.
 */
const DEV_FALLBACK_SECRET = 'fallback-secret-change-in-production';

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET wajib diatur di environment production.');
    }
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
  }

  return new TextEncoder().encode(secret);
}
