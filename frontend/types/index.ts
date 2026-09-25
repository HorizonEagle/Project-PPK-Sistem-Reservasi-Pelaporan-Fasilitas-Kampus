// ─── AUTH / USER ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'officer' | 'user';
export type UserStatus = 'active' | 'pending_verification' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

// ─── FACILITY ─────────────────────────────────────────────────────────────────

export type FacilityType = 'classroom' | 'auditorium' | 'laboratory' | 'equipment' | 'field';
export type FacilityStatus = 'active' | 'inactive' | 'under_maintenance';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  location: string;
  capacity: number;
  description?: string;
  status: FacilityStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlotAvailability {
  startTime: string;  // "07:00"
  endTime: string;    // "07:30"
  status: 'available' | 'booked' | 'maintenance';
}

// ─── RESERVATION ─────────────────────────────────────────────────────────────

export type ReservationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled_by_user'
  | 'cancelled_by_admin';

export interface Reservation {
  id: string;
  userId: string;
  facilityId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: ReservationStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  facility?: Pick<Facility, 'id' | 'name' | 'location' | 'type'>;
  processor?: Pick<User, 'id' | 'name'>;
}

// ─── REPORT ───────────────────────────────────────────────────────────────────

export type ReportCategory =
  | 'kerusakan_ringan'
  | 'kerusakan_berat'
  | 'kebersihan'
  | 'keamanan'
  | 'lainnya';

export type ReportStatus = 'new_report' | 'in_progress' | 'resolved' | 'rejected';

export interface Report {
  id: string;
  userId: string;
  facilityId: string;
  category: ReportCategory;
  description: string;
  photoUrl?: string;
  status: ReportStatus;
  resolutionNote?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  facility?: Pick<Facility, 'id' | 'name' | 'location' | 'type'>;
  processor?: Pick<User, 'id' | 'name'>;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalReservations: number;
  pendingReservations: number;
  totalReports: number;
  newReports: number;
  totalFacilities: number;
  activeFacilities: number;
  // Admin/officer dashboard extras
  totalUsers?: number;
  pendingUsers?: number;
  inProgressReports?: number;
  resolvedReports?: number;
  maintenanceFacilities?: number;
}
