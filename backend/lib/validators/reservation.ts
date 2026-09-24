import { z } from 'zod';

// ─── Helper ───────────────────────────────────────────────────────────────────

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// ─── Create Reservation Schema ────────────────────────────────────────────────

export const createReservationSchema = z
  .object({
    facilityId: z.string().min(1, 'ID fasilitas wajib diisi'),
    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Format tanggal harus YYYY-MM-DD'
      ),
    startTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        'Format waktu harus HH:mm'
      ),
    endTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        'Format waktu harus HH:mm'
      ),
    purpose: z
      .string()
      .min(10, 'Tujuan penggunaan minimal 10 karakter')
      .max(500, 'Tujuan penggunaan maksimal 500 karakter'),
  })
  .refine(
    (data) => {
      const start = timeToMinutes(data.startTime);
      const end = timeToMinutes(data.endTime);
      return start < end;
    },
    { message: 'Waktu mulai harus sebelum waktu selesai', path: ['endTime'] }
  )
  .refine(
    (data) => {
      const start = timeToMinutes(data.startTime);
      const end = timeToMinutes(data.endTime);
      return start >= 420 && end <= 1200; // 07:00=420, 20:00=1200
    },
    {
      message: 'Waktu harus dalam jam operasional 07:00-20:00',
      path: ['startTime'],
    }
  )
  .refine(
    (data) => {
      const start = timeToMinutes(data.startTime);
      const end = timeToMinutes(data.endTime);
      return start % 30 === 0 && end % 30 === 0;
    },
    {
      message: 'Waktu harus kelipatan 30 menit',
      path: ['startTime'],
    }
  );

// ─── Update Reservation Status Schema (Petugas: approve/reject) ───────────────

export const updateReservationStatusSchema = z
  .object({
    status: z.enum(['approved', 'rejected'], {
      errorMap: () => ({
        message: 'Status harus "approved" atau "rejected"',
      }),
    }),
    rejectionReason: z
      .string()
      .min(5, 'Alasan penolakan minimal 5 karakter')
      .max(500, 'Alasan penolakan maksimal 500 karakter')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Jika reject, wajib sertakan alasan
      if (data.status === 'rejected') {
        return !!data.rejectionReason && data.rejectionReason.trim().length >= 5;
      }
      return true;
    },
    {
      message: 'Alasan penolakan wajib diisi saat menolak reservasi',
      path: ['rejectionReason'],
    }
  );

// ─── Cancel Reservation Schema ────────────────────────────────────────────────

export const cancelReservationSchema = z.object({
  cancellationReason: z
    .string()
    .min(5, 'Alasan pembatalan minimal 5 karakter')
    .max(500, 'Alasan pembatalan maksimal 500 karakter')
    .optional()
    .nullable(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationStatusInput = z.infer<typeof updateReservationStatusSchema>;
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;
