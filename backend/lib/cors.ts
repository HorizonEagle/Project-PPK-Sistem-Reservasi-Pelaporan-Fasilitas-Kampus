import { NextResponse } from 'next/server';

/**
 * CORS headers untuk route-level OPTIONS handler.
 * Ini adalah fallback terakhir jika middleware DAN next.config.ts
 * tidak berhasil menghandle preflight OPTIONS.
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

/**
 * Standard OPTIONS handler untuk API routes.
 * Export ini dari setiap route file agar Next.js tahu bahwa
 * route ini menerima OPTIONS method dan mengembalikan CORS headers.
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

export { CORS_HEADERS };
