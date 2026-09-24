'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { facilitiesApi, reservationsApi } from '@/lib/api';
import { SlotGrid, DatePicker } from '@/components/calendar';
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

  // ─── Slot selection handler ───────────────────────────────────────────────────

  const handleSlotSelect = useCallback(
    (slotStart: string, slotEnd: string) => {
      if (!startTime || !endTime) {
        // Pertama kali pilih slot
        setStartTime(slotStart);
        setEndTime(slotEnd);
        return;
      }

      const slotStartMin = timeToMinutes(slotStart);
      const currentStartMin = timeToMinutes(startTime);
      const currentEndMin = timeToMinutes(endTime);

      // Jika klik slot yang sama → toggle off
      if (slotStart === startTime && slotEnd === endTime) {
        setStartTime('');
        setEndTime('');
        return;
      }

      // Jika slot bersebelahan di akhir → extend
      if (slotStartMin === currentEndMin) {
        setEndTime(slotEnd);
        return;
      }

      // Jika slot bersebelahan di awal → extend ke awal
      if (timeToMinutes(slotEnd) === currentStartMin) {
        setStartTime(slotStart);
        return;
      }

      // Jika slot di dalam range → shrink
      if (slotStartMin >= currentStartMin && slotStartMin < currentEndMin) {
        // Klik di dalam → reset ke slot ini saja
        setStartTime(slotStart);
        setEndTime(slotEnd);
        return;
      }

      // Jika slot baru di luar range, mulai seleksi baru
      setStartTime(slotStart);
      setEndTime(slotEnd);
    },
    [startTime, endTime]
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
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          📍 Pilih Fasilitas
        </h3>

        {facilities.length === 0 ? (
          <Alert type="warning">
            Tidak ada fasilitas aktif yang tersedia saat ini.
          </Alert>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {facilities.map((fac) => {
              const isSelected = facilityId === fac.id;
              const typeIcons: Record<string, string> = {
                classroom: '🏫',
                auditorium: '🎭',
                laboratory: '🔬',
                equipment: '🔧',
                field: '⚽',
              };

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
                    text-left p-3 rounded-lg border-2 transition-all duration-200
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{typeIcons[fac.type] || '🏛️'}</span>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? 'text-blue-800' : 'text-gray-900'
                      }`}
                    >
                      {fac.name}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>📍 {fac.location}</div>
                    <div className="flex items-center gap-3">
                      <span>👥 {fac.capacity} orang</span>
                      <span className="text-gray-400">·</span>
                      <span>{facilityTypeLabel(fac.type)}</span>
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
            <h3 className="text-base font-semibold text-gray-900">
              📅 Pilih Tanggal & Slot Waktu
            </h3>
            <DatePicker value={date} onChange={(d) => {
              setDate(d);
              setStartTime('');
              setEndTime('');
            }} minDate={today} />
          </div>

          {/* Selected facility info */}
          {selectedFacility && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
              <span className="font-medium text-blue-800">
                {selectedFacility.name}
              </span>
              <span className="text-blue-600 ml-2">
                — {selectedFacility.location}
              </span>
            </div>
          )}

          {/* Instruction */}
          <Alert type="info">
            Klik slot yang tersedia (hijau) untuk memilih waktu. Klik slot
            bersebelahan untuk memperpanjang durasi.
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
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-600 font-medium">✅ Waktu dipilih:</span>
                <span className="font-semibold text-green-800">
                  {startTime} – {endTime}
                </span>
                <span className="text-green-600">
                  ({slotCount} slot · {durationStr})
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Step 3: Tujuan Penggunaan */}
      {facilityId && startTime && endTime && (
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            📝 Tujuan Penggunaan
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
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            📋 Ringkasan Reservasi
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
              📤 Ajukan Reservasi
            </Button>
          </div>
        </Card>
      )}
    </form>
  );
}
