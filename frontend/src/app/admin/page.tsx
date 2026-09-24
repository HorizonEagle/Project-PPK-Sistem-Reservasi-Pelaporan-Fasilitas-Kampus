'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import { Spinner, Alert, Card } from '@/components/ui';
import type { PaginatedResponse, User } from '@/types';
import { formatDateTime, userStatusColor, userStatusLabel, userRoleLabel } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [pendingUsers, setPendingUsers] = useState<PaginatedResponse<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    usersApi
      .list({ status: 'pending_verification', limit: '5' } as Record<string, string>)
      .then((res) => setPendingUsers(res))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const stats = [
    {
      label: 'Menunggu Verifikasi',
      value: pendingUsers?.meta.total ?? '—',
      icon: '⏳',
      href: '/admin/users?status=pending_verification',
      color: 'bg-yellow-50 border-yellow-200',
    },
    {
      label: 'Kelola Fasilitas',
      value: 'CRUD',
      icon: '🏛️',
      href: '/admin/facilities',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      label: 'Rekap & Ekspor',
      value: 'CSV/PDF',
      icon: '📋',
      href: '/admin/reports',
      color: 'bg-green-50 border-green-200',
    },
    {
      label: 'Semua Pengguna',
      value: 'List',
      icon: '👥',
      href: '/admin/users',
      color: 'bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="mt-1 text-sm text-gray-600">
          Selamat datang! Kelola fasilitas, pengguna, dan rekap data di sini.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div
              className={`p-4 rounded-xl border ${stat.color} hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending Verifications */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">
            ⏳ Akun Menunggu Verifikasi
          </h2>
          <Link
            href="/admin/users?status=pending_verification"
            className="text-sm text-blue-600 hover:underline"
          >
            Lihat semua →
          </Link>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : !pendingUsers?.data.length ? (
          <p className="text-sm text-gray-500 text-center py-6">
            ✅ Tidak ada akun yang menunggu verifikasi.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingUsers.data.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
              >
                <div>
                  <div className="font-medium text-gray-900 text-sm">{user.name}</div>
                  <div className="text-xs text-gray-500">
                    {user.email} · Daftar {formatDateTime(user.createdAt)}
                  </div>
                </div>
                <Link href="/admin/users">
                  <span className="text-xs text-blue-600 font-medium hover:underline">
                    Proses →
                  </span>
                </Link>
              </div>
            ))}
            {pendingUsers.meta.total > 5 && (
              <p className="text-xs text-gray-500 text-center pt-2">
                Dan {pendingUsers.meta.total - 5} lainnya...
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/users/create">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <div className="flex items-center gap-4">
              <span className="text-3xl">➕</span>
              <div>
                <div className="font-semibold text-gray-900">Buat Akun Baru</div>
                <div className="text-sm text-gray-500">Tambah petugas atau pengguna</div>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/admin/facilities">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <div className="flex items-center gap-4">
              <span className="text-3xl">🏛️</span>
              <div>
                <div className="font-semibold text-gray-900">Kelola Fasilitas</div>
                <div className="text-sm text-gray-500">Tambah, edit, nonaktifkan</div>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
