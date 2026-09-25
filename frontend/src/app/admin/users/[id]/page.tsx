'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';
import { Card, Button, Spinner, Alert, Badge, Select } from '@/components/ui';
import { formatDateTime, userStatusColor, userStatusLabel, userRoleLabel } from '@/lib/utils';
import type { User, UserRole } from '@/types';

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [editRole, setEditRole] = useState<UserRole>('user');

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await usersApi.get(id);
      setUser(res.data);
      setEditRole(res.data.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat detail pengguna');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleVerify = async (action: 'approve' | 'reject') => {
    setIsActionLoading(true);
    setActionError('');
    setSuccessMessage('');
    try {
      await usersApi.verify(id, action);
      setSuccessMessage(action === 'approve' ? 'Pengguna berhasil diverifikasi.' : 'Pengguna ditolak.');
      fetchUser();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal memverifikasi pengguna');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    setIsActionLoading(true);
    setActionError('');
    setSuccessMessage('');
    try {
      await usersApi.update(id, { role: editRole });
      setSuccessMessage('Peran pengguna berhasil diperbarui.');
      fetchUser();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Gagal mengubah peran pengguna');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin/users" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          ← Kembali ke Daftar Pengguna
        </Link>
        <Alert type="error">{error || 'Pengguna tidak ditemukan'}</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/admin/users" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Kembali ke Daftar Pengguna
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detail Pengguna</h1>
          <p className="mt-1 text-sm text-gray-600">
            Informasi lengkap dan pengaturan akun.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user.status === 'pending_verification' && (
            <>
              <Button 
                variant="secondary" 
                onClick={() => handleVerify('reject')}
                isLoading={isActionLoading}
              >
                Tolak
              </Button>
              <Button 
                onClick={() => handleVerify('approve')}
                isLoading={isActionLoading}
              >
                ✅ Verifikasi
              </Button>
            </>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="mb-4">
          <Alert type="success">{successMessage}</Alert>
        </div>
      )}
      {actionError && (
        <div className="mb-4">
          <Alert type="error">{actionError}</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informasi Utama */}
        <Card className="md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Informasi Profil</h2>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">ID Pengguna</div>
              <div className="font-mono text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.id}</div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Nama Lengkap</div>
                <div className="font-medium text-gray-900">{user.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Email</div>
                <div className="font-medium text-gray-900">{user.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Peran</div>
                <div className="font-medium text-gray-900">{userRoleLabel(user.role)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Status Akun</div>
                <Badge className={userStatusColor(user.status)}>
                  {userStatusLabel(user.status)}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Tanggal Bergabung</div>
                <div className="font-medium text-gray-900">{formatDateTime(user.createdAt)}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Pengaturan Akun */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Pengaturan</h2>
          
          <div className="space-y-4">
            <div>
              <Select
                label="Ubah Peran"
                options={[
                  { value: 'user', label: 'Pengguna Reguler' },
                  { value: 'officer', label: 'Petugas' },
                  { value: 'admin', label: 'Administrator' },
                ]}
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                id="edit-role-select"
              />
              <div className="mt-3">
                <Button 
                  className="w-full" 
                  variant="secondary"
                  onClick={handleUpdateRole}
                  isLoading={isActionLoading}
                  disabled={editRole === user.role}
                >
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
