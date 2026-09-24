'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { facilitiesApi } from '@/lib/api';
import {
  Card,
  Button,
  Spinner,
  Alert,
  Input,
  Select,
  Textarea,
  Badge,
} from '@/components/ui';
import {
  facilityTypeLabel,
  facilityStatusLabel,
  facilityStatusColor,
} from '@/lib/utils';
import type { Facility, FacilityType, FacilityStatus } from '@/types';

export default function EditFacilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    type: '' as FacilityType,
    location: '',
    capacity: '',
    description: '',
    status: '' as FacilityStatus,
  });

  useEffect(() => {
    setIsLoading(true);
    facilitiesApi
      .get(id)
      .then((res) => {
        const f = res.data;
        setFacility(f);
        setForm({
          name: f.name,
          type: f.type,
          location: f.location,
          capacity: String(f.capacity),
          description: f.description || '',
          status: f.status,
        });
      })
      .catch((err) => setError(err.message || 'Gagal memuat fasilitas'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const capacity = parseInt(form.capacity);
      if (isNaN(capacity) || capacity < 1) {
        setError('Kapasitas harus angka positif');
        return;
      }

      await facilitiesApi.update(id, {
        name: form.name,
        type: form.type,
        location: form.location,
        capacity,
        description: form.description || undefined,
        status: form.status,
      });

      setSuccess('Fasilitas berhasil diperbarui!');
      // Update local facility state
      setFacility((prev) =>
        prev
          ? {
              ...prev,
              name: form.name,
              type: form.type,
              location: form.location,
              capacity,
              description: form.description || undefined,
              status: form.status,
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui fasilitas');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !facility) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <Alert type="error">{error}</Alert>
        <Link
          href="/admin/facilities"
          className="text-blue-600 hover:underline text-sm mt-4 inline-block"
        >
          ← Kembali
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/admin/facilities"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Kembali ke Daftar Fasilitas
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Fasilitas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Perbarui informasi fasilitas kampus.
          </p>
        </div>
        {facility && (
          <Badge className={facilityStatusColor(facility.status)}>
            {facilityStatusLabel(facility.status)}
          </Badge>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert type="success">{success}</Alert>
        </div>
      )}

      {/* Form */}
      <Card>
        <div className="space-y-5">
          <Input
            label="Nama Fasilitas"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Lab Komputer 1"
            required
            id="edit-facility-name"
          />

          <Select
            label="Tipe"
            options={[
              { value: 'classroom', label: 'Ruang Kuliah' },
              { value: 'auditorium', label: 'Aula/Auditorium' },
              { value: 'laboratory', label: 'Laboratorium' },
              { value: 'equipment', label: 'Peralatan' },
              { value: 'field', label: 'Lapangan' },
            ]}
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as FacilityType })
            }
            required
            id="edit-facility-type"
          />

          <Input
            label="Lokasi"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Contoh: Gedung A, Lantai 3"
            required
            id="edit-facility-location"
          />

          <Input
            label="Kapasitas"
            type="number"
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            placeholder="Contoh: 40"
            min="1"
            required
            id="edit-facility-capacity"
          />

          <Select
            label="Status"
            options={[
              { value: 'active', label: 'Aktif' },
              { value: 'inactive', label: 'Nonaktif' },
              { value: 'under_maintenance', label: 'Dalam Perbaikan' },
            ]}
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as FacilityStatus })
            }
            required
            id="edit-facility-status"
          />

          <Textarea
            label="Deskripsi (opsional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Deskripsi singkat tentang fasilitas..."
            id="edit-facility-description"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => router.push('/admin/facilities')}>
              Batal
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!form.name || !form.location || !form.capacity}
            >
              💾 Simpan Perubahan
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
