'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Input, Button, Alert, Select } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'mahasiswa',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Jika sudah login, redirect ke dashboard
  if (!authLoading && isAuthenticated && user) {
    const dashboardHref =
      user.role === 'admin' ? '/admin' : user.role === 'officer' ? '/petugas' : '/dashboard';
    router.replace(dashboardHref);
    return null;
  }

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name || form.name.length < 2) {
      newErrors.name = 'Nama minimal 2 karakter';
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    if (!form.password || form.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }
    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak sama';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Registrasi gagal. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (success) {
    return (
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: "url('/campus-bg.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-900/60 to-ink/70 backdrop-blur-[1px]" />
        </div>
        <div className="w-full max-w-md relative z-10">
          <div className="bg-surface/95 dark:bg-surface/90 backdrop-blur-md rounded-2xl border border-line shadow-float p-8 text-center text-ink">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold font-heading text-ink mb-2">
              Pendaftaran Berhasil!
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft mb-6 leading-relaxed">
              Akun Anda telah didaftarkan dan sedang menunggu proses verifikasi oleh administrator
              kampus.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 transition-colors shadow-sm"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Educational University Campus Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: "url('/campus-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-900/60 to-ink/70 backdrop-blur-[1px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-surface/95 dark:bg-surface/90 backdrop-blur-md rounded-2xl border border-line shadow-float p-8 sm:p-10 text-ink">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-card mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold font-heading text-ink">Buat Akun Baru</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-ink-soft">
              Daftar untuk mengakses sistem fasilitas kampus
            </p>
          </div>

          {serverError && (
            <Alert type="error" className="mb-6">
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
            <Input
              id="name"
              label="Nama Lengkap"
              type="text"
              placeholder="Nama Lengkap Anda"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              error={errors.name}
              required
              autoComplete="name"
              autoFocus
            />

            <Input
              id="email"
              label="Email Kampus"
              type="email"
              placeholder="nama@kampus.ac.id"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
            />

            <Select
              id="role"
              label="Status Akademik / Peran"
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              options={[
                { value: 'mahasiswa', label: 'Mahasiswa' },
                { value: 'dosen', label: 'Dosen' },
                { value: 'staf', label: 'Staf Administrasi' },
              ]}
              required
            />

            <Input
              id="password"
              label="Kata Sandi"
              type="password"
              placeholder="Minimal 8 karakter"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              error={errors.password}
              helperText="Gunakan minimal 8 karakter kombinasi"
              required
              autoComplete="new-password"
            />

            <Input
              id="confirm-password"
              label="Konfirmasi Kata Sandi"
              type="password"
              placeholder="Ulangi kata sandi"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />

            <Alert type="warning">
              Akun baru memerlukan <strong>verifikasi oleh admin</strong> sebelum dapat
              digunakan untuk melakukan reservasi.
            </Alert>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full font-semibold shadow-sm"
                size="lg"
                isLoading={isLoading}
              >
                Daftar Akun Baru →
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-line text-center">
            <p className="text-xs text-ink-soft">
              Sudah memiliki akun terdaftar?{' '}
              <Link
                href="/login"
                className="text-primary-600 hover:text-primary-700 font-semibold hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
