'use client';

import React, { useState, useRef, useEffect } from 'react';
import { uploadApi } from '@/lib/api';
import { Button, Alert, Spinner } from '@/components/ui';

interface FacilityImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  facilityType?: string;
  facilityName?: string;
  onError?: (title: string, message: string) => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB standar
const MAX_FILE_SIZE_MB = 5;

export function FacilityImageUploader({
  value,
  onChange,
  facilityType = 'classroom',
  facilityName = 'Nama Fasilitas',
  onError,
}: FacilityImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [overfitFile, setOverfitFile] = useState<File | null>(null);

  // Visual fitting settings (saved in state for preview / adjustment)
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const [focusPosition, setFocusPosition] = useState<'center' | 'top' | 'bottom'>('center');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value && value !== urlInput) {
      setUrlInput(value);
    }
  }, [value]);

  // Compress/adjust image that exceeds 5MB using HTML5 Canvas
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if dimension is very large (e.g. max 1920px width)
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width / height > MAX_WIDTH / MAX_HEIGHT) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            } else {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Gagal memproses canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP or JPEG with quality reduction
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const adjustedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(adjustedFile);
              } else {
                reject(new Error('Gagal mengompres gambar'));
              }
            },
            'image/webp',
            0.82
          );
        };
        img.onerror = () => reject(new Error('Gagal membaca gambar'));
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
    });
  };

  const handleFileSelected = async (file: File) => {
    setUploadError('');
    setOverfitFile(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      const msg = 'Format tidak didukung. Harap pilih gambar format JPG, PNG, WEBP, atau GIF.';
      setUploadError(msg);
      onError?.('Format Gambar Tidak Valid', msg);
      return;
    }

    // Check size overfitting (> 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const actualSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setOverfitFile(file);
      const msg = `Ukuran file (${actualSizeMB} MB) melebihi batas ketentuan maksimal ${MAX_FILE_SIZE_MB} MB. Gunakan tombol penyesuaian otomatis di bawah untuk mengompres.`;
      setUploadError(msg);
      return;
    }

    // Normal upload
    await uploadFileToServer(file);
  };

  const handleAutoAdjustOverfit = async () => {
    if (!overfitFile) return;
    setIsCompressing(true);
    setUploadError('');

    try {
      const compressed = await compressImage(overfitFile);
      setOverfitFile(null);
      await uploadFileToServer(compressed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyesuaikan foto otomatis';
      setUploadError(msg);
      onError?.('Gagal Mengompres Foto', msg);
    } finally {
      setIsCompressing(false);
    }
  };

  const uploadFileToServer = async (file: File) => {
    setIsUploading(true);
    setUploadError('');

    try {
      const res = await uploadApi.upload(file);
      if (res?.data?.url) {
        onChange(res.data.url);
        setUrlInput(res.data.url);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto ke server';
      setUploadError(msg);
      onError?.('Gagal Mengunggah Foto', msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    setUploadError('');
    if (!urlInput.trim()) {
      onChange('');
      return;
    }

    try {
      new URL(urlInput);
      onChange(urlInput.trim());
    } catch {
      if (urlInput.startsWith('/') || urlInput.startsWith('data:image/')) {
        onChange(urlInput.trim());
      } else {
        const msg = 'Format URL gambar tidak valid. Pastikan diawali dengan http:// atau https://';
        setUploadError(msg);
        onError?.('URL Tidak Valid', msg);
      }
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    setUrlInput('');
    setUploadError('');
    setOverfitFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPositionClass = () => {
    if (focusPosition === 'top') return 'object-top';
    if (focusPosition === 'bottom') return 'object-bottom';
    return 'object-center';
  };

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-gray-900 block">
            Foto Fasilitas
          </label>
          <span className="text-xs text-gray-500">
            Maks. {MAX_FILE_SIZE_MB}MB (JPG, PNG, WEBP). Rasio optimal 16:9.
          </span>
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-8"
          >
            Hapus Foto
          </Button>
        )}
      </div>

      {/* Tabs Input Method */}
      <div className="flex rounded-lg bg-gray-200/70 p-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Unggah Berkas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 rounded-md py-1.5 font-medium transition-all ${
            activeTab === 'url'
              ? 'bg-white text-gray-900 shadow-xs'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tautan URL Gambar
        </button>
      </div>

      {/* Upload Zone */}
      {activeTab === 'upload' ? (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelected(file);
            }}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileSelected(file);
            }}
            className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-xl p-5 text-center transition-all group"
          >
            {isUploading ? (
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <Spinner size="md" />
                <span className="text-xs font-medium text-blue-600">
                  Mengunggah foto fasilitas ke server...
                </span>
              </div>
            ) : isCompressing ? (
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <Spinner size="md" />
                <span className="text-xs font-medium text-indigo-600">
                  Menyesuaikan &amp; mengompres ukuran foto (&lt; 5MB)...
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="mx-auto w-10 h-10 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-800">
                  Klik untuk memilih foto atau seret ke sini
                </p>
                <p className="text-[11px] text-gray-500">
                  Ketentuan: Maksimal 5MB, format JPG, PNG, WEBP
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* URL Input Zone */
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/foto-fasilitas.jpg"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleUrlSubmit}
            className="text-xs"
          >
            Terapkan
          </Button>
        </div>
      )}

      {/* Overfitting Resolution / Compression Action */}
      {overfitFile && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs space-y-2">
          <div className="flex items-start gap-2 text-amber-800 font-medium">
            <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              Foto berukuran {(overfitFile.size / (1024 * 1024)).toFixed(2)} MB (melebihi batas {MAX_FILE_SIZE_MB}MB).
            </span>
          </div>
          <p className="text-amber-700 text-[11px]">
            Foto mengalami <strong>overfitting</strong> ukuran berkas. Anda dapat menyesuaikannya secara otomatis agar langsung pas & dioptimalkan ke standar &lt;5MB.
          </p>
          <div className="pt-1">
            <Button
              type="button"
              size="sm"
              onClick={handleAutoAdjustOverfit}
              isLoading={isCompressing}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 px-3"
            >
              ⚡ Sesuaikan & Kompres Otomatis (&lt; 5MB)
            </Button>
          </div>
        </div>
      )}

      {uploadError && !overfitFile && (
        <Alert type="error" className="text-xs py-2">
          {uploadError}
        </Alert>
      )}

      {/* Visual Adjustment & Live Card Preview */}
      {value && (
        <div className="space-y-3 pt-2 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
              <span>Pratinjau & Penyesuaian Tampilan (Overfitting Fitting)</span>
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Mode Fit:</span>
              <button
                type="button"
                onClick={() => setFitMode('cover')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  fitMode === 'cover'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Cover (Potong Pas)
              </button>
              <button
                type="button"
                onClick={() => setFitMode('contain')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  fitMode === 'contain'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                Contain (Muat Utuh)
              </button>
            </div>
          </div>

          {/* Additional adjustment controls if in cover mode */}
          {fitMode === 'cover' && (
            <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
              <div>
                <label className="text-[11px] font-medium text-gray-600 block mb-1">
                  Posisi Fokus:
                </label>
                <div className="flex gap-1">
                  {(['top', 'center', 'bottom'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setFocusPosition(pos)}
                      className={`flex-1 py-1 rounded text-[10px] font-medium border capitalize ${
                        focusPosition === pos
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      {pos === 'top' ? 'Atas' : pos === 'center' ? 'Tengah' : 'Bawah'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-gray-600 mb-1">
                  <span>Skala Zoom:</span>
                  <span className="text-indigo-600">{zoomLevel.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="1.5"
                  step="0.05"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Live Card Preview (16:9 Aspect Ratio) */}
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-900 border border-gray-300 shadow-inner group">
            <img
              src={value}
              alt="Preview Fasilitas"
              style={{
                transform: fitMode === 'cover' ? `scale(${zoomLevel})` : undefined,
                transition: 'transform 0.2s ease',
              }}
              className={`w-full h-full ${
                fitMode === 'cover' ? 'object-cover' : 'object-contain'
              } ${getPositionClass()}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            <div className="absolute top-2.5 right-2.5 pointer-events-none">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 text-white backdrop-blur-xs shadow-xs">
                Aktif
              </span>
            </div>

            <div className="absolute bottom-2.5 left-3 right-3 text-white pointer-events-none">
              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white/20 backdrop-blur-xs mb-1 uppercase tracking-wider">
                {facilityType}
              </span>
              <p className="text-xs font-bold truncate drop-shadow-sm">
                {facilityName || 'Pratinjau Kartu Fasilitas'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
