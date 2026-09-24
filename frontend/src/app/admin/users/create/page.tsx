'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api';
import { Input, Button, Alert, Select, Card } from '@/components/ui';

export default function CreateUserPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'officer' | 'user',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name || form.name.length < 2)
      newErrors.name = 'Nama minimal 2 karakter';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Format email tidak valid';
    if (!form.password || form.password.length < 8)
      newErrors.password = 'Password minimal 8 karakter';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      await usersApi.create(form);
      router.push('/admin/users?created=1');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal membuat akun.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-blue-600">
          Dashboard Admin
        </Link>
        <span>/</span>
        <Link href="/admin/users" className="hover:text-blue-600">
          Kelola Pengguna
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Buat Akun Baru</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buat Akun Baru</h1>
        <p className="mt-1 text-sm text-gray-600">
          Akun yang dibuat admin langsung aktif tanpa perlu verifikasi
        </p>
      </div>

      <Card>
        {serverError && (
          <Alert type="error" className="mb-6">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit} id="create-user-form" className="space-y-5">
          <Input
            id="create-name"
            label="Nama Lengkap"
            placeholder="Nama pengguna"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            error={errors.name}
            required
            autoFocus
          />

          <Input
            id="create-email"
            label="Email"
            type="email"
            placeholder="email@kampus.ac.id"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            error={errors.email}
            required
          />

          <Select
            id="create-role"
            label="Role"
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            options={[
              { value: 'user', label: 'Pengguna (Mahasiswa/Dosen/Staf)' },
              { value: 'officer', label: 'Petugas Fasilitas' },
            ]}
            required
          />

          <Input
            id="create-password"
            label="Password"
            type="password"
            placeholder="Minimal 8 karakter"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            error={errors.password}
            helperText="Sampaikan password ini ke pengguna dan minta untuk segera diubah."
            required
          />

          {form.role === 'officer' && (
            <Alert type="info">
              Akun petugas hanya bisa dibuat oleh admin (tidak bisa daftar sendiri).
              Akun ini langsung aktif dan bisa login segera.
            </Alert>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading}>
              Buat Akun
            </Button>
            <Link href="/admin/users">
              <Button type="button" variant="outline" size="lg">
                Batal
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
