'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { reportsApi, facilitiesApi } from '@/lib/api';
import { Button, Card, Alert, Select, Textarea, Input } from '@/components/ui';
import type { Facility, PaginatedResponse } from '@/types';

const categoryOptions = [
  { value: 'kerusakan_ringan', label: 'Kerusakan Ringan' },
  { value: 'kerusakan_berat', label: 'Kerusakan Berat' },
  { value: 'kebersihan', label: 'Kebersihan' },
  { value: 'keamanan', label: 'Keamanan' },
  { value: 'lainnya', label: 'Lainnya' },
];

export default function NewReportPage() {
  const router = useRouter();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true);

  const [facilityId, setFacilityId] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    facilitiesApi
      .list({ limit: '100' })
      .then((res: PaginatedResponse<Facility>) => setFacilities(res.data))
      .catch((err) => setError(`Gagal memuat fasilitas: ${err.message}`))
      .finally(() => setIsLoadingFacilities(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      // Kirim sebagai JSON (bukan FormData) karena backend mengharapkan JSON
      const body = {
        facilityId,
        category,
        description,
        photoUrl: photoUrl || undefined,
      };

      await reportsApi.create(createFormData(body));
      router.push('/dashboard/reports');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gagal membuat laporan. Silakan coba lagi.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper: convert body to FormData for the API client
  const createFormData = (body: Record<string, string | undefined>): FormData => {
    const fd = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined) fd.append(key, value);
    });
    return fd;
  };

  const facilityOptions = facilities.map((f) => ({
    value: f.id,
    label: `${f.name} — ${f.location}`,
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/reports"
          className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          ← Kembali ke Laporan Saya
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Buat Laporan Kerusakan
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Laporkan kerusakan atau masalah pada fasilitas kampus.
        </p>
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pilih Fasilitas */}
          <Select
            label="Fasilitas"
            required
            placeholder={isLoadingFacilities ? 'Memuat...' : 'Pilih fasilitas'}
            options={facilityOptions}
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            error={fieldErrors.facilityId?.[0]}
            disabled={isLoadingFacilities}
          />

          {/* Kategori */}
          <Select
            label="Kategori Laporan"
            required
            placeholder="Pilih kategori"
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            error={fieldErrors.category?.[0]}
          />

          {/* Deskripsi */}
          <Textarea
            label="Deskripsi Kerusakan"
            required
            placeholder="Jelaskan secara detail kerusakan atau masalah yang Anda temukan (minimal 10 karakter)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={fieldErrors.description?.[0]}
            rows={5}
          />

          {/* URL Foto (opsional) */}
          <Input
            label="URL Foto (Opsional)"
            type="url"
            placeholder="https://example.com/foto-kerusakan.jpg"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            error={fieldErrors.photoUrl?.[0]}
            helperText="Masukkan URL foto kerusakan jika ada. Gunakan layanan upload gambar seperti Imgur."
          />

          {/* Info kategori */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700">
              💡 <strong>Tips:</strong> Pilih kategori yang sesuai:
            </p>
            <ul className="text-xs text-blue-600 mt-1 space-y-0.5 ml-5 list-disc">
              <li><strong>Kerusakan Ringan:</strong> Lampu mati, cat mengelupas, dll.</li>
              <li><strong>Kerusakan Berat:</strong> Atap bocor, dinding retak, AC rusak total, dll.</li>
              <li><strong>Kebersihan:</strong> Sampah menumpuk, toilet kotor, dll.</li>
              <li><strong>Keamanan:</strong> Kunci rusak, CCTV mati, dll.</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard/reports">
              <Button type="button" variant="outline">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!facilityId || !category || !description}
            >
              Kirim Laporan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
