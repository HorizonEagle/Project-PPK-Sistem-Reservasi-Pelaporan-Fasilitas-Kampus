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

  // Facility image helper
  const facilityImages: Record<string, string> = {
    classroom: '/facilities/classroom.jpg',
    laboratory: '/facilities/laboratory.jpg',
    auditorium: '/facilities/auditorium.jpg',
    field: '/facilities/field.jpg',
    equipment: '/facilities/equipment.jpg',
  };
  const getFacilityImage = (t: string) => facilityImages[t] || '/facilities/default.jpg';

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
                    className="overflow-hidden hover:shadow-card transition-all duration-300 group-hover:-translate-y-0.5 border border-line"
                  >
                    {/* Visual header with horizontal photo */}
                    <div className="relative w-full aspect-[16/9] overflow-hidden bg-canvas">
                      <img
                        src={getFacilityImage(facility.type)}
                        alt={facility.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute top-3 right-3">
                        <Badge className={facilityStatusColor(facility.status)}>
                          {facilityStatusLabel(facility.status)}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2.5 left-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface/90 text-ink backdrop-blur-xs shadow-xs border border-white/20">
                          {facilityTypeLabel(facility.type)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold font-heading text-ink text-base mb-2 group-hover:text-primary-600 transition-colors truncate">
                        {facility.name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-ink-muted">
                        <span className="flex items-center gap-1.5 truncate">
                          <svg className="w-3.5 h-3.5 flex-shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {facility.location}
                        </span>
                        <span className="flex items-center gap-1.5 flex-shrink-0">
                          <svg className="w-3.5 h-3.5 flex-shrink-0 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {facility.capacity} orang
                        </span>
                      </div>
                      {facility.description && (
                        <p className="text-xs text-ink-muted mt-2 line-clamp-2">
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
