import { describe, it, expect } from 'vitest';
import {
  parseTimeToMinutes,
  parseTimeToDate,
  prismaTimeToHHMM,
  validateSlotTime,
} from '../../lib/slot-utils';

// ─── parseTimeToMinutes ───────────────────────────────────────────────────────

describe('parseTimeToMinutes', () => {
  it('parses midnight correctly', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
  });

  it('parses morning time', () => {
    expect(parseTimeToMinutes('09:00')).toBe(540);
  });

  it('parses time with 30-min offset', () => {
    expect(parseTimeToMinutes('10:30')).toBe(630);
  });

  it('parses end of operating hours', () => {
    expect(parseTimeToMinutes('20:00')).toBe(1200);
  });

  it('parses 23:59', () => {
    expect(parseTimeToMinutes('23:59')).toBe(1439);
  });
});

// ─── parseTimeToDate ──────────────────────────────────────────────────────────

describe('parseTimeToDate', () => {
  it('returns a Date at 1970-01-01 UTC for 09:00', () => {
    const d = parseTimeToDate('09:00');
    expect(d.getUTCFullYear()).toBe(1970);
    expect(d.getUTCMonth()).toBe(0);
    expect(d.getUTCDate()).toBe(1);
    expect(d.getUTCHours()).toBe(9);
    expect(d.getUTCMinutes()).toBe(0);
  });

  it('handles 13:30', () => {
    const d = parseTimeToDate('13:30');
    expect(d.getUTCHours()).toBe(13);
    expect(d.getUTCMinutes()).toBe(30);
  });
});

// ─── prismaTimeToHHMM ─────────────────────────────────────────────────────────

describe('prismaTimeToHHMM', () => {
  it('formats single-digit hour with leading zero', () => {
    const d = new Date(Date.UTC(1970, 0, 1, 7, 0));
    expect(prismaTimeToHHMM(d)).toBe('07:00');
  });

  it('formats double-digit hour', () => {
    const d = new Date(Date.UTC(1970, 0, 1, 14, 30));
    expect(prismaTimeToHHMM(d)).toBe('14:30');
  });

  it('formats midnight', () => {
    const d = new Date(Date.UTC(1970, 0, 1, 0, 0));
    expect(prismaTimeToHHMM(d)).toBe('00:00');
  });

  it('round-trips with parseTimeToDate', () => {
    const original = '08:30';
    const d = parseTimeToDate(original);
    expect(prismaTimeToHHMM(d)).toBe(original);
  });
});

// ─── validateSlotTime ─────────────────────────────────────────────────────────

describe('validateSlotTime', () => {
  it('accepts a valid 30-min slot within operating hours', () => {
    const result = validateSlotTime('09:00', '09:30');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('accepts a multi-slot reservation', () => {
    const result = validateSlotTime('09:00', '11:00');
    expect(result.valid).toBe(true);
  });

  it('accepts boundary start (07:00)', () => {
    expect(validateSlotTime('07:00', '07:30').valid).toBe(true);
  });

  it('accepts boundary end (19:30-20:00)', () => {
    expect(validateSlotTime('19:30', '20:00').valid).toBe(true);
  });

  it('rejects start before operating hours', () => {
    const result = validateSlotTime('06:30', '07:30');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('jam operasional');
  });

  it('rejects end after operating hours', () => {
    const result = validateSlotTime('19:30', '20:30');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('jam operasional');
  });

  it('rejects start >= end', () => {
    const result = validateSlotTime('10:00', '10:00');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('sebelum');
  });

  it('rejects start > end', () => {
    const result = validateSlotTime('11:00', '10:00');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('sebelum');
  });

  it('rejects non-30-min multiple for start', () => {
    const result = validateSlotTime('09:15', '10:00');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('kelipatan 30');
  });

  it('rejects non-30-min multiple for end', () => {
    const result = validateSlotTime('09:00', '09:45');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('kelipatan 30');
  });
});
