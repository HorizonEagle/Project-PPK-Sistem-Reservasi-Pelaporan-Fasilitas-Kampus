import { describe, it, expect } from 'vitest';
import {
  createReportSchema,
  updateReportStatusSchema,
} from '../../lib/validators/report';

// ─── createReportSchema ───────────────────────────────────────────────────────

describe('createReportSchema', () => {
  const valid = {
    facilityId: 'clxyz123abc',
    category: 'kerusakan_ringan' as const,
    description: 'AC di ruangan tidak berfungsi sejak pagi',
  };

  it('accepts valid report data', () => {
    expect(createReportSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts with optional photoUrl', () => {
    const result = createReportSchema.safeParse({
      ...valid,
      photoUrl: 'https://example.com/photo.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty string photoUrl', () => {
    const result = createReportSchema.safeParse({ ...valid, photoUrl: '' });
    expect(result.success).toBe(true);
  });

  it('accepts all valid categories', () => {
    const categories = [
      'kerusakan_ringan',
      'kerusakan_berat',
      'kebersihan',
      'keamanan',
      'lainnya',
    ] as const;
    for (const category of categories) {
      expect(createReportSchema.safeParse({ ...valid, category }).success).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    expect(
      createReportSchema.safeParse({ ...valid, category: 'vandalisme' }).success
    ).toBe(false);
  });

  it('rejects description shorter than 10 chars', () => {
    expect(
      createReportSchema.safeParse({ ...valid, description: 'Rusak' }).success
    ).toBe(false);
  });

  it('rejects description longer than 2000 chars', () => {
    expect(
      createReportSchema.safeParse({ ...valid, description: 'x'.repeat(2001) }).success
    ).toBe(false);
  });

  it('rejects invalid photoUrl', () => {
    expect(
      createReportSchema.safeParse({ ...valid, photoUrl: 'not-a-url' }).success
    ).toBe(false);
  });

  it('rejects empty facilityId', () => {
    expect(
      createReportSchema.safeParse({ ...valid, facilityId: '' }).success
    ).toBe(false);
  });
});

// ─── updateReportStatusSchema ─────────────────────────────────────────────────

describe('updateReportStatusSchema', () => {
  it('accepts in_progress without note', () => {
    const result = updateReportStatusSchema.safeParse({ status: 'in_progress' });
    expect(result.success).toBe(true);
  });

  it('accepts resolved with resolution note', () => {
    const result = updateReportStatusSchema.safeParse({
      status: 'resolved',
      resolutionNote: 'AC sudah diganti baru',
    });
    expect(result.success).toBe(true);
  });

  it('rejects resolved without resolution note', () => {
    const result = updateReportStatusSchema.safeParse({ status: 'resolved' });
    expect(result.success).toBe(false);
  });

  it('rejects rejected without resolution note', () => {
    const result = updateReportStatusSchema.safeParse({ status: 'rejected' });
    expect(result.success).toBe(false);
  });

  it('accepts rejected with resolution note', () => {
    const result = updateReportStatusSchema.safeParse({
      status: 'rejected',
      resolutionNote: 'Laporan tidak valid, fasilitas dalam kondisi baik',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateReportStatusSchema.safeParse({ status: 'new_report' });
    expect(result.success).toBe(false);
  });

  it('rejects resolution note with only whitespace when resolving', () => {
    const result = updateReportStatusSchema.safeParse({
      status: 'resolved',
      resolutionNote: '   ',
    });
    expect(result.success).toBe(false);
  });
});
