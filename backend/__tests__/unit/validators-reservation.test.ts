import { describe, it, expect } from 'vitest';
import {
  createReservationSchema,
  updateReservationStatusSchema,
  cancelReservationSchema,
} from '../../lib/validators/reservation';

// ─── createReservationSchema ──────────────────────────────────────────────────

describe('createReservationSchema', () => {
  const valid = {
    facilityId: 'clxyz123abc',
    date: '2026-12-01',
    startTime: '09:00',
    endTime: '10:00',
    purpose: 'Kuliah Pemrograman Web kelas A',
  };

  it('accepts valid reservation data', () => {
    const result = createReservationSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects empty facilityId', () => {
    expect(createReservationSchema.safeParse({ ...valid, facilityId: '' }).success).toBe(false);
  });

  it('rejects invalid date format', () => {
    expect(createReservationSchema.safeParse({ ...valid, date: '01-12-2026' }).success).toBe(false);
  });

  it('rejects invalid startTime format', () => {
    expect(createReservationSchema.safeParse({ ...valid, startTime: '9am' }).success).toBe(false);
  });

  it('rejects purpose shorter than 10 chars', () => {
    expect(createReservationSchema.safeParse({ ...valid, purpose: 'Kuliah' }).success).toBe(false);
  });

  it('rejects purpose longer than 500 chars', () => {
    expect(
      createReservationSchema.safeParse({ ...valid, purpose: 'x'.repeat(501) }).success
    ).toBe(false);
  });

  it('rejects startTime >= endTime', () => {
    expect(
      createReservationSchema.safeParse({ ...valid, startTime: '10:00', endTime: '10:00' }).success
    ).toBe(false);
  });

  it('rejects startTime > endTime', () => {
    expect(
      createReservationSchema.safeParse({ ...valid, startTime: '11:00', endTime: '10:00' }).success
    ).toBe(false);
  });

  it('rejects time outside operating hours (before 07:00)', () => {
    expect(
      createReservationSchema.safeParse({ ...valid, startTime: '06:00', endTime: '07:00' }).success
    ).toBe(false);
  });

  it('rejects time outside operating hours (after 20:00)', () => {
    expect(
      createReservationSchema.safeParse({ ...valid, startTime: '19:30', endTime: '20:30' }).success
    ).toBe(false);
  });

  it('rejects non-30-min multiple', () => {
    expect(
      createReservationSchema.safeParse({ ...valid, startTime: '09:15', endTime: '10:00' }).success
    ).toBe(false);
  });
});

// ─── updateReservationStatusSchema ────────────────────────────────────────────

describe('updateReservationStatusSchema', () => {
  it('accepts approved without rejection reason', () => {
    const result = updateReservationStatusSchema.safeParse({ status: 'approved' });
    expect(result.success).toBe(true);
  });

  it('accepts rejected with rejection reason', () => {
    const result = updateReservationStatusSchema.safeParse({
      status: 'rejected',
      rejectionReason: 'Fasilitas sedang maintenance',
    });
    expect(result.success).toBe(true);
  });

  it('rejects rejected without rejection reason', () => {
    const result = updateReservationStatusSchema.safeParse({ status: 'rejected' });
    expect(result.success).toBe(false);
  });

  it('rejects rejected with too-short rejection reason', () => {
    const result = updateReservationStatusSchema.safeParse({
      status: 'rejected',
      rejectionReason: 'No',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status value', () => {
    const result = updateReservationStatusSchema.safeParse({ status: 'pending' });
    expect(result.success).toBe(false);
  });
});

// ─── cancelReservationSchema ──────────────────────────────────────────────────

describe('cancelReservationSchema', () => {
  it('accepts with cancellation reason', () => {
    const result = cancelReservationSchema.safeParse({
      cancellationReason: 'Jadwal berubah mendadak',
    });
    expect(result.success).toBe(true);
  });

  it('accepts without cancellation reason', () => {
    const result = cancelReservationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts null cancellation reason', () => {
    const result = cancelReservationSchema.safeParse({ cancellationReason: null });
    expect(result.success).toBe(true);
  });

  it('rejects cancellation reason longer than 500 chars', () => {
    const result = cancelReservationSchema.safeParse({
      cancellationReason: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
