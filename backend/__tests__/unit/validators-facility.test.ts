import { describe, it, expect } from 'vitest';
import {
  createFacilitySchema,
  updateFacilitySchema,
  scheduleQuerySchema,
} from '../../lib/validators/facility';

// ─── createFacilitySchema ─────────────────────────────────────────────────────

describe('createFacilitySchema', () => {
  const valid = {
    name: 'Ruang Kelas A101',
    type: 'classroom' as const,
    location: 'Gedung A Lantai 1',
    capacity: 40,
  };

  it('accepts minimal valid data', () => {
    expect(createFacilitySchema.safeParse(valid).success).toBe(true);
  });

  it('accepts with optional description and imageUrl', () => {
    const result = createFacilitySchema.safeParse({
      ...valid,
      description: 'Ruang kelas ber-AC',
      imageUrl: 'https://example.com/photo.jpg',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null description', () => {
    const result = createFacilitySchema.safeParse({ ...valid, description: null });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = createFacilitySchema.safeParse({ ...valid, type: 'pool' });
    expect(result.success).toBe(false);
  });

  it('rejects capacity < 1', () => {
    const result = createFacilitySchema.safeParse({ ...valid, capacity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects capacity > 10000', () => {
    const result = createFacilitySchema.safeParse({ ...valid, capacity: 10001 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer capacity', () => {
    const result = createFacilitySchema.safeParse({ ...valid, capacity: 40.5 });
    expect(result.success).toBe(false);
  });

  it('rejects name shorter than 2 chars', () => {
    const result = createFacilitySchema.safeParse({ ...valid, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid imageUrl', () => {
    const result = createFacilitySchema.safeParse({ ...valid, imageUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid facility types', () => {
    const types = ['classroom', 'auditorium', 'laboratory', 'equipment', 'field'] as const;
    for (const type of types) {
      expect(createFacilitySchema.safeParse({ ...valid, type }).success).toBe(true);
    }
  });
});

// ─── updateFacilitySchema ─────────────────────────────────────────────────────

describe('updateFacilitySchema', () => {
  it('accepts partial update with just name', () => {
    expect(updateFacilitySchema.safeParse({ name: 'New Name' }).success).toBe(true);
  });

  it('accepts status change', () => {
    expect(updateFacilitySchema.safeParse({ status: 'under_maintenance' }).success).toBe(true);
  });

  it('accepts empty object (no fields to update)', () => {
    expect(updateFacilitySchema.safeParse({}).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(updateFacilitySchema.safeParse({ status: 'destroyed' }).success).toBe(false);
  });
});

// ─── scheduleQuerySchema ──────────────────────────────────────────────────────

describe('scheduleQuerySchema', () => {
  it('accepts valid date format YYYY-MM-DD', () => {
    expect(scheduleQuerySchema.safeParse({ date: '2026-10-15' }).success).toBe(true);
  });

  it('rejects DD-MM-YYYY format', () => {
    expect(scheduleQuerySchema.safeParse({ date: '15-10-2026' }).success).toBe(false);
  });

  it('rejects date without dashes', () => {
    expect(scheduleQuerySchema.safeParse({ date: '20261015' }).success).toBe(false);
  });

  it('rejects missing date', () => {
    expect(scheduleQuerySchema.safeParse({}).success).toBe(false);
  });
});
