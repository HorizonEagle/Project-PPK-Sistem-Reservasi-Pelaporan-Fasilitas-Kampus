'use client';

import React from 'react';
import { Modal, Button } from './index';

export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  isConnectionError?: boolean;
}

export function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  isConnectionError = false,
}: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (isConnectionError ? 'Gangguan Koneksi Jaringan' : 'Terjadi Kesalahan')}
      size="md"
    >
      <div className="space-y-4" data-testid="error-popup-modal">
        <div className="flex items-start gap-3.5 p-4 bg-red-50/90 rounded-xl border border-red-200/90 text-red-950">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0 text-red-600 shadow-xs">
            {isConnectionError ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-5.657-2.828m0 0l2.829-2.829M3 3l18 18"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-red-900 font-heading">
              {isConnectionError
                ? 'Koneksi ke Server Terputus'
                : 'Permintaan Gagal Diproses'}
            </h4>
            <p className="text-xs text-red-800 mt-1 leading-relaxed break-words font-medium">
              {message || 'Terjadi kesalahan sistem yang tidak terduga. Silakan coba lagi.'}
            </p>
          </div>
        </div>

        {isConnectionError ? (
          <div className="p-3.5 bg-amber-50/80 rounded-lg border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
            <strong>Langkah Pemeriksaan Koneksi:</strong>
            <ul className="list-disc list-inside mt-1.5 space-y-1 text-amber-800">
              <li>Periksa koneksi internet perangkat Anda.</li>
              <li>Pastikan backend server sedang berjalan di port 3001.</li>
              <li>Bila kendala berlanjut, silakan hubungi tim administrator kampus.</li>
            </ul>
          </div>
        ) : (
          <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
            <strong>Pemberitahuan Sistem:</strong>
            <p className="mt-0.5 text-blue-800">
              Silakan periksa kembali formulir atau informasi yang Anda masukkan, kemudian coba beberapa saat lagi.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
          >
            Tutup Popup
          </Button>
        </div>
      </div>
    </Modal>
  );
}
