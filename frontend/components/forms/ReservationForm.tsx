'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { facilitiesApi, reservationsApi } from '@/lib/api';
import { SlotGrid, DatePicker, LiveClockBanner } from '@/components/calendar';
import { Card, Button, Alert, Textarea, Spinner } from '@/components/ui';
import { facilityTypeLabel } from '@/lib/utils';
import type { Facility, PaginatedResponse } from '@/types';

// ─── Slot Selection Logic ─────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

const facilityImages: Record<string, string> = {
  classroom: '/facilities/classroom.jpg',
  laboratory: '/facilities/laboratory.jpg',
  auditorium: '/facilities/auditorium.jpg',
  field: '/facilities/field.jpg',
  equipment: '/facilities/equipment.jpg',
};

function getFacilityImage(type: string): string {
  return facilityImages[type] || '/facilities/default.jpg';
}

// ─── ReservationForm Component ────────────────────────────────────────────────

interface ReservationFormProps {
  preselectedFacilityId?: string;
}

export default function ReservationForm({ preselectedFacilityId }: ReservationFormProps) {
  const router = useRouter();

  // Form state
  const [facilityId, setFacilityId] = useState(preselectedFacilityId || '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');

  // UI state
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilitiesLoading, setFacilitiesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Today string for min date
  const today = new Date().toISOString().split('T')[0];

  // ─── Load facilities ─────────────────────────────────────────────────────────

  useEffect(() => {
    setFacilitiesLoading(true);
    facilitiesApi
      .list({ limit: '100' })
      .then((res: PaginatedResponse<Facility>) => {
        // Hanya tampilkan fasilitas yang aktif
        setFacilities(res.data.filter((f) => f.status === 'active'));
      })
      .catch(() => {
        setError('Gagal memuat daftar fasilitas');
      })
      .finally(() => {
        setFacilitiesLoading(false);
      });
  }, []);

  // Set default date to today
  useEffect(() => {
    if (!date) {
      setDate(today);
    }
  }, [date, today]);

  // ─── Slot selection handler (Menerima rentang otomatis dari SlotGrid) ─────────

  const handleSlotSelect = useCallback(
    (slotStart: string, slotEnd: string) => {
      setStartTime(slotStart);
      setEndTime(slotEnd);
    },
    []
  );

  // ─── Submit handler ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!facilityId) {
      setError('Pilih fasilitas terlebih dahulu');
      return;
    }
    if (!date) {
      setError('Pilih tanggal reservasi');
      return;
    }
    if (!startTime || !endTime) {
      setError('Pilih slot waktu pada grid di bawah');
      return;
    }
    if (purpose.length < 10) {
      setError('Tujuan penggunaan minimal 10 karakter');
      return;
    }

    setIsSubmitting(true);

    try {
      await reservationsApi.create({
        facilityId,
        date,
        startTime,
        endTime,
        purpose,
      });

      setSuccess('Reservasi berhasil diajukan! Menunggu persetujuan petugas.');

      // Reset form
      setStartTime('');
      setEndTime('');
      setPurpose('');

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/reservations');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat reservasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Selected facility info ───────────────────────────────────────────────────

  const selectedFacility = facilities.find((f) => f.id === facilityId);

  // ─── Slot count info ──────────────────────────────────────────────────────────

  const slotCount =
    startTime && endTime
      ? (timeToMinutes(endTime) - timeToMinutes(startTime)) / 30
      : 0;

  const durationStr =
    startTime && endTime
      ? (() => {
          const totalMin = timeToMinutes(endTime) - timeToMinutes(startTime);
          const h = Math.floor(totalMin / 60);
          const m = totalMin % 60;
          return h > 0 ? `${h} jam${m > 0 ? ` ${m} menit` : ''}` : `${m} menit`;
        })()
      : '';

  if (facilitiesLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Messages */}
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Step 1: Pilih Fasilitas */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold font-heading text-ink">
              Pilih Fasilitas
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Pilih ruang kuliah, laboratorium, auditorium, atau fasilitas kampus yang ingin Anda gunakan.
            </p>
          </div>
          {facilityId && (
            <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
              1 Fasilitas Terpilih
            </span>
          )}
        </div>

        {facilities.length === 0 ? (
          <Alert type="warning">
            Tidak ada fasilitas aktif yang tersedia saat ini.
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {facilities.map((fac) => {
              const isSelected = facilityId === fac.id;

              return (
                <button
                  key={fac.id}
                  type="button"
                  onClick={() => {
                    setFacilityId(fac.id);
                    // Reset slot selection when switching facility
                    setStartTime('');
                    setEndTime('');
                  }}
                  className={`
                    group relative flex flex-col text-left rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer
                    ${
                      isSelected
                        ? 'border-primary-600 bg-surface shadow-card ring-2 ring-primary-500/25 -translate-y-0.5'
                        : 'border-line bg-surface hover:border-primary-400 hover:shadow-card hover:-translate-y-0.5'
                    }
                  `}
                >
                  {/* Horizontal Image Banner (Aspect 16:9, clean and not vertically stretched) */}
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-canvas">
                    <img
                      src={getFacilityImage(fac.type)}
                      alt={fac.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Type Badge on Top-Left */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface/90 text-ink backdrop-blur-xs shadow-xs border border-white/20">
                        {facilityTypeLabel(fac.type)}
                      </span>
                    </div>

                    {/* Selected Indicator Badge on Top-Right */}
                    {isSelected ? (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-primary-600 text-white shadow-sm border border-primary-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Terpilih
                        </span>
                      </div>
                    ) : (
                      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/60 text-white backdrop-blur-xs">
                          Pilih
                        </span>
                      </div>
                    )}

                    {/* Facility Name overlaid on gradient */}
                    <div className="absolute bottom-2.5 left-3 right-3">
                      <p className="text-sm font-bold font-heading text-white drop-shadow-sm truncate">
                        {fac.name}
                      </p>
                    </div>
                  </div>

                  {/* Details Info below the image */}
                  <div className="p-3 flex-1 flex flex-col justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-ink-soft">
                      <svg className="w-3.5 h-3.5 flex-shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{fac.location}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-line text-ink-muted text-[11px]">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Kapasitas {fac.capacity} orang
                      </span>
                      <span className={`font-semibold ${isSelected ? 'text-primary-600' : 'text-ink-soft'}`}>
                        {isSelected ? 'Dipilih' : 'Pilih'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {/* Step 2: Pilih Tanggal & Slot */}
      {facilityId && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-base font-semibold font-heading text-ink">
              Pilih Tanggal & Slot Waktu
            </h3>
            <DatePicker value={date} onChange={(d) => {
              setDate(d);
              setStartTime('');
              setEndTime('');
            }} minDate={today} />
          </div>

          {/* Selected facility info banner */}
          {selectedFacility && (
            <div className="mb-4 p-3 bg-primary-50/80 rounded-xl border border-primary-200/80 text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={getFacilityImage(selectedFacility.type)}
                  alt={selectedFacility.name}
                  className="w-14 h-10 rounded-lg object-cover border border-primary-200 flex-shrink-0"
                />
                <div className="min-w-0">
                  <span className="font-bold text-primary-950 font-heading truncate block">
                    {selectedFacility.name}
                  </span>
                  <div className="text-xs text-primary-700 flex items-center gap-1.5 mt-0.5">
                    <span className="truncate">{selectedFacility.location}</span>
                    <span>·</span>
                    <span>Kapasitas {selectedFacility.capacity} orang</span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-100 text-primary-800 border border-primary-200 flex-shrink-0">
                {facilityTypeLabel(selectedFacility.type)}
              </span>
            </div>
          )}

          {/* Live Clock */}
          <LiveClockBanner />

          {/* Instruction */}
          <Alert type="info">
            <strong>Pilihan Waktu Otomatis:</strong> Klik jam mulai (misal <strong>07:00</strong>), lalu klik jam selesai (misal <strong>08:30 – 09:00</strong>). Seluruh slot waktu di antaranya akan <strong>otomatis terisi</strong> tanpa perlu diklik satu per satu.
          </Alert>

          {/* Slot Grid */}
          <div className="mt-4">
            <SlotGrid
              facilityId={facilityId}
              selectedDate={date}
              selectable
              onSlotSelect={handleSlotSelect}
              selectedStart={startTime}
              selectedEnd={endTime}
            />
          </div>

          {/* Selection summary */}
          {startTime && endTime && (
            <div className="mt-4 p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 font-medium">Rentang Waktu Dipilih:</span>
                <span className="font-bold text-emerald-950 text-base">
                  {startTime} – {endTime}
                </span>
                <span className="text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
                  {slotCount} slot · {durationStr}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStartTime('');
                  setEndTime('');
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
              >
                Hapus Pilihan
              </button>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Tujuan Penggunaan */}
      {facilityId && startTime && endTime && (
        <Card>
          <h3 className="text-base font-semibold font-heading text-ink mb-4">
            Tujuan Penggunaan
          </h3>
          <Textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Jelaskan tujuan penggunaan fasilitas ini (minimal 10 karakter). Contoh: Presentasi tugas akhir kelompok mata kuliah Rekayasa Perangkat Lunak."
            required
            id="reservation-purpose"
            helperText={`${purpose.length}/500 karakter (min. 10)`}
            error={
              purpose.length > 0 && purpose.length < 10
                ? 'Minimal 10 karakter'
                : undefined
            }
          />
        </Card>
      )}

      {/* Summary & Submit */}
      {facilityId && startTime && endTime && (
        <Card className="bg-gradient-to-r from-primary-50/60 to-surface border-primary-200/80">
          <h3 className="text-base font-semibold font-heading text-ink mb-3">
            Ringkasan Reservasi
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <span className="text-gray-500">Fasilitas:</span>
              <p className="font-medium text-gray-900">
                {selectedFacility?.name}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Tanggal:</span>
              <p className="font-medium text-gray-900">
                {new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Waktu:</span>
              <p className="font-medium text-gray-900">
                {startTime} – {endTime} ({durationStr})
              </p>
            </div>
            <div>
              <span className="text-gray-500">Lokasi:</span>
              <p className="font-medium text-gray-900">
                {selectedFacility?.location}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-blue-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={
                !facilityId ||
                !date ||
                !startTime ||
                !endTime ||
                purpose.length < 10
              }
            >
              Ajukan Reservasi
            </Button>
          </div>
        </Card>
      )}
    </form>
  );
}
