'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Input, Button, Alert } from '@/components/ui';

import { Suspense } from 'react';

function LoginContent() {
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      setError('Email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);

      // Redirect ke halaman yang diminta atau home
      // (landing page sekarang mendeteksi login dan menampilkan dashboard link)
      router.push(redirectTo || '/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏫</div>
        <h1 className="text-2xl font-bold text-gray-900">Masuk ke Akun</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sistem Reservasi & Pelaporan Fasilitas Kampus
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
          <Input
            id="email"
            label="Email"
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
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            Masuk
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link
              href="/register"
              className="text-blue-600 font-medium hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>

      {/* Demo accounts hint */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs text-blue-700 font-medium mb-2">💡 Akun Demo:</p>
        <div className="grid grid-cols-1 gap-1 text-xs text-blue-600">
          <div>
            <span className="font-medium">Admin:</span> admin@kampus.ac.id / admin123
          </div>
          <div>
            <span className="font-medium">Petugas:</span> petugas@kampus.ac.id / petugas123
          </div>
          <div>
            <span className="font-medium">User:</span> budi@mahasiswa.ac.id / user123
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
