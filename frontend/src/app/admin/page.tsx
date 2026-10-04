'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usersApi, dashboardApi } from '@/lib/api';
import { Spinner, Alert, Card, StatCard, Avatar, StatusBadge } from '@/components/ui';
import type { PaginatedResponse, User, DashboardStats } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [pendingUsers, setPendingUsers] = useState<PaginatedResponse<User> | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.allSettled([
      usersApi.list({ status: 'pending_verification', limit: '5' } as Record<string, string>),
      dashboardApi.getStats(),
    ])
      .then(([usersRes, statsRes]) => {
        if (usersRes.status === 'fulfilled') {
          setPendingUsers(usersRes.value);
        } else {
          setError(usersRes.reason?.message || 'Gagal memuat data verifikasi');
        }

        if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
          setStats(statsRes.value.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink">
            Dashboard Administrator
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Pusat manajemen sistem fasilitas kampus, persetujuan akun, dan monitoring statistik.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin/users/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-md hover:bg-primary-700 transition-colors shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Akun
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid with Real Metrics (Fase 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/users?status=pending_verification" className="block">
          <StatCard
            label="Menunggu Verifikasi"
            value={isLoading ? '...' : (pendingUsers?.meta.total ?? stats?.pendingUsers ?? 0)}
            variant="warning"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </Link>
        <Link href="/admin/facilities" className="block">
          <StatCard
            label="Total Fasilitas"
            value={isLoading ? '...' : (stats?.totalFacilities ?? 0)}
            variant="primary"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
        </Link>
        <Link href="/admin/reports" className="block">
          <StatCard
            label="Total Reservasi"
            value={isLoading ? '...' : (stats?.totalReservations ?? 0)}
            variant="success"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
        </Link>
        <Link href="/admin/users" className="block">
          <StatCard
            label="Pengguna Terdaftar"
            value={isLoading ? '...' : (stats?.totalUsers ?? '—')}
            variant="accent"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </Link>
      </div>

      {/* Pending Verifications Section */}
      <Card>
        <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold font-heading text-ink">
                Akun Menunggu Verifikasi
              </h2>
              <p className="text-xs text-ink-soft">Pendaftar baru yang memerlukan persetujuan aktivasi</p>
            </div>
          </div>
          <Link
            href="/admin/users?status=pending_verification"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
          >
            Lihat Semua ({pendingUsers?.meta.total ?? 0}) →
          </Link>
        </div>

        {error && <Alert type="error" className="mb-4">{error}</Alert>}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : !pendingUsers?.data.length ? (
          <div className="text-center py-10 px-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-ink">Semua Akun Telah Diverifikasi</p>
            <p className="text-xs text-ink-muted mt-1">Tidak ada antrian pendaftar baru yang menunggu saat ini.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingUsers.data.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3.5 bg-surface hover:bg-canvas rounded-lg border border-line transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} role={user.role} size="md" />
                  <div>
                    <div className="font-semibold text-ink text-sm flex items-center gap-2">
                      {user.name}
                      <StatusBadge status="pending_verification" />
                    </div>
                    <div className="text-xs text-ink-soft mt-0.5">
                      {user.email} · Mendaftar pada {formatDateTime(user.createdAt)}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-md text-xs font-semibold transition-colors"
                >
                  Periksa Akun →
                </Link>
              </div>
            ))}
            {pendingUsers.meta.total > 5 && (
              <p className="text-xs text-ink-muted text-center pt-2">
                Menampilkan 5 dari total {pendingUsers.meta.total} akun yang menunggu.
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/admin/users/create" className="group">
          <Card className="hover:border-primary-500/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-200/50">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <div className="font-bold font-heading text-base text-ink">Registrasi Pengguna Baru</div>
                <div className="text-xs text-ink-soft mt-0.5">Buat kredensial akun untuk staf pengelola atau mahasiswa</div>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/admin/facilities" className="group">
          <Card className="hover:border-primary-500/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="font-bold font-heading text-base text-ink">Kelola Master Fasilitas</div>
                <div className="text-xs text-ink-soft mt-0.5">Pengaturan kapasitas, spesifikasi, lokasi, dan status operasional</div>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
