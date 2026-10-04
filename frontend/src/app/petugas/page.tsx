'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { dashboardApi } from '@/lib/api';
import { StatCard, Card } from '@/components/ui';
import type { DashboardStats } from '@/types';

export default function PetugasPage() {
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
        // Fallback gracefully jika ada kendala jaringan
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink">
          Dashboard Petugas Fasilitas
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Selamat bertugas, <span className="font-semibold text-ink">{user?.name}</span>! Tinjau antrian reservasi, tangani kerusakan, dan perbarui kesiapan fasilitas.
        </p>
      </div>

      {/* StatCards Row (Fase 2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/petugas/reservations" className="block">
          <StatCard
            label="Antrian Reservasi"
            value={isLoading ? '...' : (stats?.pendingReservations ?? 0)}
            variant="warning"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </Link>
        <Link href="/petugas/reports" className="block">
          <StatCard
            label="Laporan Baru"
            value={isLoading ? '...' : (stats?.newReports ?? stats?.totalReports ?? 0)}
            variant="accent"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </Link>
        <Link href="/petugas/facilities" className="block">
          <StatCard
            label="Fasilitas Perbaikan"
            value={isLoading ? '...' : (stats?.maintenanceFacilities ?? 0)}
            variant="warning"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          />
        </Link>
        <Link href="/petugas/facilities" className="block">
          <StatCard
            label="Fasilitas Aktif"
            value={isLoading ? '...' : (stats?.activeFacilities ?? stats?.totalFacilities ?? 0)}
            variant="success"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
        </Link>
      </div>

      {/* Main Operations Action Cards */}
      <div>
        <h2 className="text-lg font-bold font-heading text-ink mb-4">Operasional Lapangan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link href="/petugas/reservations" className="group">
            <div className="p-6 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-200 cursor-pointer shadow-card group-hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="font-bold font-heading text-lg">Antrian Reservasi</div>
              <p className="text-xs text-primary-100 mt-1.5 leading-relaxed">
                Tinjau permohonan penggunaan ruangan, verifikasi tujuan peminjaman, serta berikan persetujuan atau penolakan.
              </p>
            </div>
          </Link>

          <Link href="/petugas/reports" className="group">
            <div className="p-6 bg-sienna text-white rounded-xl hover:opacity-95 transition-all duration-200 cursor-pointer shadow-card group-hover:-translate-y-0.5">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="font-bold font-heading text-lg">Antrian Laporan</div>
              <p className="text-xs text-white/90 mt-1.5 leading-relaxed">
                Tindak lanjuti laporan kerusakan sarana prasarana dan mutakhirkan status pengerjaan hingga selesai.
              </p>
            </div>
          </Link>

          <Link href="/petugas/facilities" className="group">
            <Card className="hover:border-primary-500/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full">
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-4 border border-primary-200/50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="font-bold font-heading text-base text-ink">Status Fasilitas</div>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Ubah ketersediaan ruangan menjadi pemeliharaan jika sedang dilakukan perbaikan menyeluruh.
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
