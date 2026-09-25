'use client';

import ReservationForm from '@/components/forms/ReservationForm';

export default function NewReservationPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ajukan Reservasi Baru</h1>
        <p className="mt-1 text-sm text-gray-600">
          Pilih fasilitas, tanggal, slot waktu, dan jelaskan tujuan penggunaan.
        </p>
      </div>

      {/* Form */}
      <ReservationForm />
    </div>
  );
}
