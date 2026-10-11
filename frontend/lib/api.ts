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

// ─── Custom Errors ───────────────────────────────────────────────────────────

export class ConnectionError extends Error {
  constructor(message = 'Gagal terhubung ke server. Periksa koneksi internet Anda atau pastikan server backend aktif.') {
    super(message);
    this.name = 'ConnectionError';
  }
}

export class ApiRequestError extends Error {
  status: number;
  details?: Record<string, string[]>;

  constructor(message: string, status: number, details?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }
}

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
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ApiRequestError(
        `Respons server tidak valid (Status ${response.status})`,
        response.status
      );
    }

    if (!response.ok) {
      const errorObj = data as ApiError & { details?: Record<string, string[]> };
      let message = errorObj.error || `HTTP Error: ${response.status}`;
      if (errorObj.details && typeof errorObj.details === 'object') {
        const detailsList = Object.values(errorObj.details).flat().filter(Boolean);
        if (detailsList.length > 0) {
          message += `: ${detailsList.join(', ')}`;
        }
      }
      throw new ApiRequestError(message, response.status, errorObj.details);
    }

    return data as T;
  }

  private wrapFetchError(err: unknown): never {
    if (err instanceof ApiRequestError || err instanceof ConnectionError) {
      throw err;
    }
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      const isNetwork =
        err.name === 'TypeError' ||
        msg.includes('fetch') ||
        msg.includes('network') ||
        msg.includes('failed to fetch') ||
        msg.includes('networkerror') ||
        msg.includes('load failed') ||
        msg.includes('connection');

      if (isNetwork) {
        throw new ConnectionError(
          'Gagal terhubung ke server. Periksa koneksi internet Anda atau pastikan server backend berjalan di port 3001.'
        );
      }
      throw err;
    }
    throw new ConnectionError('Gagal terhubung ke server akibat gangguan koneksi jaringan.');
  }

  async get<T>(path: string, params?: Record<string, string>, auth = true): Promise<T> {
    try {
      const base = this.baseUrl.startsWith('http')
        ? this.baseUrl
        : `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}${this.baseUrl}`;
      const url = new URL(`${base}${path}`);
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
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (err) {
      this.wrapFetchError(err);
    }
  }

  async post<T>(path: string, body?: unknown, auth = true): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.getHeaders(auth),
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (err) {
      this.wrapFetchError(err);
    }
  }

  async patch<T>(path: string, body?: unknown, auth = true): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'PATCH',
        headers: this.getHeaders(auth),
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (err) {
      this.wrapFetchError(err);
    }
  }

  async postFormData<T>(path: string, formData: FormData, auth = true): Promise<T> {
    try {
      const headers: HeadersInit = {};
      if (auth) {
        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData,
      });

      return await this.handleResponse<T>(response);
    } catch (err) {
      this.wrapFetchError(err);
    }
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

// ─── UPLOAD Module ────────────────────────────────────────────────────────────

export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postFormData<ApiResponse<{ url: string; filename: string; size: number }>>(
      '/upload',
      formData
    );
  },
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

  create: (data: {
    facilityId: string;
    category: string;
    description: string;
    photoUrl?: string;
  }) =>
    apiClient.post<ApiResponse<Report>>('/reports', data),

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

// ─── EXPORT Module ────────────────────────────────────────────────────────────

export const exportApi = {
  download: (params: {
    type: 'reports' | 'reservations';
    format?: string;
    status?: string;
    facility_id?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    
    const token = localStorage.getItem('token');
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/export?${searchParams.toString()}`;
    
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Gagal mengunduh file');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;

      // Get filename from Content-Disposition header or generate fallback
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = '';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) fileName = match[1];
      }

      // Fallback filename based on format
      if (!fileName) {
        const format = params.format || 'csv';
        const ext = format === 'excel' ? 'xls' : format === 'pdf' ? 'html' : 'csv';
        fileName = `${params.type}_export.${ext}`;
      }

      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    });
  },
};
