'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {user?.name}! 👋
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Kelola reservasi dan laporan kerusakan fasilitas kampus Anda di sini.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/reservations/new">
          <div className="p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-md">
            <div className="text-3xl mb-3">📅</div>
            <div className="font-semibold text-lg">Buat Reservasi</div>
            <div className="text-sm text-blue-100 mt-1">
              Reservasi ruangan, lab, atau fasilitas lainnya
            </div>
          </div>
        </Link>

        <Link href="/dashboard/reports/new">
          <div className="p-6 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors cursor-pointer shadow-md">
            <div className="text-3xl mb-3">🔧</div>
            <div className="font-semibold text-lg">Laporkan Kerusakan</div>
            <div className="text-sm text-orange-100 mt-1">
              Laporkan kerusakan atau masalah pada fasilitas
            </div>
          </div>
        </Link>

        <Link href="/dashboard/reservations">
          <div className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-3">📋</div>
            <div className="font-semibold text-gray-900">Riwayat Reservasi</div>
            <div className="text-sm text-gray-500 mt-1">
              Lihat dan kelola reservasi Anda
            </div>
          </div>
        </Link>

        <Link href="/dashboard/reports">
          <div className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-3">📝</div>
            <div className="font-semibold text-gray-900">Laporan Saya</div>
            <div className="text-sm text-gray-500 mt-1">
              Pantau status laporan kerusakan Anda
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-700">
          💡 <strong>Tips:</strong> Cek ketersediaan fasilitas di halaman{' '}
          <Link href="/facilities" className="underline font-medium">
            Fasilitas
          </Link>{' '}
          sebelum membuat reservasi.
        </p>
      </div>
    </div>
  );
}
