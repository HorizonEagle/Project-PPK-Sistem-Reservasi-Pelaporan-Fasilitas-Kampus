'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { facilitiesApi } from '@/lib/api';
import { Card, Badge, Spinner, Alert } from '@/components/ui';
import { SlotGrid, DatePicker } from '@/components/calendar';
import {
  facilityTypeLabel,
  facilityStatusLabel,
  facilityStatusColor,
} from '@/lib/utils';
import type { Facility } from '@/types';

export default function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Date for schedule
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    setIsLoading(true);
    setError('');

    facilitiesApi
      .get(id)
      .then((res) => setFacility(res.data))
      .catch((err) => setError(err.message || 'Gagal memuat fasilitas'))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Facility type icon
  const typeIcon = (t: string) => {
    const icons: Record<string, string> = {
      classroom: '🏫',
      auditorium: '🎭',
      laboratory: '🔬',
      equipment: '🔧',
      field: '⚽',
    };
    return icons[t] || '🏛️';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Alert type="error" title="Error">
          {error || 'Fasilitas tidak ditemukan'}
        </Alert>
        <div className="mt-4">
          <Link
            href="/facilities"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Kembali ke daftar fasilitas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh]">
      {/* Header */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/facilities"
            className="text-blue-200 hover:text-white text-sm mb-4 inline-block transition-colors"
          >
            ← Kembali ke Daftar Fasilitas
          </Link>
          <div className="flex items-start gap-4">
            <span className="text-5xl opacity-80">
              {typeIcon(facility.type)}
            </span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {facility.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-blue-100">
                <Badge className="bg-white/20 text-white">
                  {facilityTypeLabel(facility.type)}
                </Badge>
                <Badge className={facilityStatusColor(facility.status)}>
                  {facilityStatusLabel(facility.status)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Informasi Fasilitas
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Tipe
                  </dt>
                  <dd className="text-sm text-gray-900 mt-0.5">
                    {facilityTypeLabel(facility.type)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Lokasi
                  </dt>
                  <dd className="text-sm text-gray-900 mt-0.5 flex items-center gap-1">
                    📍 {facility.location}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Kapasitas
                  </dt>
                  <dd className="text-sm text-gray-900 mt-0.5 flex items-center gap-1">
                    👥 {facility.capacity} orang
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <Badge className={facilityStatusColor(facility.status)}>
                      {facilityStatusLabel(facility.status)}
                    </Badge>
                  </dd>
                </div>
              </dl>

              {facility.description && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Deskripsi
                  </dt>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {facility.description}
                  </p>
                </div>
              )}
            </Card>

            {/* Info box */}
            <Alert type="info" title="Cara Reservasi">
              Untuk mereservasi fasilitas ini, silakan{' '}
              <Link
                href="/login"
                className="text-blue-700 font-medium hover:underline"
              >
                login
              </Link>{' '}
              terlebih dahulu, lalu ajukan reservasi melalui dashboard Anda.
            </Alert>
          </div>

          {/* Right: Schedule */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-base font-semibold text-gray-900">
                  📅 Jadwal Ketersediaan
                </h2>
                <DatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  minDate={today}
                />
              </div>

              {facility.status === 'inactive' ? (
                <Alert type="warning" title="Fasilitas Nonaktif">
                  Fasilitas ini sedang tidak aktif dan tidak menerima reservasi.
                </Alert>
              ) : facility.status === 'under_maintenance' ? (
                <Alert type="warning" title="Dalam Perbaikan">
                  Fasilitas ini sedang dalam perbaikan dan semua slot tidak tersedia.
                </Alert>
              ) : null}

              <SlotGrid
                facilityId={facility.id}
                selectedDate={selectedDate}
              />
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
