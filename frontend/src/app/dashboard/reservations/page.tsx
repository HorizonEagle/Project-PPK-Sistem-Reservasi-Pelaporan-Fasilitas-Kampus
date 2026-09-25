'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { reservationsApi } from '@/lib/api';
import {
  Card,
  Badge,
  Button,
  Spinner,
  Table,
  Select,
  Pagination,
  EmptyState,
} from '@/components/ui';
import {
  reservationStatusLabel,
  reservationStatusColor,
  facilityTypeLabel,
  formatDate,
  formatTime,
} from '@/lib/utils';
import type { Reservation, PaginatedResponse } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'cancelled_by_user', label: 'Dibatalkan (Saya)' },
  { value: 'cancelled_by_admin', label: 'Dibatalkan (Petugas)' },
];

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<PaginatedResponse<Reservation> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '10',
        user_id: 'me',
      };
      if (status) params.status = status;

      const res = await reservationsApi.list(params);
      setReservations(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat reservasi');
    } finally {
      setIsLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservasi Saya</h1>
          <p className="mt-1 text-sm text-gray-600">
            Lihat riwayat dan status reservasi fasilitas Anda.
          </p>
        </div>
        <Link href="/dashboard/reservations/new">
          <Button>📅 Ajukan Reservasi Baru</Button>
        </Link>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="Semua Status"
            id="my-reservation-status-filter"
          />
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="text-center text-red-500 py-4 text-sm">{error}</div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : !reservations?.data.length ? (
        <EmptyState
          title="Belum ada reservasi"
          description="Anda belum pernah mengajukan reservasi fasilitas."
          icon={<span className="text-5xl">📅</span>}
          action={
            <Link href="/dashboard/reservations/new">
              <Button>Ajukan Reservasi</Button>
            </Link>
          }
        />
      ) : (
        <>
          <Table
            headers={['Fasilitas', 'Tanggal', 'Waktu', 'Status', 'Aksi']}
            isEmpty={!reservations.data.length}
            emptyMessage="Tidak ada reservasi ditemukan."
          >
            {reservations.data.map((res) => (
              <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm">
                    {res.facility?.name || 'Fasilitas'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {res.facility?.location}
                    {res.facility?.type && (
                      <span className="ml-2">
                        · {facilityTypeLabel(res.facility.type)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(res.date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatTime(res.startTime)} – {formatTime(res.endTime)}
                </td>
                <td className="px-4 py-3">
                  <Badge className={reservationStatusColor(res.status)}>
                    {reservationStatusLabel(res.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/reservations/${res.id}`}>
                    <Button variant="ghost" size="sm">
                      Detail →
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </Table>

          {reservations.meta.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={reservations.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
