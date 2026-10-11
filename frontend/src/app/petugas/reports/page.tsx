'use client';

import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import {
  Spinner,
  Alert,
  Badge,
  Card,
  Pagination,
  Button,
  Modal,
  Textarea,
  Table,
  Select,
  ErrorModal,
  useErrorPopup,
} from '@/components/ui';
import type { PaginatedResponse, Report } from '@/types';
import {
  formatDateTime,
  reportStatusLabel,
  reportStatusColor,
  reportCategoryLabel,
} from '@/lib/utils';

export default function PetugasReportsPage() {
  const { errorPopup, triggerErrorPopup, closeErrorPopup } = useErrorPopup();
  const [reports, setReports] = useState<PaginatedResponse<Report> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'in_progress' | 'resolved' | 'rejected' | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchReports = () => {
    setIsLoading(true);
    setError('');

    const params: Record<string, string> = {
      page: String(page),
      limit: '10',
    };
    if (statusFilter) params.status = statusFilter;

    reportsApi
      .list(params)
      .then((res) => setReports(res))
      .catch((err) => {
        const isConn =
          err instanceof Error &&
          (err.name === 'ConnectionError' ||
            err.message.toLowerCase().includes('terhubung') ||
            err.message.toLowerCase().includes('koneksi') ||
            err.message.toLowerCase().includes('network') ||
            err.message.toLowerCase().includes('failed to fetch'));
        const msg = err instanceof Error ? err.message : 'Gagal memuat laporan.';
        setError(msg);
        if (isConn) {
          triggerErrorPopup('Gangguan Koneksi Jaringan', msg, true);
        }
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleActionClick = (
    report: Report,
    type: 'in_progress' | 'resolved' | 'rejected'
  ) => {
    setSelectedReport(report);
    setActionType(type);
    setResolutionNote('');
    setActionError('');
    setIsModalOpen(true);
  };

  const handleProcess = async () => {
    if (!selectedReport || !actionType) return;
    setActionError('');

    if ((actionType === 'resolved' || actionType === 'rejected') && !resolutionNote.trim()) {
      const msg = 'Catatan resolusi atau alasan penolakan wajib diisi.';
      setActionError(msg);
      triggerErrorPopup('Validasi Input', msg);
      return;
    }

    setIsSubmitting(true);
    try {
      await reportsApi.updateStatus(selectedReport.id, {
        status: actionType,
        resolutionNote: resolutionNote.trim() || undefined,
      });

      setIsModalOpen(false);
      setSelectedReport(null);
      setActionType(null);
      fetchReports();
    } catch (err) {
      const isConn =
        err instanceof Error &&
        (err.name === 'ConnectionError' ||
          err.message.toLowerCase().includes('terhubung') ||
          err.message.toLowerCase().includes('koneksi') ||
          err.message.toLowerCase().includes('network') ||
          err.message.toLowerCase().includes('failed to fetch'));
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses laporan.';
      setActionError(msg);
      triggerErrorPopup(isConn ? 'Gangguan Koneksi Jaringan' : 'Gagal Memproses Laporan', msg, isConn);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'new_report', label: 'Baru' },
    { value: 'in_progress', label: 'Sedang Ditangani' },
    { value: 'resolved', label: 'Selesai' },
    { value: 'rejected', label: 'Ditolak' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Laporan Kerusakan</h1>
        <p className="mt-1 text-sm text-gray-600">
          Kelola dan tindak lanjuti laporan kerusakan fasilitas dari pengguna.
        </p>
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={statusOptions}
            placeholder="Semua Status"
          />
          <Button variant="outline" size="sm" onClick={fetchReports} className="ml-2">
            Refresh
          </Button>
          {reports && (
            <span className="text-sm text-gray-500 ml-auto font-medium">
              Total: {reports.meta.total} Laporan
            </span>
          )}
        </div>
      </Card>

      {error && <Alert type="error" className="mb-6">{error}</Alert>}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <Table
            headers={['Tanggal / Pelapor', 'Fasilitas / Kategori', 'Deskripsi', 'Status', 'Aksi']}
            isEmpty={!reports?.data.length}
            emptyMessage="Tidak ada laporan kerusakan ditemukan."
          >
            {reports?.data.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDateTime(report.createdAt)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {report.user?.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {report.facility?.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {reportCategoryLabel(report.category)}
                  </div>
                </td>
                <td className="px-6 py-4 max-w-xs sm:max-w-sm md:max-w-md">
                  <div className="text-sm text-gray-900 break-words [overflow-wrap:anywhere] whitespace-pre-wrap leading-relaxed" title={report.description}>
                    {report.description}
                  </div>
                  {report.photoUrl && (
                    <a
                      href={report.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                    >
                      Lihat Foto
                    </a>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={reportStatusColor(report.status)}>
                    {reportStatusLabel(report.status)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {report.status === 'new_report' && (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActionClick(report, 'in_progress')}
                      >
                        Tindak Lanjuti
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleActionClick(report, 'rejected')}
                      >
                        Tolak
                      </Button>
                    </div>
                  )}
                  {report.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleActionClick(report, 'resolved')}
                      className="bg-green-600 hover:bg-green-700 ring-green-500"
                    >
                      Tandai Selesai
                    </Button>
                  )}
                  {(report.status === 'resolved' || report.status === 'rejected') && (
                    <span className="text-gray-400 text-xs italic">
                      Diproses oleh {report.processor?.name || '-'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </Table>

          <div className="mt-4">
            <Pagination
              page={page}
              totalPages={reports?.meta.totalPages || 1}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* Action Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={
          actionType === 'in_progress'
            ? 'Mulai Penanganan Laporan'
            : actionType === 'resolved'
            ? 'Selesaikan Penanganan'
            : 'Tolak Laporan'
        }
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900 break-words [overflow-wrap:anywhere]">{selectedReport?.facility?.name}</p>
            <p className="text-xs text-gray-500 mt-1 break-words [overflow-wrap:anywhere] whitespace-pre-wrap leading-relaxed">{selectedReport?.description}</p>
          </div>

          {actionType === 'in_progress' && (
            <p className="text-sm text-gray-700">
              Apakah Anda yakin ingin memulai penanganan laporan ini? Status laporan akan berubah menjadi
              &quot;Sedang Ditangani&quot;.
              {selectedReport?.category === 'kerusakan_berat' && (
                <span className="block mt-2 font-medium text-orange-600 bg-orange-50 p-2 rounded">
                  Perhatian: Laporan ini adalah kerusakan berat. Fasilitas akan otomatis diubah statusnya menjadi &quot;Dalam Perbaikan&quot;.
                </span>
              )}
            </p>
          )}

          {(actionType === 'resolved' || actionType === 'rejected') && (
            <Textarea
              label="Catatan Resolusi"
              required
              placeholder={`Masukkan alasan penolakan atau catatan penyelesaian...`}
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              rows={4}
              id="resolution-note"
            />
          )}

          {actionError && <Alert type="error">{actionError}</Alert>}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleProcess}
              isLoading={isSubmitting}
              variant={actionType === 'rejected' ? 'danger' : 'primary'}
            >
              {actionType === 'in_progress'
                ? 'Mulai Penanganan'
                : actionType === 'resolved'
                ? 'Tandai Selesai'
                : 'Tolak Laporan'}
            </Button>
          </div>
        </div>
      </Modal>

      <ErrorModal
        isOpen={errorPopup.isOpen}
        onClose={closeErrorPopup}
        title={errorPopup.title}
        message={errorPopup.message}
        isConnectionError={errorPopup.isConnectionError}
      />
    </div>
  );
}
