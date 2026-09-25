'use client';

import { useEffect, useState } from 'react';
import { dashboardApi, exportApi } from '@/lib/api';
import { Card, Button, Spinner, Alert, Select, Input } from '@/components/ui';
import type { DashboardStats } from '@/types';

export default function AdminReportsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  
  const [exportType, setExportType] = useState<'reservations' | 'reports'>('reservations');
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    dashboardApi
      .getStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleExport = async () => {
    setExportError('');
    setIsExporting(true);
    try {
      await exportApi.download({
        type: exportType,
        format: exportFormat,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Gagal mengekspor data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Rekap & Ekspor</h1>
        <p className="mt-1 text-sm text-gray-600">
          Ringkasan statistik dan ekspor data sistem ke berbagai format.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert type="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-2xl mb-2">📅</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalReservations}</div>
            <div className="text-xs text-gray-600 mt-1">Total Reservasi ({stats.pendingReservations} Pending)</div>
          </Card>
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalReports}</div>
            <div className="text-xs text-gray-600 mt-1">Total Laporan ({stats.newReports} Baru)</div>
          </Card>
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="text-2xl mb-2">🏛️</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalFacilities}</div>
            <div className="text-xs text-gray-600 mt-1">Total Fasilitas ({stats.activeFacilities} Aktif)</div>
          </Card>
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers ?? '—'}</div>
            <div className="text-xs text-gray-600 mt-1">Total Pengguna{stats.pendingUsers ? ` (${stats.pendingUsers} Pending)` : ''}</div>
          </Card>
        </div>
      ) : null}

      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Ekspor Data</h2>
          <p className="text-sm text-gray-600">
            Pilih jenis data, rentang tanggal, dan format file untuk diekspor.
          </p>
        </div>

        {exportError && (
          <div className="mb-4">
            <Alert type="error">{exportError}</Alert>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <Select
              label="Jenis Data"
              options={[
                { value: 'reservations', label: 'Data Reservasi' },
                { value: 'reports', label: 'Data Pelaporan' },
              ]}
              value={exportType}
              onChange={(e) => setExportType(e.target.value as 'reservations' | 'reports')}
              id="export-type"
            />
            <Select
              label="Format File"
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'excel', label: 'Excel (XLSX)' },
                { value: 'pdf', label: 'PDF' },
              ]}
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              id="export-format"
            />
          </div>
          <div className="space-y-4">
            <Input
              label="Dari Tanggal (Opsional)"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              id="export-date-from"
            />
            <Input
              label="Sampai Tanggal (Opsional)"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              id="export-date-to"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <Button
            onClick={handleExport}
            isLoading={isExporting}
            disabled={isExporting}
          >
            ⬇️ Unduh Data
          </Button>
        </div>
      </Card>
    </div>
  );
}
