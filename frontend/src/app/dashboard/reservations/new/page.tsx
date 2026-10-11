'use client';

import { Suspense } from 'react';
import ReservationForm from '@/components/forms/ReservationForm';
import { Spinner } from '@/components/ui';

export default function NewReservationPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-ink">Ajukan Reservasi Baru</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Pilih fasilitas, tanggal, slot waktu, dan jelaskan tujuan penggunaan.
        </p>
      </div>

      {/* Form */}
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        }
      >
        <ReservationForm />
      </Suspense>
    </div>
  );
}
