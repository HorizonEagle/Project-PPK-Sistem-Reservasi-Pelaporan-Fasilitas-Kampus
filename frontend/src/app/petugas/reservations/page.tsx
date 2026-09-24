'use client';

import { useEffect, useState, useCallback } from 'react';
import { reservationsApi } from '@/lib/api';
import {
  Card,
  Badge,
  Button,
  Spinner,
  Table,
  Select,
  Pagination,
  Alert,
  Modal,
  Textarea,
  EmptyState,
} from '@/components/ui';
import {
  reservationStatusLabel,
  reservationStatusColor,
  facilityTypeLabel,
  formatDate,
  formatTime,
  formatDateTime,
} from '@/lib/utils';
import type { Reservation, PaginatedResponse } from '@/types';

const STATUS_OPTIONS = [
  { value: 'pending', label: '⏳ Menunggu (Antrian)' },
  { value: '', label: 'Semua Status' },
  { value: 'approved', label: '✅ Disetujui' },
  { value: 'rejected', label: '❌ Ditolak' },
  { value: 'cancelled_by_user', label: '🚫 Dibatalkan (User)' },
  { value: 'cancelled_by_admin', label: '⚠️ Dibatalkan (Petugas)' },
];

export default function PetugasReservationsPage() {
  const [reservations, setReservations] = useState<PaginatedResponse<Reservation> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);

  // Action modals
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Fetch reservations
  const fetchReservations = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '10',
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

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ─── Action handlers ────────────────────────────────────────────────────────

  const handleApprove = async (reservation: Reservation) => {
    setActionLoading(true);
    setActionError('');

    try {
      await reservationsApi.updateStatus(reservation.id, {
        status: 'approved',
      });
      setSuccessMessage(
        `Reservasi "${reservation.facility?.name}" oleh ${reservation.user?.name} berhasil disetujui.`
      );
      fetchReservations();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal menyetujui reservasi'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReservation) return;
    setActionLoading(true);
    setActionError('');

    try {
      await reservationsApi.updateStatus(selectedReservation.id, {
        status: 'rejected',
        rejectionReason,
      });
      setSuccessMessage('Reservasi berhasil ditolak.');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedReservation(null);
      fetchReservations();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal menolak reservasi'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelByOfficer = async () => {
    if (!selectedReservation) return;
    setActionLoading(true);
    setActionError('');

    try {
      await reservationsApi.cancel(
        selectedReservation.id,
        cancellationReason
      );
      setSuccessMessage('Reservasi berhasil dibatalkan.');
      setShowCancelModal(false);
      setCancellationReason('');
      setSelectedReservation(null);
      fetchReservations();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal membatalkan reservasi'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Antrian Reservasi</h1>
        <p className="mt-1 text-sm text-gray-600">
          Kelola dan proses permintaan reservasi fasilitas kampus.
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
      {actionError && !showRejectModal && !showCancelModal && (
        <div className="mb-4">
          <Alert type="error">{actionError}</Alert>
        </div>
      )}

      {/* Filter */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            id="petugas-reservation-status-filter"
          />
          {reservations && (
            <span className="text-sm text-gray-500">
              {reservations.meta.total} reservasi ditemukan
            </span>
          )}
        </div>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : !reservations?.data.length ? (
        <EmptyState
          title="Tidak ada reservasi"
          description={
            status === 'pending'
              ? 'Tidak ada reservasi yang menunggu persetujuan saat ini.'
              : 'Tidak ada reservasi ditemukan dengan filter ini.'
          }
          icon={<span className="text-5xl">📅</span>}
        />
      ) : (
        <>
          <Table
            headers={[
              'Pemohon',
              'Fasilitas',
              'Tanggal & Waktu',
              'Tujuan',
              'Status',
              'Aksi',
            ]}
            isEmpty={!reservations.data.length}
          >
            {reservations.data.map((res) => (
              <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {res.user?.name || '-'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {res.user?.email || '-'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {res.facility?.name || '-'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {res.facility?.location}
                    {res.facility?.type && (
                      <span className="ml-1">
                        · {facilityTypeLabel(res.facility.type)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">
                    {formatDate(res.date)}
                  </div>
                  <div className="text-xs text-gray-500">
                    🕐 {formatTime(res.startTime)} – {formatTime(res.endTime)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs text-gray-600 line-clamp-2 max-w-[200px]">
                    {res.purpose}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Badge className={reservationStatusColor(res.status)}>
                    {reservationStatusLabel(res.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {/* Detail button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedReservation(res);
                        setShowDetailModal(true);
                      }}
                    >
                      🔍 Detail
                    </Button>

                    {/* Action buttons for pending */}
                    {res.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprove(res)}
                          disabled={actionLoading}
                        >
                          ✅
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedReservation(res);
                            setRejectionReason('');
                            setActionError('');
                            setShowRejectModal(true);
                          }}
                        >
                          ❌
                        </Button>
                      </div>
                    )}

                    {/* Cancel button for approved */}
                    {res.status === 'approved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReservation(res);
                          setCancellationReason('');
                          setActionError('');
                          setShowCancelModal(true);
                        }}
                      >
                        ⚠️ Cancel
                      </Button>
                    )}
                  </div>
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

      {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedReservation(null);
        }}
        title="Detail Reservasi"
        size="lg"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Pemohon
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {selectedReservation.user?.name}
                </p>
                <p className="text-xs text-gray-400">
                  {selectedReservation.user?.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Status
                </p>
                <Badge
                  className={`mt-1 ${reservationStatusColor(
                    selectedReservation.status
                  )}`}
                >
                  {reservationStatusLabel(selectedReservation.status)}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Fasilitas
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {selectedReservation.facility?.name}
                </p>
                <p className="text-xs text-gray-400">
                  📍 {selectedReservation.facility?.location}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Jadwal
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {formatDate(selectedReservation.date)}
                </p>
                <p className="text-xs text-gray-500">
                  🕐 {formatTime(selectedReservation.startTime)} –{' '}
                  {formatTime(selectedReservation.endTime)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">
                Tujuan Penggunaan
              </p>
              <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg">
                {selectedReservation.purpose}
              </p>
            </div>

            {selectedReservation.rejectionReason && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Alasan Penolakan
                </p>
                <p className="text-sm text-red-700 mt-1 bg-red-50 p-3 rounded-lg">
                  {selectedReservation.rejectionReason}
                </p>
              </div>
            )}

            {selectedReservation.cancellationReason && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Alasan Pembatalan
                </p>
                <p className="text-sm text-orange-700 mt-1 bg-orange-50 p-3 rounded-lg">
                  {selectedReservation.cancellationReason}
                </p>
              </div>
            )}

            {selectedReservation.processor && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">
                  Diproses oleh
                </p>
                <p className="text-sm text-gray-900 mt-0.5">
                  {selectedReservation.processor.name}
                  {selectedReservation.processedAt && (
                    <span className="text-gray-400 ml-2">
                      pada {formatDateTime(selectedReservation.processedAt)}
                    </span>
                  )}
                </p>
              </div>
            )}

            <p className="text-xs text-gray-400">
              Diajukan: {formatDateTime(selectedReservation.createdAt)}
            </p>
          </div>
        )}
      </Modal>

      {/* ── Reject Modal ──────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedReservation(null);
        }}
        title="Tolak Reservasi"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-gray-900">
                {selectedReservation.facility?.name} — {selectedReservation.user?.name}
              </p>
              <p className="text-gray-500 mt-1">
                {formatDate(selectedReservation.date)} ·{' '}
                {formatTime(selectedReservation.startTime)} –{' '}
                {formatTime(selectedReservation.endTime)}
              </p>
            </div>

            <Textarea
              label="Alasan Penolakan"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Jelaskan alasan penolakan reservasi ini (minimal 5 karakter)..."
              required
              id="rejection-reason"
              error={
                rejectionReason.length > 0 && rejectionReason.length < 5
                  ? 'Minimal 5 karakter'
                  : undefined
              }
            />

            {actionError && <Alert type="error">{actionError}</Alert>}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedReservation(null);
                }}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                isLoading={actionLoading}
                disabled={rejectionReason.length < 5}
              >
                Tolak Reservasi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Cancel Modal (Petugas) ────────────────────────────────────────────── */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedReservation(null);
        }}
        title="Batalkan Reservasi (Darurat)"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <Alert type="warning">
              Anda akan membatalkan reservasi yang sudah disetujui. Tindakan ini
              hanya untuk kondisi darurat.
            </Alert>

            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <p className="font-medium text-gray-900">
                {selectedReservation.facility?.name} — {selectedReservation.user?.name}
              </p>
              <p className="text-gray-500 mt-1">
                {formatDate(selectedReservation.date)} ·{' '}
                {formatTime(selectedReservation.startTime)} –{' '}
                {formatTime(selectedReservation.endTime)}
              </p>
            </div>

            <Textarea
              label="Alasan Pembatalan (Wajib)"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Jelaskan alasan pembatalan darurat ini (minimal 5 karakter)..."
              required
              id="cancellation-reason"
              error={
                cancellationReason.length > 0 && cancellationReason.length < 5
                  ? 'Minimal 5 karakter'
                  : undefined
              }
            />

            {actionError && <Alert type="error">{actionError}</Alert>}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedReservation(null);
                }}
              >
                Kembali
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelByOfficer}
                isLoading={actionLoading}
                disabled={cancellationReason.length < 5}
              >
                Batalkan Reservasi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
