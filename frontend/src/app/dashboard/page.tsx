'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { dashboardApi } from '@/lib/api';
import { StatCard, Card } from '@/components/ui';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getStats()
      .then((res) => {
        if (res.data) setStats(res.data);
      })
      .catch(() => {
        // Fallback gracefully jika endpoint sedang terbatas
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink">
            Selamat Datang, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Pantau dan kelola seluruh reservasi serta laporan kerusakan fasilitas Anda.
          </p>
        </div>
        <Link
          href="/dashboard/reservations/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Reservasi Baru
        </Link>
      </div>

      {/* StatCards Row (Fase 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Reservasi"
          value={isLoading ? '...' : (stats?.totalReservations ?? 0)}
          variant="primary"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Menunggu Review"
          value={isLoading ? '...' : (stats?.pendingReservations ?? 0)}
          variant="warning"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Laporan Kerusakan"
          value={isLoading ? '...' : (stats?.totalReports ?? 0)}
          variant="accent"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          label="Fasilitas Aktif"
          value={isLoading ? '...' : (stats?.activeFacilities ?? 0)}
          variant="success"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-lg font-bold font-heading text-ink mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/reservations/new" className="group">
            <div className="p-6 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 cursor-pointer shadow-card group-hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="font-bold font-heading text-lg">Buat Reservasi Baru</div>
              <p className="text-xs text-primary-100 mt-1 leading-relaxed">
                Pilih ruangan, ruang seminar, lab komputer, atau aula sesuai kebutuhan agenda Anda.
              </p>
            </div>
          </Link>

          <Link href="/dashboard/reports/new" className="group">
            <div className="p-6 bg-sienna text-white rounded-xl hover:opacity-95 transition-all duration-200 cursor-pointer shadow-card group-hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="font-bold font-heading text-lg">Laporkan Kerusakan</div>
              <p className="text-xs text-white/90 mt-1 leading-relaxed">
                Kirim informasi kendala fasilitas disertai deskripsi masalah agar segera ditangani petugas.
              </p>
            </div>
          </Link>

          <Link href="/dashboard/reservations" className="group">
            <Card className="hover:border-primary-500/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-4 border border-primary-200/50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="font-bold font-heading text-base text-ink">Riwayat Reservasi</div>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Cek jadwal peminjaman mendatang, status persetujuan, dan unduh rincian peminjaman.
              </p>
            </Card>
          </Link>

          <Link href="/dashboard/reports" className="group">
            <Card className="hover:border-primary-500/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4 border border-accent/20">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="font-bold font-heading text-base text-ink">Laporan Saya</div>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Pantau proses verifikasi dan penyelesaian perbaikan yang sedang dikerjakan petugas lapangan.
              </p>
            </Card>
          </Link>
        </div>
      </div>

      {/* Helpful Tips Card */}
      <div className="p-5 bg-surface border border-line rounded-xl shadow-xs flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 text-xs leading-relaxed text-ink-soft">
          <strong className="text-ink font-semibold">Petunjuk Peminjaman:</strong> Pastikan Anda telah memeriksa ketersediaan slot kosong melalui halaman{' '}
          <Link href="/facilities" className="text-primary-600 hover:underline font-semibold">
            Katalog Fasilitas
          </Link>{' '}
          sebelum mengajukan reservasi untuk menghindari penolakan jadwal ganda.
        </div>
      </div>
    </div>
  );
}
