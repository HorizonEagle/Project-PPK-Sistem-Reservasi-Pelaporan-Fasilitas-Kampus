'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { SlotAvailability } from '@/types';
import { facilitiesApi } from '@/lib/api';
import { Spinner } from '@/components/ui';

// ─── LiveClockBanner ──────────────────────────────────────────────────────────

export function LiveClockBanner() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Earliest bookable slot = now + 12 hours
  const earliest = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const earliestStr = earliest.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const earliestDate = earliest.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1E2566 0%, #343FA0 60%, #5C6AE4 100%)',
        borderRadius: '14px',
        padding: '1px',
        marginBottom: '1.25rem',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #f5f4ff 0%, #eef0fd 100%)',
          borderRadius: '13px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {/* Left: Date + Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Clock icon */}
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4350C0, #5C6AE4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(67,80,192,0.35)',
            }}
          >
            <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
            </svg>
          </div>

          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: '#5C6AE4', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
              Waktu Saat Ini
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading, sans-serif)',
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  color: '#1E2566',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {timeStr}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#716F6B', fontWeight: 500 }}>WIB</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#716F6B', marginTop: '2px' }}>{dateStr}</p>
          </div>
        </div>

        {/* Right: Earliest bookable */}
        <div
          style={{
            background: 'rgba(255,255,255,0.75)',
            border: '1px solid #C3C9F5',
            borderRadius: '10px',
            padding: '0.6rem 0.9rem',
            textAlign: 'right',
          }}
        >
          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#5C6AE4', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
            Batas Pesan Minimal
          </p>
          <p style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E2566', letterSpacing: '-0.01em' }}>
            {earliestStr} · {earliestDate}
          </p>
          <p style={{ fontSize: '0.65rem', color: '#716F6B', marginTop: '2px' }}>
            Slot di bawah jam ini tidak bisa dipesan
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── SlotGrid — Komponen grid slot waktu 30 menit dengan Auto-Fill Rentang ───

// ─── Helper: time string "HH:MM" to total minutes since midnight ─────────────
function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}

interface SlotGridProps {
  facilityId: string;
  selectedDate: string; // "YYYY-MM-DD"
  onSlotSelect?: (startTime: string, endTime: string) => void;
  selectable?: boolean;
  selectedStart?: string;
  selectedEnd?: string;
}

