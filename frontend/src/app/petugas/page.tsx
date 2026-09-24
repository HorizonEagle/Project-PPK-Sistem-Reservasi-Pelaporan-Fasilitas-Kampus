'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function PetugasPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Petugas 🔧</h1>
        <p className="mt-1 text-sm text-gray-600">
          Selamat datang, {user?.name}! Kelola reservasi dan laporan dari sini.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/petugas/reservations">
          <div className="p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-md">
            <div className="text-3xl mb-3">📅</div>
            <div className="font-semibold text-lg">Antrian Reservasi</div>
            <div className="text-sm text-blue-100 mt-1">Proses approve/reject reservasi</div>
          </div>
        </Link>
        <Link href="/petugas/reports">
          <div className="p-6 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors cursor-pointer shadow-md">
            <div className="text-3xl mb-3">🔧</div>
            <div className="font-semibold text-lg">Antrian Laporan</div>
            <div className="text-sm text-orange-100 mt-1">Tangani laporan kerusakan</div>
          </div>
        </Link>
        <Link href="/petugas/facilities">
          <div className="p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-3xl mb-3">🏛️</div>
            <div className="font-semibold text-gray-900">Status Fasilitas</div>
            <div className="text-sm text-gray-500 mt-1">Kelola status & maintenance</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
