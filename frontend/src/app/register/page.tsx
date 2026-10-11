'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Input, Button, Alert, Select, ErrorModal, useErrorPopup } from '@/components/ui';

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
  const { errorPopup, triggerErrorPopup, closeErrorPopup } = useErrorPopup();

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
    return newErrors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate();
    const errorList = Object.values(validationErrors);
    if (errorList.length > 0) {
      triggerErrorPopup('Validasi Pendaftaran', errorList[0]);
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      const isConn =
        err instanceof Error &&
        (err.name === 'ConnectionError' ||
          err.message.toLowerCase().includes('terhubung') ||
          err.message.toLowerCase().includes('koneksi') ||
          err.message.toLowerCase().includes('network') ||
          err.message.toLowerCase().includes('failed to fetch'));
      const msg = err instanceof Error ? err.message : 'Registrasi gagal. Coba lagi.';
      const title = isConn ? 'Gangguan Koneksi Jaringan' : 'Pendaftaran Gagal';
      setServerError(msg);
      triggerErrorPopup(title, msg, isConn);
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
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden">
        {/* Fixed Fullscreen Campus Background */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none select-none -z-10"
          style={{
            backgroundImage: "url('/campus-bg.jpg')",
            userSelect: 'none',
            WebkitUserDrag: 'none',
          } as React.CSSProperties}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/95 via-primary-900/75 to-ink/80 backdrop-blur-[2px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="bg-surface/95 dark:bg-surface/90 backdrop-blur-2xl rounded-2xl border border-white/50 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] p-8 text-center text-ink">
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
              className="inline-flex items-center justify-center w-full px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-3 sm:p-4 overflow-x-hidden">
      {/* Educational University Campus Background Image (Fixed Fullscreen, Non-scrollable) */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none select-none -z-10"
        style={{
          backgroundImage: "url('/campus-bg.jpg')",
          userSelect: 'none',
          WebkitUserDrag: 'none',
        } as React.CSSProperties}
        draggable={false}
      >
        {/* Deep contrast overlay — 100% full screen coverage */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/95 via-primary-900/75 to-ink/80 backdrop-blur-[2px]" />
      </div>

      {/* Floating Compact Registration Card Container */}
      <div className="w-full max-w-[500px] relative z-20 my-auto">
        {/* Ambient floating glow */}
        <div className="absolute -inset-2 bg-gradient-to-r from-primary-500/25 via-accent/20 to-primary-600/25 rounded-3xl blur-2xl opacity-75 pointer-events-none" />

        {/* Compact Glassmorphism Card */}
        <div className="relative bg-surface/95 dark:bg-surface/90 backdrop-blur-2xl rounded-2xl border border-white/50 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] p-5 sm:p-7 text-ink select-text">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-5">
            <div className="mx-auto w-11 h-11 rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-card mb-2.5 transform hover:scale-105 transition-transform duration-200 p-1 border border-line/40">
              <img
                src="/Images/Faskam-logo.png"
                alt="Logo FASKAM"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-ink tracking-tight">
              Buat Akun Baru
            </h1>
            <p className="mt-0.5 text-xs text-ink-soft">
              FASKAM — Fasilitas Kampus
            </p>
          </div>

          {serverError && (
            <Alert type="error" className="mb-3 text-xs py-2">
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" id="register-form">
            {/* Nama Lengkap */}
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

            {/* Email Kampus & Status Akademik (Grid 2 Kolom) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                label="Status Akademik"
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
                options={[
                  { value: 'mahasiswa', label: 'Mahasiswa' },
                  { value: 'dosen', label: 'Dosen' },
                  { value: 'staf', label: 'Staf Administrasi' },
                ]}
                required
              />
            </div>

            {/* Kata Sandi & Konfirmasi Sandi (Grid 2 Kolom) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="password"
                label="Kata Sandi"
                type="password"
                placeholder="Min. 8 karakter"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                error={errors.password}
                required
                autoComplete="new-password"
              />

              <Input
                id="confirm-password"
                label="Konfirmasi Sandi"
                type="password"
                placeholder="Ulangi kata sandi"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />
            </div>

            {/* Catatan Verifikasi High-Contrast */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-100/90 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-600/80 shadow-2xs">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900/90 flex items-center justify-center text-amber-900 dark:text-amber-300">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-xs text-slate-900 dark:text-white font-medium leading-snug">
                Akun baru memerlukan <strong className="font-bold text-amber-950 dark:text-amber-200 underline decoration-amber-500/70">verifikasi admin</strong> sebelum dapat digunakan reservasi.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <Button
                type="submit"
                className="w-full font-semibold shadow-sm h-10 text-sm"
                isLoading={isLoading}
              >
                Daftar Akun Baru →
              </Button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-4 pt-3.5 border-t border-line text-center">
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

        {/* Modal Error Popup */}
        <ErrorModal
          isOpen={errorPopup.isOpen}
          onClose={closeErrorPopup}
          title={errorPopup.title}
          message={errorPopup.message}
          isConnectionError={errorPopup.isConnectionError}
        />
      </div>
    </div>
  );
}
