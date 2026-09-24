'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import {
  Table,
  Badge,
  Button,
  Input,
  Select,
  Spinner,
  Alert,
  Pagination,
  EmptyState,
} from '@/components/ui';
import {
  userRoleLabel,
  userStatusLabel,
  userStatusColor,
  formatDateTime,
  getErrorMessage,
} from '@/lib/utils';
import type { User, PaginatedResponse } from '@/types';

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [page, setPage] = useState(1);

  // Filter state
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await usersApi.list({
        search,
        role: filterRole || undefined,
        status: filterStatus || undefined,
        page: String(page),
        limit: '10',
      } as Record<string, string>);
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [search, filterRole, filterStatus, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleVerify = async (userId: string, action: 'approve' | 'reject') => {
    setVerifyingId(userId);
    setSuccessMsg('');
    setError('');
    try {
      await usersApi.verify(userId, action);
      setSuccessMsg(
        action === 'approve' ? 'Akun berhasil diverifikasi.' : 'Akun berhasil ditolak.'
      );
      fetchUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Pengguna</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manajemen akun pengguna, petugas, dan verifikasi pendaftaran
          </p>
        </div>
        <Link href="/admin/users/create">
          <Button variant="primary">+ Buat Akun Baru</Button>
        </Link>
      </div>

      {/* Alerts */}
      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert type="success" className="mb-4">
          {successMsg}
        </Alert>
      )}

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <Input
              id="search-users"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            id="filter-role"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={[
              { value: 'user', label: 'Pengguna' },
              { value: 'officer', label: 'Petugas' },
              { value: 'admin', label: 'Admin' },
            ]}
            placeholder="Semua Role"
            className="w-40"
          />
          <Select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'active', label: 'Aktif' },
              { value: 'pending_verification', label: 'Menunggu Verifikasi' },
              { value: 'rejected', label: 'Ditolak' },
            ]}
            placeholder="Semua Status"
            className="w-52"
          />
          <Button type="submit" variant="primary">
            Cari
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch('');
              setFilterRole('');
              setFilterStatus('');
              setPage(1);
            }}
          >
            Reset
          </Button>
        </form>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <Table
            headers={['Nama', 'Email', 'Role', 'Status', 'Terdaftar', 'Aksi']}
            isEmpty={!data?.data.length}
            emptyMessage="Tidak ada pengguna yang ditemukan."
          >
            {data?.data.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge className="bg-blue-100 text-blue-800">
                    {userRoleLabel(user.role)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={userStatusColor(user.status)}>
                    {userStatusLabel(user.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDateTime(user.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {user.status === 'pending_verification' && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          isLoading={verifyingId === user.id}
                          onClick={() => handleVerify(user.id, 'approve')}
                        >
                          Verifikasi
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={verifyingId === user.id}
                          onClick={() => handleVerify(user.id, 'reject')}
                        >
                          Tolak
                        </Button>
                      </>
                    )}
                    <Link href={`/admin/users/${user.id}`}>
                      <Button size="sm" variant="ghost">
                        Detail
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          {data && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Total {data.meta.total} pengguna
              </p>
              <Pagination
                page={page}
                totalPages={data.meta.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
