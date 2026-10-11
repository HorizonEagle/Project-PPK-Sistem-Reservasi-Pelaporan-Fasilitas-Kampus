'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { facilitiesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Card, Badge, Spinner, Alert } from '@/components/ui';
import { SlotGrid, DatePicker } from '@/components/calendar';
import {
  facilityTypeLabel,
  facilityStatusLabel,
  facilityStatusColor,
  getFacilityImageUrl,
  handleFacilityImageError,
  todayInJakarta,
} from '@/lib/utils';
import type { Facility } from '@/types';

export default function FacilityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuthenticated } = useAuth();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Date for schedule
  const today = todayInJakarta();
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
      {/* Header with Horizontal Hero Image */}
      <section className="relative bg-ink text-white py-14 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={getFacilityImageUrl(facility)}
            alt={facility.name}
            onError={(e) => handleFacilityImageError(e, facility.type)}
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/facilities"
            className="text-white/80 hover:text-white text-sm mb-4 inline-flex items-center gap-1.5 transition-colors"
          >
            ← Kembali ke Daftar Fasilitas
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2">
                {facility.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                <Badge className="bg-white/20 text-white border-white/20">
                  {facilityTypeLabel(facility.type)}
                </Badge>
                <Badge className={facilityStatusColor(facility.status)}>
                  {facilityStatusLabel(facility.status)}
                </Badge>
              </div>
            </div>
            <Link
              href={`/dashboard/reservations/new?facilityId=${facility.id}`}
              className="px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              Reservasi Fasilitas Ini
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h2 className="text-base font-semibold font-heading text-ink mb-4">
                Informasi Fasilitas
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                    Tipe
                  </dt>
                  <dd className="text-sm font-medium text-ink mt-0.5">
                    {facilityTypeLabel(facility.type)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                    Lokasi
                  </dt>
                  <dd className="text-sm font-medium text-ink mt-0.5 flex items-center gap-1.5">
                    <svg className="w-4 h-4 flex-shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {facility.location}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-muted uppercase tracking-wide">
                    Kapasitas
                  </dt>
                  <dd className="text-sm font-medium text-ink mt-0.5 flex items-center gap-1.5">
                    <svg className="w-4 h-4 flex-shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {facility.capacity} orang
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-ink-muted uppercase tracking-wide">
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
                  <p className="text-sm text-gray-700 leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                    {facility.description}
                  </p>
                </div>
              )}
            </Card>

            {/* Info box — berubah berdasarkan status login */}
            {isAuthenticated ? (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <h3 className="text-sm font-semibold text-green-800 mb-2">
                  Anda sudah login
                </h3>
                <p className="text-sm text-green-700 mb-3">
                  Ajukan reservasi untuk fasilitas ini melalui dashboard Anda.
                </p>
                <Link
                  href={`/dashboard/reservations/new?facilityId=${facility.id}`}
                  className="inline-block px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Ajukan Reservasi
                </Link>
              </div>
            ) : (
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
            )}
          </div>

          {/* Right: Schedule */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-base font-semibold text-gray-900">
                  Jadwal Ketersediaan
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
