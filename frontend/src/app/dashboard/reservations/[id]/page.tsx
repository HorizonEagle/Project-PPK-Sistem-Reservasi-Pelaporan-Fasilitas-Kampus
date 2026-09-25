'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { reservationsApi } from '@/lib/api';
import { Card, Badge, Button, Spinner, Alert, Modal, Textarea } from '@/components/ui';
import {
  reservationStatusLabel,
  reservationStatusColor,
  facilityTypeLabel,
  formatDate,
  formatTime,
  formatDateTime,
} from '@/lib/utils';
import type { Reservation } from '@/types';

export default function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Fetch reservation detail
  useEffect(() => {
    setIsLoading(true);
    setError('');

    reservationsApi
      .get(id)
      .then((res) => setReservation(res.data))
      .catch((err) => setError(err.message || 'Gagal memuat reservasi'))
      .finally(() => setIsLoading(false));
  }, [id]);

  // Auto-hide success message
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  // Cancel handler
  const handleCancel = async () => {
    setCancelLoading(true);
    setActionError('');

    try {
      await reservationsApi.cancel(id, cancelReason || undefined);
      setActionSuccess('Reservasi berhasil dibatalkan.');
      setShowCancelModal(false);
      setCancelReason('');

      // Refresh data
      const res = await reservationsApi.get(id);
      setReservation(res.data);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal membatalkan reservasi'
      );
    } finally {
      setCancelLoading(false);
    }
  };

  // Duration calculation
  function calcDuration(start: string, end: string): string {
    const toMin = (t: string) => {
      const formatted = formatTime(t);
      const [h, m] = formatted.split(':').map(Number);
      return h * 60 + m;
    };
    const totalMin = toMin(end) - toMin(start);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h} jam${m > 0 ? ` ${m} menit` : ''}` : `${m} menit`;
  }

  // Can cancel?
  const canCancel =
    reservation &&
    (reservation.status === 'pending' || reservation.status === 'approved');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16">
        <Alert type="error" title="Error">
          {error || 'Reservasi tidak ditemukan'}
        </Alert>
        <div className="mt-4">
          <Link
            href="/dashboard/reservations"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Kembali ke daftar reservasi
          </Link>
        </div>
      </div>
    );
  }

  // Status icon
  const statusIcons: Record<string, string> = {
    pending: '⏳',
    approved: '✅',
    rejected: '❌',
    cancelled_by_user: '🚫',
    cancelled_by_admin: '⚠️',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/dashboard/reservations"
        className="text-blue-600 hover:underline text-sm mb-4 inline-block"
      >
        ← Kembali ke Reservasi Saya
      </Link>

      {/* Messages */}
      {actionSuccess && (
        <div className="mb-4">
          <Alert type="success">{actionSuccess}</Alert>
        </div>
      )}
      {actionError && (
        <div className="mb-4">
          <Alert type="error">{actionError}</Alert>
        </div>
      )}

      {/* Header card */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">
                {statusIcons[reservation.status] || '📅'}
              </span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Detail Reservasi
                </h1>
                <p className="text-sm text-gray-500">
                  ID: {reservation.id.slice(0, 12)}...
                </p>
              </div>
            </div>
          </div>
          <Badge
            className={`text-sm px-3 py-1.5 ${reservationStatusColor(
              reservation.status
            )}`}
          >
            {reservationStatusLabel(reservation.status)}
          </Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info Fasilitas */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            🏛️ Fasilitas
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Nama
              </dt>
              <dd className="text-sm text-gray-900 mt-0.5 font-medium">
                {reservation.facility?.name || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Lokasi
              </dt>
              <dd className="text-sm text-gray-900 mt-0.5">
                📍 {reservation.facility?.location || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Tipe
              </dt>
              <dd className="text-sm text-gray-900 mt-0.5">
                {reservation.facility?.type
                  ? facilityTypeLabel(reservation.facility.type)
                  : '-'}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Info Waktu */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            📅 Jadwal
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Tanggal
              </dt>
              <dd className="text-sm text-gray-900 mt-0.5 font-medium">
                {formatDate(reservation.date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Waktu
              </dt>
              <dd className="text-sm text-gray-900 mt-0.5">
                🕐 {formatTime(reservation.startTime)} –{' '}
                {formatTime(reservation.endTime)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Durasi
              </dt>
              <dd className="text-sm text-gray-900 mt-0.5">
                {calcDuration(reservation.startTime, reservation.endTime)}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Tujuan */}
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            📝 Tujuan Penggunaan
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {reservation.purpose}
          </p>
        </Card>

        {/* Status history / Processing info */}
        {(reservation.rejectionReason ||
          reservation.cancellationReason ||
          reservation.processor) && (
          <Card className="lg:col-span-2">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              📌 Informasi Pemrosesan
            </h2>
            <dl className="space-y-3">
              {reservation.processor && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Diproses oleh
                  </dt>
                  <dd className="text-sm text-gray-900 mt-0.5">
                    {reservation.processor.name}
                  </dd>
                </div>
              )}
              {reservation.processedAt && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Tanggal diproses
                  </dt>
                  <dd className="text-sm text-gray-900 mt-0.5">
                    {formatDateTime(reservation.processedAt)}
                  </dd>
                </div>
              )}
              {reservation.rejectionReason && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Alasan Penolakan
                  </dt>
                  <dd className="text-sm text-red-700 mt-0.5 bg-red-50 p-3 rounded-lg">
                    {reservation.rejectionReason}
                  </dd>
                </div>
              )}
              {reservation.cancellationReason && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Alasan Pembatalan
                  </dt>
                  <dd className="text-sm text-orange-700 mt-0.5 bg-orange-50 p-3 rounded-lg">
                    {reservation.cancellationReason}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        )}

        {/* Timestamps */}
        <Card className="lg:col-span-2">
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <span>Dibuat: {formatDateTime(reservation.createdAt)}</span>
            <span>Terakhir diperbarui: {formatDateTime(reservation.updatedAt)}</span>
          </div>
        </Card>
      </div>

      {/* Actions */}
      {canCancel && (
        <div className="mt-6 flex justify-end">
          <Button
            variant="danger"
            onClick={() => setShowCancelModal(true)}
          >
            🚫 Batalkan Reservasi
          </Button>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Batalkan Reservasi"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Apakah Anda yakin ingin membatalkan reservasi ini? Tindakan ini
            tidak bisa dibatalkan.
          </p>

          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-gray-900">
              {reservation.facility?.name}
            </p>
            <p className="text-gray-500">
              {formatDate(reservation.date)} · {formatTime(reservation.startTime)}{' '}
              – {formatTime(reservation.endTime)}
            </p>
          </div>

          <Textarea
            label="Alasan Pembatalan (opsional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Jelaskan alasan pembatalan..."
            id="cancel-reservation-reason"
          />

          {actionError && <Alert type="error">{actionError}</Alert>}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowCancelModal(false)}
            >
              Kembali
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              isLoading={cancelLoading}
            >
              Ya, Batalkan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
