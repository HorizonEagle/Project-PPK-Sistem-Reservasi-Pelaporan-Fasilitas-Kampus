'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { reportsApi } from '@/lib/api';
import { Spinner, Alert, Badge, Card } from '@/components/ui';
import type { Report } from '@/types';
import {
  formatDateTime,
  reportStatusLabel,
  reportStatusColor,
  reportCategoryLabel,
} from '@/lib/utils';

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reportId) return;

    setIsLoading(true);
    reportsApi
      .get(reportId)
      .then((res) => setReport(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [reportId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Alert type="error">{error}</Alert>
        <Link
          href="/dashboard/reports"
          className="text-sm text-blue-600 hover:underline mt-4 inline-block"
        >
          ← Kembali ke Laporan Saya
        </Link>
      </div>
    );
  }

  if (!report) return null;

  // Status progress steps
  const steps = [
    { key: 'new_report', label: 'Baru', icon: '📝' },
    { key: 'in_progress', label: 'Ditangani', icon: '🔧' },
    { key: 'resolved', label: 'Selesai', icon: '✅' },
  ];

  const statusOrder = ['new_report', 'in_progress', 'resolved'];
  const currentIndex = statusOrder.indexOf(report.status);
  const isRejected = report.status === 'rejected';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard/reports"
        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mb-4"
      >
        ← Kembali ke Laporan Saya
      </Link>

      <Card className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Detail Laporan Kerusakan
            </h1>
            <p className="text-xs text-gray-500 mt-1">ID: {report.id}</p>
          </div>
          <Badge className={reportStatusColor(report.status)}>
            {reportStatusLabel(report.status)}
          </Badge>
        </div>

        {/* Progress Tracker */}
        {!isRejected && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isCompleted = currentIndex >= index;
                const isCurrent = currentIndex === index;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-colors ${
                        isCompleted
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      } ${isCurrent ? 'ring-2 ring-blue-200' : ''}`}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
                        isCompleted ? 'text-blue-700' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div
                        className={`absolute h-0.5 w-full ${
                          currentIndex > index ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                        style={{ display: 'none' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rejected banner */}
        {isRejected && (
          <Alert type="error" className="mb-4">
            Laporan ini telah ditolak oleh petugas.
          </Alert>
        )}

        {/* Report Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fasilitas
              </label>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {report.facility?.name}
              </p>
              <p className="text-xs text-gray-500">
                📍 {report.facility?.location}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kategori
              </label>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {reportCategoryLabel(report.category)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal Laporan
              </label>
              <p className="text-sm text-gray-900 mt-0.5">
                {formatDateTime(report.createdAt)}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diperbarui
              </label>
              <p className="text-sm text-gray-900 mt-0.5">
                {formatDateTime(report.updatedAt)}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Deskripsi
            </label>
            <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
              {report.description}
            </p>
          </div>

          {report.photoUrl && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Foto
              </label>
              <div className="mt-1">
                <img
                  src={report.photoUrl}
                  alt="Foto kerusakan"
                  className="rounded-lg max-h-64 object-cover border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}

          {/* Resolution info */}
          {(report.resolutionNote || report.processor) && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Informasi Penanganan
              </h3>
              {report.processor && (
                <div className="mb-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diproses Oleh
                  </label>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {report.processor.name}
                  </p>
                </div>
              )}
              {report.processedAt && (
                <div className="mb-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Diproses
                  </label>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {formatDateTime(report.processedAt)}
                  </p>
                </div>
              )}
              {report.resolutionNote && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Catatan Resolusi
                  </label>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap bg-green-50 p-3 rounded-lg border border-green-100">
                    {report.resolutionNote}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