export function SlotGrid({
  facilityId,
  selectedDate,
  onSlotSelect,
  selectable = false,
  selectedStart,
  selectedEnd,
}: SlotGridProps) {
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [rangeNotice, setRangeNotice] = useState('');
  const [hoveredEndTime, setHoveredEndTime] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Live clock — update every minute (slots have 30-min granularity)
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!facilityId || !selectedDate) return;

    setIsLoading(true);
    setError('');
    setRangeNotice('');

    facilitiesApi
      .getSchedule(facilityId, selectedDate)
      .then((res) => {
        setSlots(res.data);
      })
      .catch((err) => {
        setError(err.message || 'Gagal memuat jadwal');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [facilityId, selectedDate]);

  // ─── Determine which slots are blocked by time rules ──────────────────────
  // A slot is "time-blocked" when:
  //   a) The selected date is today AND the slot's start time has passed
  //   b) The slot's start time < (now + 12 hours)  on the same calendar day
  //      OR the slot's start time < (now + 12 hours) across midnight for tomorrow
  const isSlotTimeBlocked = (slot: SlotAvailability): boolean => {
    if (!selectedDate) return false;

    // Build a Date object for slot start on the selected date
    const slotStart = new Date(`${selectedDate}T${slot.startTime}:00`);
    // Earliest allowed booking = now + 12h
    const earliest = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    return slotStart < earliest;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 text-sm font-medium">{error}</div>
    );
  }

  if (!slots.length) {
    return (
      <div className="text-center py-8 text-ink-muted text-sm">
        Tidak ada slot tersedia
      </div>
    );
  }

  // Cek apakah slot berada dalam range seleksi
  const isSlotSelected = (slot: SlotAvailability): boolean => {
    if (!selectedStart || !selectedEnd) return false;
    return slot.startTime >= selectedStart && slot.endTime <= selectedEnd;
  };

  // Cek apakah slot berada dalam preview hover rentang
  const isSlotHovered = (slot: SlotAvailability): boolean => {
    if (!selectable || !selectedStart || !hoveredEndTime) return false;
    if (isSlotSelected(slot)) return false;
    if (hoveredEndTime > selectedStart) {
      return slot.startTime >= selectedStart && slot.endTime <= hoveredEndTime;
    }
    return false;
  };

  // Hitung jumlah slot yang sedang terpilih
  const selectedSlotsCount = selectedStart && selectedEnd
    ? slots.filter((s) => s.startTime >= selectedStart && s.endTime <= selectedEnd).length
    : 0;

  // ─── Handler Pemilihan Otomatis Rentang Waktu ─────────────────────────────
  const handleSlotClick = (clickedSlot: SlotAvailability) => {
    if (!selectable || clickedSlot.status !== 'available' || !onSlotSelect) return;
    if (isSlotTimeBlocked(clickedSlot)) return; // block past / < 12h slots
    setRangeNotice('');

    // Kasus 1: Belum ada slot terpilih -> jadikan sebagai jam mulai
    if (!selectedStart || !selectedEnd) {
      onSlotSelect(clickedSlot.startTime, clickedSlot.endTime);
      return;
    }

    // Kasus 2: Klik slot yang sama persis saat hanya 1 slot terpilih -> batalkan / reset
    if (selectedStart === clickedSlot.startTime && selectedEnd === clickedSlot.endTime) {
      onSlotSelect('', '');
      return;
    }

    const isAlreadyRange = selectedSlotsCount > 1;

    // Kasus 3: Jika sudah terbentuk rentang multi-slot sebelumnya
    if (isAlreadyRange) {
      // 3a. Klik slot persis setelah rentang -> perpanjang 1 slot
      if (clickedSlot.startTime === selectedEnd) {
        onSlotSelect(selectedStart, clickedSlot.endTime);
        return;
      }

      // 3b. Klik slot persis sebelum rentang -> majukan jam mulai 1 slot
      if (clickedSlot.endTime === selectedStart) {
        onSlotSelect(clickedSlot.startTime, selectedEnd);
        return;
      }

      // 3c. Klik slot akhir rentang -> perpendek 1 slot
      if (clickedSlot.endTime === selectedEnd) {
        const priorSlots = slots.filter(
          (s) => s.startTime >= selectedStart && s.endTime < selectedEnd && s.status === 'available'
        );
        if (priorSlots.length > 0) {
          const lastPrior = priorSlots[priorSlots.length - 1];
          onSlotSelect(selectedStart, lastPrior.endTime);
          return;
        }
      }

      // 3d. Klik slot awal rentang -> jadikan hanya slot awal yang terpilih
      if (clickedSlot.startTime === selectedStart) {
        onSlotSelect(clickedSlot.startTime, clickedSlot.endTime);
        return;
      }

      // 3e. Klik di dalam rentang -> sesuaikan rentang agar berakhir di slot ini
      if (clickedSlot.startTime > selectedStart && clickedSlot.endTime < selectedEnd) {
        onSlotSelect(selectedStart, clickedSlot.endTime);
        return;
      }

      // 3f. Klik di luar rentang yang tidak bersebelahan -> mulai pilihan rentang baru secara mulus
      onSlotSelect(clickedSlot.startTime, clickedSlot.endTime);
      return;
    }

    // Kasus 4: Baru 1 slot terpilih, sekarang memilih jam akhir rentang (ke depan)
    // Contoh: Mulai jam 07:00, klik jam 08:30–09:00 -> 07:30 hingga 08:30 langsung otomatis terisi
    if (clickedSlot.startTime >= selectedStart) {
      // Ambil seluruh slot dari selectedStart hingga clickedSlot.endTime
      const rangeSlots = slots.filter(
        (s) => s.startTime >= selectedStart && s.endTime <= clickedSlot.endTime
      );

      // Pastikan tidak ada slot yang terpesan / dalam perbaikan di tengah rentang
      const blockedSlot = rangeSlots.find((s) => s.status !== 'available');
      if (blockedSlot) {
        setRangeNotice(
          `Slot ${blockedSlot.startTime}–${blockedSlot.endTime} tidak tersedia, sehingga rentang terputus. Memulai pilihan baru dari ${clickedSlot.startTime}.`
        );
        onSlotSelect(clickedSlot.startTime, clickedSlot.endTime);
        return;
      }

      // Otomatis isi seluruh rentang waktu sekaligus!
      onSlotSelect(selectedStart, clickedSlot.endTime);
      return;
    }

    // Kasus 5: Baru 1 slot terpilih, sekarang memilih jam awal rentang (ke belakang)
    // Contoh: Sudah klik 09:00, lalu klik 07:00 -> otomatis rentang 07:00 sampai 09:30/end
    if (clickedSlot.endTime <= selectedStart) {
      const rangeSlots = slots.filter(
        (s) => s.startTime >= clickedSlot.startTime && s.endTime <= selectedEnd
      );

      const blockedSlot = rangeSlots.find((s) => s.status !== 'available');
      if (blockedSlot) {
        setRangeNotice(
          `Slot ${blockedSlot.startTime}–${blockedSlot.endTime} tidak tersedia, sehingga rentang terputus. Memulai pilihan baru dari ${clickedSlot.startTime}.`
        );
        onSlotSelect(clickedSlot.startTime, clickedSlot.endTime);
        return;
      }

      onSlotSelect(clickedSlot.startTime, selectedEnd);
      return;
    }

    // Fallback
    onSlotSelect(clickedSlot.startTime, clickedSlot.endTime);
  };

  const hasSelection = Boolean(selectedStart && selectedEnd);

  return (
    <div>
      {/* Legend & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-100 border border-emerald-300" />
            <span className="text-ink-soft">Tersedia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm bg-gray-100 border border-gray-300 opacity-60" />
            <span className="text-ink-soft line-through">Lewat / &lt;12 jam</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm bg-red-100 border border-red-300" />
            <span className="text-ink-soft">Terpesan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm bg-amber-100 border border-amber-300" />
            <span className="text-ink-soft">Dalam Perbaikan</span>
          </div>
          {selectable && (
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-sm bg-primary-600 border border-primary-700" />
              <span className="text-ink-soft">Terpilih ({selectedSlotsCount} slot)</span>
            </div>
          )}
        </div>

        {selectable && hasSelection && onSlotSelect && (
          <button
            type="button"
            onClick={() => {
              onSlotSelect('', '');
              setRangeNotice('');
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center gap-1"
          >
            Reset Pilihan
          </button>
        )}
      </div>

      {/* Notice jika rentang terputus */}
      {rangeNotice && (
        <div className="mb-3 p-2.5 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{rangeNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setRangeNotice('')}
            className="text-amber-900 font-bold ml-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2"
        onMouseLeave={() => setHoveredEndTime(null)}
      >
        {slots.map((slot) => {
          const selected = isSlotSelected(slot);
          const hovered = isSlotHovered(slot);
          const isAvailable = slot.status === 'available';
          const isBooked = slot.status === 'booked';
          const isMaintenance = slot.status === 'maintenance';
          const isTimeBlocked = isSlotTimeBlocked(slot);

          const isStartSlot = selected && selectedStart === slot.startTime;
          const isEndSlot = selected && selectedEnd === slot.endTime;
          const isIntermediate = selected && !isStartSlot && !isEndSlot;

          let bgClass = '';
          let textClass = '';
          let hoverClass = '';
          let cursorClass = 'cursor-default';

          if (isTimeBlocked) {
            // Past / < 12h ahead — cannot be booked
            bgClass = 'bg-gray-100 border-gray-200 opacity-50';
            textClass = 'text-gray-400 line-through';
            cursorClass = 'cursor-not-allowed';
          } else if (selected) {
            bgClass = 'bg-primary-600 border-primary-700 shadow-sm';
            textClass = 'text-white font-semibold';
            if (selectable) {
              cursorClass = 'cursor-pointer hover:bg-primary-700';
            }
          } else if (hovered && isAvailable) {
            bgClass = 'bg-primary-100 border-primary-300 ring-2 ring-primary-300/50';
            textClass = 'text-primary-800 font-semibold';
            cursorClass = 'cursor-pointer';
          } else if (isAvailable) {
            bgClass = 'bg-emerald-50 border-emerald-200';
            textClass = 'text-emerald-800';
            if (selectable) {
              hoverClass = 'hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-xs active:scale-[0.98]';
              cursorClass = 'cursor-pointer';
            }
          } else if (isBooked) {
            bgClass = 'bg-red-50/70 border-red-200';
            textClass = 'text-red-400';
          } else if (isMaintenance) {
            bgClass = 'bg-amber-50 border-amber-200';
            textClass = 'text-amber-600';
          }

          return (
            <button
              key={slot.startTime}
              type="button"
              disabled={!selectable || !isAvailable || isTimeBlocked}
              onClick={() => handleSlotClick(slot)}
              onMouseEnter={() => {
                if (selectable && hasSelection && isAvailable && !isTimeBlocked && selectedSlotsCount <= 1) {
                  setHoveredEndTime(slot.endTime);
                }
              }}
              className={`
                px-2.5 py-2.5 rounded-md border text-xs text-center transition-all duration-150 relative
                ${bgClass} ${textClass} ${hoverClass} ${cursorClass}
                disabled:cursor-not-allowed
              `}
              title={
                isTimeBlocked
                  ? `Tidak bisa dipesan — terlalu dekat dengan waktu saat ini (min. 12 jam sebelumnya)`
                  : selected
                  ? `Terpilih: ${slot.startTime} - ${slot.endTime}`
                  : isAvailable && selectable && hasSelection
                  ? `Klik untuk memilih rentang hingga ${slot.endTime}`
                  : isAvailable
                  ? `Klik untuk mulai reservasi dari ${slot.startTime}`
                  : `Slot tidak tersedia (${slot.status})`
              }
            >
              <div className="font-semibold text-xs tracking-tight">
                {slot.startTime} – {slot.endTime}
              </div>
              <div className="mt-0.5 text-[10px] opacity-90 font-medium truncate">
                {isTimeBlocked ? (
                  'Tidak Dapat Dipesan'
                ) : selected ? (
                  isStartSlot && isEndSlot ? (
                    'Dipilih'
                  ) : isStartSlot ? (
                    `Mulai: ${slot.startTime}`
                  ) : isEndSlot ? (
                    `Selesai: ${slot.endTime}`
                  ) : (
                    'Otomatis Terisi'
                  )
                ) : hovered ? (
                  slot.endTime === hoveredEndTime ? (
                    `+ Hingga ${slot.endTime}`
                  ) : (
                    '+ Rentang'
                  )
                ) : isAvailable ? (
                  'Tersedia'
                ) : isBooked ? (
                  'Terpesan'
                ) : (
                  'Perbaikan'
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── DatePicker — Date selector with live date display ────────────────────────

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
}

export function DatePicker({ value, onChange, minDate }: DatePickerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayStr = now.toISOString().split('T')[0];
  const isToday = value === todayStr;

  // Days from today to selected date
  const daysAhead = value
    ? Math.round(
        (new Date(value + 'T00:00:00').getTime() - new Date(todayStr + 'T00:00:00').getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const dayLabel =
    daysAhead === 0
      ? 'Hari ini'
      : daysAhead === 1
      ? 'Besok'
      : daysAhead > 1
      ? `${daysAhead} hari lagi`
      : null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <label className="text-xs font-semibold text-ink">Tanggal:</label>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value}
          min={minDate ?? todayStr}
          onChange={(e) => onChange(e.target.value)}
          className="px-3.5 py-2 rounded-md border border-line bg-surface text-ink text-sm
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            transition-colors"
        />
        {dayLabel && (
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              background: isToday ? '#EEF0FD' : '#ECFDF5',
              color: isToday ? '#4350C0' : '#065F46',
              border: `1px solid ${isToday ? '#C3C9F5' : '#A7F3D0'}`,
            }}
          >
            {dayLabel}
          </span>
        )}
      </div>
      {isToday && (
        <p style={{ fontSize: '0.67rem', color: '#716F6B', marginTop: '2px' }}>
          Pemesanan hari ini hanya tersedia untuk slot 12 jam ke depan
        </p>
      )}
    </div>
  );
}
