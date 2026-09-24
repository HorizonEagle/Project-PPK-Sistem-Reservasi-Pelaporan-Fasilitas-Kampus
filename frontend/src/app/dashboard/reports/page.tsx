'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { Spinner, Alert, Badge, Card, Pagination, EmptyState, Button } from '@/components/ui';
import type { PaginatedResponse, Report } from '@/types';
import {
  formatDateTime,
  reportStatusLabel,
  reportStatusColor,
  reportCategoryLabel,
} from '@/lib/utils';

export default function UserReportsPage() {
  const [reports, setReports] = useState<PaginatedResponse<Report> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
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
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [page, statusFilter]);

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'new_report', label: 'Baru' },
    { value: 'in_progress', label: 'Sedang Ditangani' },
    { value: 'resolved', label: 'Selesai' },
    { value: 'rejected', label: 'Ditolak' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Saya</h1>
          <p className="mt-1 text-sm text-gray-600">
            Pantau status laporan kerusakan fasilitas yang Anda buat.
          </p>
        </div>
        <Link href="/dashboard/reports/new">
          <Button leftIcon={<span>➕</span>}>Buat Laporan</Button>
        </Link>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {reports && (
            <span className="text-sm text-gray-500 ml-auto">
              {reports.meta.total} laporan ditemukan
            </span>
          )}
        </div>
      </Card>

      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !reports?.data.length ? (
        <Card>
          <EmptyState
            title="Belum ada laporan"
            description="Anda belum pernah membuat laporan kerusakan fasilitas."
            icon={<span className="text-5xl">📝</span>}
            action={
              <Link href="/dashboard/reports/new">
                <Button>Buat Laporan Pertama</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {reports.data.map((report) => (
              <Link key={report.id} href={`/dashboard/reports/${report.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={reportStatusColor(report.status)}>
                          {reportStatusLabel(report.status)}
                        </Badge>
                        <Badge className="bg-gray-100 text-gray-700">
                          {reportCategoryLabel(report.category)}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {report.facility?.name || 'Fasilitas'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                        {report.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>📍 {report.facility?.location}</span>
                        <span>🕐 {formatDateTime(report.createdAt)}</span>
                      </div>
                    </div>
                    <span className="text-gray-400 ml-4 text-lg">→</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={reports.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
