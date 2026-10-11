'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Input, Button, Alert, ErrorModal, useErrorPopup } from '@/components/ui';

function LoginContent() {
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { errorPopup, triggerErrorPopup, closeErrorPopup } = useErrorPopup();

  // Jika sudah login, redirect ke dashboard sesuai role
  if (!authLoading && isAuthenticated && user) {
    const dashboardHref =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'officer'
        ? '/petugas'
        : '/dashboard';
    router.replace(redirectTo || dashboardHref);
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email || !password) {
      const msg = 'Email dan kata sandi wajib diisi.';
      setError(msg);
      triggerErrorPopup('Validasi Formulir', msg);
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.push(redirectTo || '/');
      router.refresh();
    } catch (err) {
      const isConn =
        err instanceof Error &&
        (err.name === 'ConnectionError' ||
          err.message.toLowerCase().includes('terhubung') ||
          err.message.toLowerCase().includes('koneksi') ||
          err.message.toLowerCase().includes('network') ||
          err.message.toLowerCase().includes('failed to fetch'));
      const msg = err instanceof Error ? err.message : 'Login gagal. Coba lagi.';
      const title = isConn ? 'Gangguan Koneksi Jaringan' : 'Login Gagal';
      setError(msg);
      triggerErrorPopup(title, msg, isConn);
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@kampus.ac.id', pass: 'admin123' },
    { role: 'Petugas', email: 'petugas@kampus.ac.id', pass: 'petugas123' },
    { role: 'Mahasiswa', email: 'budi@mahasiswa.ac.id', pass: 'user123' },
  ];

  return (
    <div className="w-full max-w-[420px] relative z-20">
      {/* Soft Ambient Floating Glow behind card */}
      <div className="absolute -inset-2 bg-gradient-to-r from-primary-500/30 via-accent/25 to-primary-600/30 rounded-3xl blur-2xl opacity-80 pointer-events-none" />

      {/* Floating Login Card */}
      <div className="relative bg-surface/95 dark:bg-surface/90 backdrop-blur-2xl rounded-2xl border border-white/50 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] p-7 sm:p-9 text-ink select-text">
        {/* Header — FASKAM Emblem */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-card mb-3.5 transform hover:scale-105 transition-transform duration-200 p-1 border border-line/40">
            <img
              src="/Images/Faskam-logo.png"
              alt="Logo FASKAM"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold font-heading text-ink tracking-tight">
            Masuk ke Akun
          </h1>
          <p className="mt-1 text-xs text-ink-soft">
            FASKAM — Fasilitas Kampus
          </p>
        </div>

        {error && (
          <Alert type="error" className="mb-5">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
          <Input
            id="email"
            label="Email Kampus"
            type="email"
            placeholder="nama@kampus.ac.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />

          <Input
            id="password"
            label="Kata Sandi"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-md active:scale-[0.99] transition-transform py-2.5 text-sm cursor-pointer"
              size="md"
              isLoading={isLoading}
            >
              Masuk Sekarang →
            </Button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-line text-center">
          <p className="text-xs text-ink-soft">
            Belum memiliki akun terdaftar?{' '}
            <Link
              href="/register"
              className="text-primary-600 hover:text-primary-700 font-bold hover:underline ml-1"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>

        {/* Demo accounts hint — clean, light typography with blockable text and Gunakan option */}
        <div className="mt-5 p-3.5 bg-canvas/80 dark:bg-canvas/50 border border-line rounded-xl select-text">
          <p className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
            Akun Percobaan (Demo):
          </p>
          <div className="grid grid-cols-1 gap-1 text-[11px] text-ink-soft select-text">
            {demoAccounts.map((acc) => (
              <div key={acc.role} className="flex justify-between items-center py-0.5 select-text">
                <div className="select-text">
                  <span className="font-semibold text-ink mr-1.5 select-none">{acc.role}:</span>
                  <span className="font-mono text-[10px] text-ink-muted select-text cursor-text">
                    {acc.email} / {acc.pass}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.pass);
                  }}
                  className="text-[10px] font-medium text-primary-600 hover:text-primary-800 hover:underline cursor-pointer select-none ml-2"
                >
                  Gunakan
                </button>
              </div>
            ))}
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

export default function LoginPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden overscroll-none">
      {/* Educational University Campus Background Image (Fixed, Non-draggable, Non-scrollable) */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none select-none -z-10"
        style={{
          backgroundImage: "url('/campus-bg.jpg')",
          userSelect: 'none',
          WebkitUserDrag: 'none',
        } as React.CSSProperties}
        draggable={false}
      >
        {/* Soft, deep contrast overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-900/65 to-ink/75 backdrop-blur-[2px]" />
      </div>

      {/* Floating Center Card Container */}
      <div className="relative z-10 w-full flex items-center justify-center py-4">
        <Suspense
          fallback={
            <div className="relative z-20 flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
            </div>
          }
        >
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
