'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { facilitiesApi } from '@/lib/api';
import { Card, Badge, Spinner, Input, Select, Pagination, EmptyState } from '@/components/ui';
import { facilityTypeLabel, facilityStatusLabel, facilityStatusColor } from '@/lib/utils';
import type { Facility, PaginatedResponse } from '@/types';

const FACILITY_TYPE_OPTIONS = [
  { value: '', label: 'Semua Tipe' },
  { value: 'classroom', label: 'Ruang Kuliah' },
  { value: 'auditorium', label: 'Aula/Auditorium' },
  { value: 'laboratory', label: 'Laboratorium' },
  { value: 'equipment', label: 'Peralatan' },
  { value: 'field', label: 'Lapangan' },
];

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<PaginatedResponse<Facility> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [capacityMin, setCapacityMin] = useState('');
  const [page, setPage] = useState(1);

  const fetchFacilities = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '12',
      };
      if (search) params.search = search;
      if (type) params.type = type;
      if (capacityMin) params.capacity_min = capacityMin;

      const res = await facilitiesApi.list(params);
      setFacilities(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat fasilitas');
    } finally {
      setIsLoading(false);
    }
  }, [search, type, capacityMin, page]);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, type, capacityMin]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Facility type icon
  const typeIcon = (t: string) => {
    const icons: Record<string, string> = {
      classroom: '🏫',
      auditorium: '🎭',
      laboratory: '🔬',
      equipment: '🔧',
      field: '⚽',
    };
    return icons[t] || '🏛️';
  };

  return (
    <div className="min-h-[80vh]">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Fasilitas Kampus</h1>
          <p className="text-blue-100 text-lg">
            Temukan dan periksa ketersediaan fasilitas kampus yang Anda butuhkan.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-6xl mx-auto px-4 -mt-6 relative z-10">
        <Card className="shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              placeholder="Cari nama, lokasi..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              id="facility-search"
            />
            <Select
              options={FACILITY_TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Semua Tipe"
              id="facility-type-filter"
            />
            <Input
              type="number"
              placeholder="Kapasitas minimum"
              value={capacityMin}
              onChange={(e) => setCapacityMin(e.target.value)}
              min="1"
              id="facility-capacity-filter"
            />
          </div>
        </Card>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="text-center text-red-500 py-4 text-sm">{error}</div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : !facilities?.data.length ? (
          <EmptyState
            title="Tidak ada fasilitas ditemukan"
            description="Coba ubah filter pencarian Anda."
            icon={<span className="text-5xl">🏛️</span>}
          />
        ) : (
          <>
            {/* Count */}
            <p className="text-sm text-gray-500 mb-4">
              Menampilkan {facilities.data.length} dari {facilities.meta.total} fasilitas
            </p>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.data.map((facility) => (
                <Link
                  key={facility.id}
                  href={`/facilities/${facility.id}`}
                  className="group"
                >
                  <Card
                    padding="none"
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:-translate-y-0.5"
                  >
                    {/* Visual header */}
                    <div className="h-36 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center relative">
                      <span className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-300">
                        {typeIcon(facility.type)}
                      </span>
                      <div className="absolute top-3 right-3">
                        <Badge className={facilityStatusColor(facility.status)}>
                          {facilityStatusLabel(facility.status)}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-blue-600 transition-colors">
                        {facility.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-50 text-blue-700 text-[10px]">
                          {facilityTypeLabel(facility.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          📍 {facility.location}
                        </span>
                        <span className="flex items-center gap-1">
                          👥 {facility.capacity} orang
                        </span>
                      </div>
                      {facility.description && (
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                          {facility.description}
                        </p>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {facilities.meta.totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={facilities.meta.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
