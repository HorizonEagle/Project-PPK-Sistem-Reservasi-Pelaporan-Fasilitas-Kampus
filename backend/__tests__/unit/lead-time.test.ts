import { describe, it, expect } from 'vitest';
import { reservationStartMs, validateLeadTime, MIN_LEAD_HOURS } from '../../lib/slot-utils';

const HOUR = 60 * 60 * 1000;

describe('reservationStartMs', () => {
  it('interprets date and time as WIB (UTC+7)', () => {
    // 08:30 WIB = 01:30 UTC
    expect(reservationStartMs('2026-10-15', '08:30')).toBe(Date.UTC(2026, 9, 15, 1, 30));
  });

  it('returns NaN for an invalid date', () => {
    expect(reservationStartMs('bukan-tanggal', '08:30')).toBeNaN();
  });
});

describe('validateLeadTime', () => {
  const start = reservationStartMs('2026-10-15', '09:00');

  it('uses a 12 hour minimum lead time, matching the calendar UI', () => {
    expect(MIN_LEAD_HOURS).toBe(12);
  });

  it('accepts a reservation starting well in the future', () => {
    expect(validateLeadTime('2026-10-15', '09:00', start - 48 * HOUR).valid).toBe(true);
  });

  it('accepts a reservation starting exactly 12 hours from now', () => {
    expect(validateLeadTime('2026-10-15', '09:00', start - 12 * HOUR).valid).toBe(true);
  });

  it('rejects a reservation starting 11h59m from now', () => {
    const result = validateLeadTime('2026-10-15', '09:00', start - 12 * HOUR + 60 * 1000);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/12 jam/);
  });

  it('rejects a reservation whose start time has already passed', () => {
    expect(validateLeadTime('2026-10-15', '09:00', start + HOUR).valid).toBe(false);
  });

  it('rejects an invalid date', () => {
    expect(validateLeadTime('bukan-tanggal', '09:00', 0).valid).toBe(false);
  });
});
