'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { facilitiesApi } from '@/lib/api';
import {
  Card,
  Badge,
  Button,
  Spinner,
  Table,
  Select,
  Input,
  Pagination,
  Alert,
  Modal,
  Textarea,
} from '@/components/ui';
import {
  facilityTypeLabel,
  facilityStatusLabel,
  facilityStatusColor,
} from '@/lib/utils';
import type { Facility, PaginatedResponse, FacilityType, FacilityStatus } from '@/types';

const FACILITY_TYPE_OPTIONS = [
  { value: '', label: 'Semua Tipe' },
  { value: 'classroom', label: 'Ruang Kuliah' },
  { value: 'auditorium', label: 'Aula/Auditorium' },
  { value: 'laboratory', label: 'Laboratorium' },
  { value: 'equipment', label: 'Peralatan' },
  { value: 'field', label: 'Lapangan' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
  { value: 'under_maintenance', label: 'Dalam Perbaikan' },
];

export default function AdminFacilitiesPage() {
  const [facilities, setFacilities] = useState<PaginatedResponse<Facility> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'classroom' as FacilityType,
    location: '',
    capacity: '',
    description: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Fetch
  const fetchFacilities = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '10',
      };
      if (search) params.search = search;
      if (type) params.type = type;
      if (status) params.status = status;

      const res = await facilitiesApi.list(params);
      setFacilities(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat fasilitas');
    } finally {
      setIsLoading(false);
    }
  }, [search, type, status, page]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  useEffect(() => {
    setPage(1);
  }, [search, type, status]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Create handler
  const handleCreate = async () => {
    setCreateError('');
    setCreateLoading(true);

    try {
      const capacity = parseInt(createForm.capacity);
      if (isNaN(capacity) || capacity < 1) {
        setCreateError('Kapasitas harus angka positif');
        return;
      }

      await facilitiesApi.create({
        name: createForm.name,
        type: createForm.type,
        location: createForm.location,
        capacity,
        description: createForm.description || undefined,
      });

      setShowCreateModal(false);
      setCreateForm({
        name: '',
        type: 'classroom',
        location: '',
        capacity: '',
        description: '',
      });
      setSuccessMessage('Fasilitas berhasil ditambahkan!');
      fetchFacilities();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Gagal membuat fasilitas');
    } finally {
      setCreateLoading(false);
    }
  };

  // Status toggle handler
  const handleStatusChange = async (facilityId: string, newStatus: FacilityStatus) => {
    try {
      await facilitiesApi.update(facilityId, { status: newStatus });
      setSuccessMessage(`Status fasilitas berhasil diubah ke ${facilityStatusLabel(newStatus)}`);
      fetchFacilities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Fasilitas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tambah, edit, dan kelola status fasilitas kampus.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          ➕ Tambah Fasilitas
        </Button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="mb-4">
          <Alert type="success">{successMessage}</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            placeholder="Cari fasilitas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            id="admin-facility-search"
          />
          <Select
            options={FACILITY_TYPE_OPTIONS}
            value={type}
            onChange={(e) => setType(e.target.value)}
            id="admin-facility-type"
          />
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            id="admin-facility-status"
          />
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <Table
            headers={['Fasilitas', 'Tipe', 'Lokasi', 'Kapasitas', 'Status', 'Aksi']}
            isEmpty={!facilities?.data.length}
            emptyMessage="Tidak ada fasilitas ditemukan."
          >
            {facilities?.data.map((fac) => (
              <tr key={fac.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm">{fac.name}</div>
                  {fac.description && (
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {fac.description}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge className="bg-blue-50 text-blue-700 text-xs">
                    {facilityTypeLabel(fac.type)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{fac.location}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{fac.capacity}</td>
                <td className="px-4 py-3">
                  <Badge className={facilityStatusColor(fac.status)}>
                    {facilityStatusLabel(fac.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/facilities/${fac.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        ✏️ Edit
                      </Button>
                    </Link>
                    {fac.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(fac.id, 'inactive')}
                      >
                        🚫 Nonaktifkan
                      </Button>
                    )}
                    {fac.status === 'inactive' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(fac.id, 'active')}
                      >
                        ✅ Aktifkan
                      </Button>
                    )}
                    {fac.status === 'under_maintenance' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(fac.id, 'active')}
                      >
                        ✅ Selesai Perbaikan
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          {facilities && facilities.meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={facilities.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tambah Fasilitas Baru"
        size="lg"
      >
        <div className="space-y-4">
          {createError && <Alert type="error">{createError}</Alert>}

          <Input
            label="Nama Fasilitas"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="Contoh: Lab Komputer 1"
            required
            id="create-facility-name"
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
            value={createForm.type}
            onChange={(e) =>
              setCreateForm({ ...createForm, type: e.target.value as FacilityType })
            }
            required
            id="create-facility-type"
          />
          <Input
            label="Lokasi"
            value={createForm.location}
            onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
            placeholder="Contoh: Gedung A, Lantai 3"
            required
            id="create-facility-location"
          />
          <Input
            label="Kapasitas"
            type="number"
            value={createForm.capacity}
            onChange={(e) => setCreateForm({ ...createForm, capacity: e.target.value })}
            placeholder="Contoh: 40"
            min="1"
            required
            id="create-facility-capacity"
          />
          <Textarea
            label="Deskripsi (opsional)"
            value={createForm.description}
            onChange={(e) =>
              setCreateForm({ ...createForm, description: e.target.value })
            }
            placeholder="Deskripsi singkat tentang fasilitas..."
            id="create-facility-description"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={createLoading}
              disabled={!createForm.name || !createForm.location || !createForm.capacity}
            >
              Tambah Fasilitas
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
