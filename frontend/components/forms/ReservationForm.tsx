'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  facilitiesApi,
  reservationsApi,
  ConnectionError,
  ApiRequestError,
} from '@/lib/api';
import { SlotGrid, DatePicker, LiveClockBanner } from '@/components/calendar';
import { Card, Button, Alert, Textarea, Spinner, Modal } from '@/components/ui';
import {
  facilityTypeLabel,
  getFacilityImageUrl,
  handleFacilityImageError,
} from '@/lib/utils';
import type { Facility, PaginatedResponse } from '@/types';

// ─── Slot Selection Logic ─────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// ─── ReservationForm Component ────────────────────────────────────────────────

interface ReservationFormProps {
  preselectedFacilityId?: string;
}

export default function ReservationForm({ preselectedFacilityId }: ReservationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryFacilityId = searchParams?.get('facilityId') || '';
  const initialFacilityId = preselectedFacilityId || queryFacilityId || '';

  // Form state
  const [facilityId, setFacilityId] = useState(initialFacilityId);
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

  // Error popup modal state (menampilkan error API dan koneksi sebagai popup)
  const [errorPopup, setErrorPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isConnectionError: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    isConnectionError: false,
  });

  // Today string for min date (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  // Helper untuk memunculkan popup modal error
  const triggerErrorPopup = useCallback(
    (title: string, message: string, isConnection = false) => {
      setError(message);
      setErrorPopup({
        isOpen: true,
        title,
        message,
        isConnectionError: isConnection,
      });
    },
    []
  );

  // ─── Load facilities ─────────────────────────────────────────────────────────

  useEffect(() => {
    setFacilitiesLoading(true);
    facilitiesApi
      .list({ limit: '100' })
      .then((res: PaginatedResponse<Facility>) => {
        setFacilities(res.data.filter((f) => f.status === 'active'));
      })
      .catch((err) => {
        const isConn =
          err instanceof ConnectionError ||
          (err instanceof Error &&
            (err.name === 'ConnectionError' ||
              err.message.toLowerCase().includes('terhubung') ||
              err.message.toLowerCase().includes('koneksi') ||
              err.message.toLowerCase().includes('failed to fetch') ||
              err.message.toLowerCase().includes('network')));
        const msg =
          err instanceof Error
            ? err.message
            : 'Gagal memuat daftar fasilitas dari server.';
        const title = isConn
          ? 'Gangguan Koneksi Jaringan'
          : 'Error API: Gagal Memuat Fasilitas';
        triggerErrorPopup(title, msg, isConn);
      })
      .finally(() => {
        setFacilitiesLoading(false);
      });
  }, [triggerErrorPopup]);

  // Set default date to today jika belum terisi
  useEffect(() => {
    if (!date) {
      setDate(today);
    }
  }, [date, today]);

  // Update facilityId jika query params atau props berubah
  useEffect(() => {
    if (initialFacilityId && !facilityId) {
      setFacilityId(initialFacilityId);
    }
  }, [initialFacilityId, facilityId]);

  // ─── Slot selection handler (Menerima rentang otomatis dari SlotGrid) ─────────

  const handleSlotSelect = useCallback(
    (slotStart: string, slotEnd: string) => {
      setStartTime(slotStart);
      setEndTime(slotEnd);
    },
    []
  );

  // ─── Validation Status ───────────────────────────────────────────────────────

  const isFacilityValid = Boolean(facilityId && facilityId.trim() !== '');
  const isDateValid = Boolean(date && date >= today);
  const isTimeValid =
    Boolean(startTime && endTime) &&
    timeToMinutes(startTime) < timeToMinutes(endTime);
  const isPurposeValid =
    purpose.trim().length >= 10 && purpose.length <= 500;

  // Form valid jika seluruh input valid
  const isFormValid =
    isFacilityValid && isDateValid && isTimeValid && isPurposeValid;

  // ─── Submit handler ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validasi menyeluruh di sisi client
    if (!facilityId) {
      triggerErrorPopup('Validasi Input', 'Silakan pilih fasilitas terlebih dahulu.');
      return;
    }
    if (!date || date < today) {
      triggerErrorPopup('Validasi Input', 'Silakan pilih tanggal reservasi yang valid.');
      return;
    }
    if (!startTime || !endTime || timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      triggerErrorPopup('Validasi Input', 'Silakan pilih rentang slot waktu pada grid jadwal.');
      return;
    }
    if (purpose.trim().length < 10) {
      triggerErrorPopup('Validasi Input', 'Deskripsi tujuan penggunaan minimal 10 karakter.');
      return;
    }
    if (purpose.length > 500) {
      triggerErrorPopup('Validasi Input', 'Deskripsi tidak bisa melewati 500 karakter.');
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

      // Redirect ke riwayat reservasi setelah 2 detik
      setTimeout(() => {
        router.push('/dashboard/reservations');
      }, 2000);
    } catch (err) {
      const isConn =
        err instanceof ConnectionError ||
        (err instanceof Error &&
          (err.name === 'ConnectionError' ||
            err.message.toLowerCase().includes('terhubung') ||
            err.message.toLowerCase().includes('koneksi') ||
            err.message.toLowerCase().includes('failed to fetch') ||
            err.message.toLowerCase().includes('network')));

      const errorTitle = isConn
        ? 'Gangguan Koneksi Jaringan'
        : 'Gagal Mengajukan Reservasi (Error API)';
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengajukan reservasi ke server.';

      // Memunculkan error API dan koneksi sebagai POPUP modal
      triggerErrorPopup(errorTitle, errorMsg, isConn);
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
              1. Pilih Fasilitas
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
                  {/* Horizontal Image Banner */}
                  <div className="relative w-full aspect-[16/9] overflow-hidden bg-canvas">
                    <img
                      src={getFacilityImageUrl(fac)}
                      alt={fac.name}
                      onError={(e) => handleFacilityImageError(e, fac.type)}
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
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold font-heading text-ink">
              2. Pilih Tanggal & Slot Waktu
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Pilih tanggal pelaksanaan dan tentukan rentang jam penggunaan.
            </p>
          </div>
          <DatePicker
            value={date}
            onChange={(d) => {
              setDate(d);
              setStartTime('');
              setEndTime('');
            }}
            minDate={today}
          />
        </div>

        {!facilityId ? (
          <div className="p-8 text-center bg-canvas rounded-xl border border-dashed border-line">
            <svg className="w-10 h-10 text-ink-muted mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-semibold text-ink">Fasilitas Belum Dipilih</p>
            <p className="text-xs text-ink-soft mt-1">
              Silakan pilih salah satu fasilitas pada Langkah 1 di atas untuk memuat jadwal dan slot waktu yang tersedia.
            </p>
          </div>
        ) : (
          <>
            {/* Selected facility info banner */}
            {selectedFacility && (
              <div className="mb-4 p-3 bg-primary-50/80 rounded-xl border border-primary-200/80 text-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getFacilityImageUrl(selectedFacility)}
                    alt={selectedFacility.name}
                    onError={(e) => handleFacilityImageError(e, selectedFacility.type)}
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
                onError={(err) => {
                  const isConn =
                    err instanceof ConnectionError ||
                    err.message.toLowerCase().includes('terhubung') ||
                    err.message.toLowerCase().includes('koneksi') ||
                    err.message.toLowerCase().includes('network');
                  triggerErrorPopup(
                    isConn ? 'Gangguan Koneksi Jaringan' : 'Error API Jadwal',
                    err.message,
                    isConn
                  );
                }}
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
          </>
        )}
      </Card>

      {/* Step 3: Deskripsi / Tujuan Penggunaan (Maksimal 500 Karakter) */}
      <Card>
        <div className="mb-4">
          <h3 className="text-base font-semibold font-heading text-ink">
            3. Deskripsi / Tujuan Penggunaan
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Jelaskan rincian agenda dan alasan peminjaman fasilitas secara jelas (antara 10 hingga 500 karakter).
          </p>
        </div>

        <Textarea
          label="Deskripsi / Tujuan Penggunaan"
          value={purpose}
          onChange={(e) => {
            // Deskripsi tidak bisa melewati 500 karakter
            const val = e.target.value.slice(0, 500);
            setPurpose(val);
          }}
          maxLength={500}
          rows={4}
          placeholder="Jelaskan deskripsi dan tujuan penggunaan fasilitas ini (minimal 10 karakter, maksimal 500 karakter). Contoh: Pelaksanaan sesi praktikum mandiri kelompok Rekayasa Perangkat Lunak dan presentasi tugas akhir modul."
          required
          id="reservation-purpose"
          name="purpose"
          helperText={`${purpose.length}/500 karakter ${purpose.trim().length < 10 ? '(min. 10 karakter)' : ''}`}
          error={
            purpose.length > 500
              ? 'Deskripsi tidak boleh melebihi 500 karakter'
              : purpose.length > 0 && purpose.trim().length < 10
              ? 'Deskripsi minimal 10 karakter'
              : undefined
          }
        />
      </Card>

      {/* Step 4: Ringkasan Reservasi & Tombol Reservasi (Nonaktif jika input tidak valid) */}
      <Card className="bg-gradient-to-r from-primary-50/60 to-surface border-primary-200/80">
        <h3 className="text-base font-semibold font-heading text-ink mb-3">
          Ringkasan Reservasi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
          <div className="p-2.5 rounded-lg bg-surface/80 border border-line/60">
            <span className="text-xs text-ink-muted block">Fasilitas:</span>
            <p className="font-semibold text-ink mt-0.5">
              {selectedFacility ? selectedFacility.name : '(Belum dipilih)'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface/80 border border-line/60">
            <span className="text-xs text-ink-muted block">Tanggal:</span>
            <p className="font-semibold text-ink mt-0.5">
              {date
                ? new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '(Belum dipilih)'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface/80 border border-line/60">
            <span className="text-xs text-ink-muted block">Waktu:</span>
            <p className="font-semibold text-ink mt-0.5">
              {startTime && endTime
                ? `${startTime} – ${endTime} (${durationStr})`
                : '(Belum dipilih)'}
            </p>
          </div>
          <div className="p-2.5 rounded-lg bg-surface/80 border border-line/60">
            <span className="text-xs text-ink-muted block">Lokasi:</span>
            <p className="font-semibold text-ink mt-0.5">
              {selectedFacility ? selectedFacility.location : '-'}
            </p>
          </div>
        </div>

        {/* Status Indikator Validitas Form */}
        {!isFormValid && (
          <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-amber-950">Lengkapi data untuk mengaktifkan tombol reservasi:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
                {!isFacilityValid && <li>Pilih salah satu fasilitas pada Langkah 1</li>}
                {!isDateValid && <li>Pilih tanggal reservasi yang valid (mulai hari ini)</li>}
                {!isTimeValid && <li>Pilih rentang slot waktu pada jadwal Langkah 2</li>}
                {purpose.trim().length < 10 && (
                  <li>
                    Tulis deskripsi tujuan penggunaan minimal 10 karakter (saat ini:{' '}
                    {purpose.trim().length}/10 karakter)
                  </li>
                )}
                {purpose.length > 500 && (
                  <li>Deskripsi melebihi batas 500 karakter ({purpose.length}/500)</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-primary-200">
          <div className="text-xs text-ink-muted">
            {isFormValid ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Seluruh data valid. Siap mengajukan reservasi.
              </span>
            ) : (
              <span>Tombol reservasi nonaktif sampai seluruh input valid.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              id="submit-reservation-btn"
              isLoading={isSubmitting}
              disabled={!isFormValid || isSubmitting}
              className="px-6"
            >
              Ajukan Reservasi
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Popup Modal untuk Error API & Koneksi ────────────────────────────── */}
      <Modal
        isOpen={errorPopup.isOpen}
        onClose={() => setErrorPopup((prev) => ({ ...prev, isOpen: false }))}
        title={errorPopup.title || 'Pemberitahuan Error'}
      >
        <div className="space-y-4" data-testid="error-popup-modal" id="error-popup-modal">
          <div className="flex items-start gap-3.5 p-4 bg-red-50/90 rounded-xl border border-red-200/90 text-red-950">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600 shadow-xs">
              {errorPopup.isConnectionError ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-5.657-2.828m0 0l2.829-2.829M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-red-900 font-heading">
                {errorPopup.isConnectionError
                  ? 'Koneksi ke Server Terputus'
                  : 'Gagal Memproses Permintaan API'}
              </h4>
              <p
                className="text-xs text-red-800 mt-1 leading-relaxed break-words font-medium"
                id="error-popup-message"
              >
                {errorPopup.message}
              </p>
            </div>
          </div>

          {errorPopup.isConnectionError ? (
            <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
              <strong>Solusi Koneksi:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
                <li>Periksa koneksi internet perangkat Anda.</li>
                <li>Pastikan server backend sedang berjalan dan dapat diakses di port 3001.</li>
                <li>Jika masalah berlanjut, hubungi administrator kampus.</li>
              </ul>
            </div>
          ) : (
            <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
              <strong>Pemberitahuan Sistem:</strong>
              <p className="mt-0.5 text-blue-800">
                Silakan periksa kembali data formulir yang Anda masukkan atau coba beberapa saat lagi.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button
              type="button"
              variant="primary"
              id="close-error-modal-btn"
              onClick={() => setErrorPopup((prev) => ({ ...prev, isOpen: false }))}
            >
              Tutup Popup
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
