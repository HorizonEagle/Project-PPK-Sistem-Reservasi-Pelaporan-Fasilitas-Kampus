import type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  User,
  AuthResponse,
  Facility,
  SlotAvailability,
  Reservation,
  Report,
  DashboardStats,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ─── HTTP Client ──────────────────────────────────────────────────────────────

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error || `HTTP Error: ${response.status}`);
    }

    return data as T;
  }

  async get<T>(path: string, params?: Record<string, string>, auth = true): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, value);
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(auth),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, body?: unknown, auth = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders(auth),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(path: string, body?: unknown, auth = true): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(auth),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async postFormData<T>(path: string, formData: FormData, auth = true): Promise<T> {
    const headers: HeadersInit = {};
    if (auth) {
      const token = this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient(API_URL);

// ─── AUTH Module ─────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post<ApiResponse<User>>('/auth/register', data, false),

  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data, false),

  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),

  me: () => apiClient.get<ApiResponse<User>>('/auth/me'),
};

// ─── USERS Module (Admin) ─────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: {
    role?: string;
    status?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) =>
    apiClient.get<PaginatedResponse<User>>('/users', params as Record<string, string>),

  get: (id: string) => apiClient.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: { name: string; email: string; password: string; role: 'officer' | 'user' }) =>
    apiClient.post<ApiResponse<User>>('/users', data),

  verify: (id: string, action: 'approve' | 'reject') =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}/verify`, { action }),

  update: (id: string, data: Partial<Pick<User, 'name' | 'role' | 'status'>>) =>
    apiClient.patch<ApiResponse<User>>(`/users/${id}`, data),
};

// ─── FACILITIES Module ────────────────────────────────────────────────────────

export const facilitiesApi = {
  list: (params?: {
    type?: string;
    location?: string;
    capacity_min?: string;
    search?: string;
    page?: string;
    limit?: string;
  }) =>
    apiClient.get<PaginatedResponse<Facility>>(
      '/facilities',
      params as Record<string, string>,
      false
    ),

  get: (id: string) =>
    apiClient.get<ApiResponse<Facility>>(`/facilities/${id}`, undefined, false),

  getSchedule: (id: string, date: string) =>
    apiClient.get<ApiResponse<SlotAvailability[]>>(
      `/facilities/${id}/schedule`,
      { date },
      false
    ),

  create: (data: Partial<Facility>) =>
    apiClient.post<ApiResponse<Facility>>('/facilities', data),

  update: (id: string, data: Partial<Facility>) =>
    apiClient.patch<ApiResponse<Facility>>(`/facilities/${id}`, data),
};

// ─── RESERVATIONS Module ──────────────────────────────────────────────────────

export const reservationsApi = {
  list: (params?: {
    status?: string;
    user_id?: string;
    facility_id?: string;
    page?: string;
    limit?: string;
  }) =>
    apiClient.get<PaginatedResponse<Reservation>>(
      '/reservations',
      params as Record<string, string>
    ),

  get: (id: string) => apiClient.get<ApiResponse<Reservation>>(`/reservations/${id}`),

  create: (data: {
    facilityId: string;
    date: string;
    startTime: string;
    endTime: string;
    purpose: string;
  }) => apiClient.post<ApiResponse<Reservation>>('/reservations', data),

  updateStatus: (
    id: string,
    data: { status: 'approved' | 'rejected'; rejectionReason?: string }
  ) => apiClient.patch<ApiResponse<Reservation>>(`/reservations/${id}`, data),

  cancel: (id: string, cancellationReason?: string) =>
    apiClient.patch<ApiResponse<Reservation>>(`/reservations/${id}/cancel`, {
      cancellationReason,
    }),
};

// ─── REPORTS Module ───────────────────────────────────────────────────────────

export const reportsApi = {
  list: (params?: {
    status?: string;
    user_id?: string;
    facility_id?: string;
    page?: string;
    limit?: string;
  }) =>
    apiClient.get<PaginatedResponse<Report>>('/reports', params as Record<string, string>),

  get: (id: string) => apiClient.get<ApiResponse<Report>>(`/reports/${id}`),

  create: (formData: FormData) =>
    apiClient.postFormData<ApiResponse<Report>>('/reports', formData),

  updateStatus: (
    id: string,
    data: {
      status: 'in_progress' | 'resolved' | 'rejected';
      resolutionNote?: string;
    }
  ) => apiClient.patch<ApiResponse<Report>>(`/reports/${id}`, data),
};

// ─── DASHBOARD Module ─────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: () => apiClient.get<ApiResponse<DashboardStats>>('/dashboard'),
};
