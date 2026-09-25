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
      setServerError(
        err instanceof Error ? err.message : 'Registrasi gagal. Coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Registrasi Berhasil!
          </h1>
          <p className="text-gray-600 mb-6">
            Akun Anda telah dibuat dan sedang menunggu verifikasi oleh admin.
            Anda akan dapat login setelah akun diverifikasi.
          </p>
          <Alert type="info" className="text-left mb-6">
            <strong>Langkah selanjutnya:</strong> Hubungi administrator kampus untuk
            memverifikasi akun Anda. Biasanya proses ini memakan waktu 1-2 hari kerja.
          </Alert>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏫</div>
          <h1 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h1>
          <p className="mt-2 text-sm text-gray-600">
            Daftar untuk mulai mereservasi fasilitas kampus
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {serverError && (
            <Alert type="error" className="mb-6">
              {serverError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" id="register-form">
            <Input
              id="name"
              label="Nama Lengkap"
              type="text"
              placeholder="Nama Anda"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              error={errors.name}
              required
              autoComplete="name"
              autoFocus
            />

            <Input
              id="email"
              label="Email"
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
              label="Status"
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              options={[
                { value: 'mahasiswa', label: 'Mahasiswa' },
                { value: 'dosen', label: 'Dosen' },
                { value: 'staf', label: 'Staf' },
              ]}
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Minimal 8 karakter"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              error={errors.password}
              helperText="Minimal 8 karakter"
              required
              autoComplete="new-password"
            />

            <Input
              id="confirm-password"
              label="Konfirmasi Password"
              type="password"
              placeholder="Ulangi password"
              value={form.confirmPassword}
              onChange={(e) => update('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />

            <Alert type="warning">
              Akun Anda memerlukan <strong>verifikasi admin</strong> sebelum dapat
              digunakan. Proses ini biasanya 1-2 hari kerja.
            </Alert>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Daftar Sekarang
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link
                href="/login"
                className="text-blue-600 font-medium hover:underline"
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
