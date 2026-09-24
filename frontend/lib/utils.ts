import type {
  FacilityType,
  FacilityStatus,
  ReservationStatus,
  ReportStatus,
  ReportCategory,
  UserRole,
  UserStatus,
} from '@/types';

// ─── Format / Display Helpers ─────────────────────────────────────────────────

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatTime(timeString: string): string {
  // timeString bisa berupa "1970-01-01T09:00:00.000Z" atau "09:00"
  if (timeString.includes('T')) {
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  return timeString;
}

// ─── Label Helpers ────────────────────────────────────────────────────────────

export function facilityTypeLabel(type: FacilityType): string {
  const labels: Record<FacilityType, string> = {
    classroom: 'Ruang Kuliah',
    auditorium: 'Aula/Auditorium',
    laboratory: 'Laboratorium',
    equipment: 'Peralatan',
    field: 'Lapangan',
  };
  return labels[type] ?? type;
}

export function facilityStatusLabel(status: FacilityStatus): string {
  const labels: Record<FacilityStatus, string> = {
    active: 'Aktif',
    inactive: 'Nonaktif',
    under_maintenance: 'Dalam Perbaikan',
  };
  return labels[status] ?? status;
}

export function reservationStatusLabel(status: ReservationStatus): string {
  const labels: Record<ReservationStatus, string> = {
    pending: 'Menunggu',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    cancelled_by_user: 'Dibatalkan (User)',
    cancelled_by_admin: 'Dibatalkan (Petugas)',
  };
  return labels[status] ?? status;
}

export function reportStatusLabel(status: ReportStatus): string {
  const labels: Record<ReportStatus, string> = {
    new_report: 'Baru',
    in_progress: 'Sedang Ditangani',
    resolved: 'Selesai',
    rejected: 'Ditolak',
  };
  return labels[status] ?? status;
}

export function reportCategoryLabel(category: ReportCategory): string {
  const labels: Record<ReportCategory, string> = {
    kerusakan_ringan: 'Kerusakan Ringan',
    kerusakan_berat: 'Kerusakan Berat',
    kebersihan: 'Kebersihan',
    keamanan: 'Keamanan',
    lainnya: 'Lainnya',
  };
  return labels[category] ?? category;
}

export function userRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Administrator',
    officer: 'Petugas',
    user: 'Pengguna',
  };
  return labels[role] ?? role;
}

export function userStatusLabel(status: UserStatus): string {
  const labels: Record<UserStatus, string> = {
    active: 'Aktif',
    pending_verification: 'Menunggu Verifikasi',
    rejected: 'Ditolak',
  };
  return labels[status] ?? status;
}

// ─── Color / Badge Helpers ────────────────────────────────────────────────────

export function reservationStatusColor(status: ReservationStatus): string {
  const colors: Record<ReservationStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled_by_user: 'bg-gray-100 text-gray-700',
    cancelled_by_admin: 'bg-orange-100 text-orange-800',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700';
}

export function reportStatusColor(status: ReportStatus): string {
  const colors: Record<ReportStatus, string> = {
    new_report: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700';
}

export function facilityStatusColor(status: FacilityStatus): string {
  const colors: Record<FacilityStatus, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-700',
    under_maintenance: 'bg-orange-100 text-orange-800',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700';
}

export function userStatusColor(status: UserStatus): string {
  const colors: Record<UserStatus, string> = {
    active: 'bg-green-100 text-green-800',
    pending_verification: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700';
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

/**
 * Klasifikasi error dari API call
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan yang tidak diketahui.';
}

/**
 * Cek apakah string adalah tanggal yang valid
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Format angka jadi singkat (1000 → 1K)
 */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
