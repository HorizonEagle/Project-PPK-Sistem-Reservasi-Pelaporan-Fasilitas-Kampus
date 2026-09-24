import { z } from 'zod';

// ─── Auth Validators ──────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string()
    .email('Format email tidak valid')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  role: z
    .enum(['mahasiswa', 'dosen', 'staf'], {
      errorMap: () => ({ message: 'Peran harus salah satu dari: mahasiswa, dosen, staf' }),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Format email tidak valid')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password tidak boleh kosong'),
});

// ─── User Management Validators ───────────────────────────────────────────────

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string()
    .email('Format email tidak valid')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  role: z.enum(['officer', 'user'], {
    errorMap: () => ({ message: 'Role harus officer atau user' }),
  }),
});

export const verifyUserSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    errorMap: () => ({ message: 'Action harus approve atau reject' }),
  }),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type VerifyUserInput = z.infer<typeof verifyUserSchema>;
