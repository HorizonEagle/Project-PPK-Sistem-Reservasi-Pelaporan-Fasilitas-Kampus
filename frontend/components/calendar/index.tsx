'use client';

import React, { useState, useEffect } from 'react';
import type { SlotAvailability } from '@/types';
import { facilitiesApi } from '@/lib/api';
import { Spinner } from '@/components/ui';

// ─── SlotGrid — Komponen grid slot waktu 30 menit ────────────────────────────

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

  useEffect(() => {
    if (!facilityId || !selectedDate) return;

    setIsLoading(true);
    setError('');

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 text-sm">{error}</div>
    );
  }

  if (!slots.length) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Tidak ada slot tersedia
      </div>
    );
  }

  // Cek apakah slot berada dalam range seleksi
  const isSlotSelected = (slot: SlotAvailability): boolean => {
    if (!selectedStart || !selectedEnd) return false;
    return slot.startTime >= selectedStart && slot.endTime <= selectedEnd;
  };

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
          <span className="text-gray-600">Tersedia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
          <span className="text-gray-600">Terpesan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
          <span className="text-gray-600">Dalam Perbaikan</span>
        </div>
        {selectable && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-blue-500 border border-blue-600" />
            <span className="text-gray-600">Dipilih</span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {slots.map((slot) => {
          const selected = isSlotSelected(slot);
          const isAvailable = slot.status === 'available';
          const isBooked = slot.status === 'booked';
          const isMaintenance = slot.status === 'maintenance';

          let bgClass = '';
          let textClass = '';
          let hoverClass = '';
          let cursorClass = 'cursor-default';

          if (selected) {
            bgClass = 'bg-blue-500 border-blue-600';
            textClass = 'text-white font-semibold';
          } else if (isAvailable) {
            bgClass = 'bg-emerald-50 border-emerald-200';
            textClass = 'text-emerald-800';
            if (selectable) {
              hoverClass = 'hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-sm';
              cursorClass = 'cursor-pointer';
            }
          } else if (isBooked) {
            bgClass = 'bg-red-50 border-red-200';
            textClass = 'text-red-400';
          } else if (isMaintenance) {
            bgClass = 'bg-amber-50 border-amber-200';
            textClass = 'text-amber-500';
          }

          return (
            <button
              key={slot.startTime}
              type="button"
              disabled={!selectable || !isAvailable}
              onClick={() => {
                if (selectable && isAvailable && onSlotSelect) {
                  onSlotSelect(slot.startTime, slot.endTime);
                }
              }}
              className={`
                px-2 py-2.5 rounded-lg border text-xs text-center transition-all duration-150
                ${bgClass} ${textClass} ${hoverClass} ${cursorClass}
                disabled:opacity-60 disabled:cursor-not-allowed
              `}
            >
              <div className="font-medium">
                {slot.startTime} – {slot.endTime}
              </div>
              <div className="mt-0.5 text-[10px] opacity-75">
                {selected
                  ? 'Dipilih'
                  : isAvailable
                  ? 'Tersedia'
                  : isBooked
                  ? 'Terpesan'
                  : 'Perbaikan'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── DatePicker — Simple date selector ────────────────────────────────────────

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
}

export function DatePicker({ value, onChange, minDate }: DatePickerProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700">Tanggal:</label>
      <input
        type="date"
        value={value}
        min={minDate}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors"
      />
    </div>
  );
}
