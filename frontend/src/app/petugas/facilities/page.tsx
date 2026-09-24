'use client';

import { useEffect, useState, useCallback } from 'react';
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
} from '@/components/ui';
import {
  facilityTypeLabel,
  facilityStatusLabel,
  facilityStatusColor,
} from '@/lib/utils';
import type { Facility, PaginatedResponse, FacilityStatus } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'active', label: 'Aktif' },
  { value: 'under_maintenance', label: 'Dalam Perbaikan' },
];

export default function PetugasFacilitiesPage() {
  const [facilities, setFacilities] = useState<PaginatedResponse<Facility> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    facilityId: string;
    facilityName: string;
    newStatus: FacilityStatus;
  }>({ isOpen: false, facilityId: '', facilityName: '', newStatus: 'active' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFacilities = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '10',
      };
      if (search) params.search = search;
      if (status) params.status = status;

      const res = await facilitiesApi.list(params);
      setFacilities(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat fasilitas');
    } finally {
      setIsLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleStatusChange = async () => {
    setActionLoading(true);
    try {
      await facilitiesApi.update(confirmModal.facilityId, {
        status: confirmModal.newStatus,
      });
      setSuccessMessage(
        `Status "${confirmModal.facilityName}" berhasil diubah ke ${facilityStatusLabel(confirmModal.newStatus)}`
      );
      setConfirmModal({ isOpen: false, facilityId: '', facilityName: '', newStatus: 'active' });
      fetchFacilities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Status Fasilitas</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tandai fasilitas sebagai &quot;Dalam Perbaikan&quot; atau kembalikan ke &quot;Aktif&quot;.
        </p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Cari fasilitas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            id="petugas-facility-search"
          />
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            id="petugas-facility-status"
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
                    {fac.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setConfirmModal({
                            isOpen: true,
                            facilityId: fac.id,
                            facilityName: fac.name,
                            newStatus: 'under_maintenance',
                          })
                        }
                      >
                        🔧 Tandai Perbaikan
                      </Button>
                    )}
                    {fac.status === 'under_maintenance' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          setConfirmModal({
                            isOpen: true,
                            facilityId: fac.id,
                            facilityName: fac.name,
                            newStatus: 'active',
                          })
                        }
                      >
                        ✅ Selesai Perbaikan
                      </Button>
                    )}
                    {fac.status === 'inactive' && (
                      <span className="text-xs text-gray-400">
                        Dinonaktifkan oleh Admin
                      </span>
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, facilityId: '', facilityName: '', newStatus: 'active' })
        }
        title="Konfirmasi Perubahan Status"
        size="sm"
      >
        <div>
          <p className="text-sm text-gray-700 mb-4">
            Apakah Anda yakin ingin mengubah status fasilitas{' '}
            <strong>{confirmModal.facilityName}</strong> menjadi{' '}
            <Badge className={facilityStatusColor(confirmModal.newStatus)}>
              {facilityStatusLabel(confirmModal.newStatus)}
            </Badge>
            ?
          </p>

          {confirmModal.newStatus === 'under_maintenance' && (
            <Alert type="warning" className="mb-4">
              Semua slot reservasi pada fasilitas ini akan menjadi tidak tersedia selama
              status &quot;Dalam Perbaikan&quot;.
            </Alert>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                setConfirmModal({
                  isOpen: false,
                  facilityId: '',
                  facilityName: '',
                  newStatus: 'active',
                })
              }
            >
              Batal
            </Button>
            <Button
              variant={confirmModal.newStatus === 'under_maintenance' ? 'danger' : 'primary'}
              onClick={handleStatusChange}
              isLoading={actionLoading}
            >
              Ya, Ubah Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
