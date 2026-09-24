import { z } from 'zod';

// ─── Facility Validators ──────────────────────────────────────────────────────

export const createFacilitySchema = z.object({
  name: z
    .string()
    .min(2, 'Nama fasilitas minimal 2 karakter')
    .max(200, 'Nama fasilitas maksimal 200 karakter'),
  type: z.enum(['classroom', 'auditorium', 'laboratory', 'equipment', 'field'], {
    errorMap: () => ({
      message: 'Tipe harus salah satu dari: classroom, auditorium, laboratory, equipment, field',
    }),
  }),
  location: z
    .string()
    .min(2, 'Lokasi minimal 2 karakter')
    .max(200, 'Lokasi maksimal 200 karakter'),
  capacity: z
    .number()
    .int('Kapasitas harus bilangan bulat')
    .min(1, 'Kapasitas minimal 1')
    .max(10000, 'Kapasitas maksimal 10000'),
  description: z
    .string()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url('Format URL tidak valid')
    .optional()
    .nullable(),
});

export const updateFacilitySchema = z.object({
  name: z
    .string()
    .min(2, 'Nama fasilitas minimal 2 karakter')
    .max(200, 'Nama fasilitas maksimal 200 karakter')
    .optional(),
  type: z
    .enum(['classroom', 'auditorium', 'laboratory', 'equipment', 'field'], {
      errorMap: () => ({
        message: 'Tipe harus salah satu dari: classroom, auditorium, laboratory, equipment, field',
      }),
    })
    .optional(),
  location: z
    .string()
    .min(2, 'Lokasi minimal 2 karakter')
    .max(200, 'Lokasi maksimal 200 karakter')
    .optional(),
  capacity: z
    .number()
    .int('Kapasitas harus bilangan bulat')
    .min(1, 'Kapasitas minimal 1')
    .max(10000, 'Kapasitas maksimal 10000')
    .optional(),
  description: z
    .string()
    .max(1000, 'Deskripsi maksimal 1000 karakter')
    .optional()
    .nullable(),
  status: z
    .enum(['active', 'inactive', 'under_maintenance'], {
      errorMap: () => ({
        message: 'Status harus salah satu dari: active, inactive, under_maintenance',
      }),
    })
    .optional(),
  imageUrl: z
    .string()
    .url('Format URL tidak valid')
    .optional()
    .nullable(),
});

export const scheduleQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateFacilityInput = z.infer<typeof createFacilitySchema>;
export type UpdateFacilityInput = z.infer<typeof updateFacilitySchema>;
export type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>;
