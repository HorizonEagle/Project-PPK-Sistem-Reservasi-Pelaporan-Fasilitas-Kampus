import { z } from 'zod';

// ─── Create Report Schema ─────────────────────────────────────────────────────

export const createReportSchema = z.object({
  facilityId: z
    .string()
    .min(1, 'ID fasilitas wajib diisi'),
  category: z.enum(
    ['kerusakan_ringan', 'kerusakan_berat', 'kebersihan', 'keamanan', 'lainnya'],
    { errorMap: () => ({ message: 'Kategori tidak valid' }) }
  ),
  description: z
    .string()
    .min(10, 'Deskripsi minimal 10 karakter')
    .max(2000, 'Deskripsi maksimal 2000 karakter'),
  photoUrl: z
    .string()
    .url('URL foto tidak valid')
    .optional()
    .or(z.literal('')),
});

// ─── Update Report Status Schema ──────────────────────────────────────────────

export const updateReportStatusSchema = z
  .object({
    status: z.enum(['in_progress', 'resolved', 'rejected'], {
      errorMap: () => ({ message: 'Status tidak valid. Harus: in_progress, resolved, atau rejected' }),
    }),
    resolutionNote: z
      .string()
      .max(2000, 'Catatan resolusi maksimal 2000 karakter')
      .optional(),
  })
  .refine(
    (data) => {
      // resolutionNote wajib saat resolved atau rejected
      if ((data.status === 'resolved' || data.status === 'rejected') && !data.resolutionNote?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: 'Catatan resolusi wajib diisi saat status resolved atau rejected',
      path: ['resolutionNote'],
    }
  );

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportStatusInput = z.infer<typeof updateReportStatusSchema>;
