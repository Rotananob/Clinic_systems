export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:4000/api`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
}

class ApiClient {
  private inFlightPromises = new Map<string, Promise<any>>();

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('clinic_access_token');
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
          const errorData = await response.json();
          if (Array.isArray(errorData?.message)) {
            errorMessage = errorData.message.join('. ');
          } else {
            errorMessage = errorData?.message || errorData?.error || errorMessage;
          }
        } catch {
          // use default error message
        }

        if (response.status === 401 && typeof window !== 'undefined') {
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('clinic_access_token');
            localStorage.removeItem('clinic_user');
          }
        }

        throw new Error(errorMessage);
      }

      return response.json();
    } catch (err: any) {
      // Offline fallback: if offline or network error, queue mutation in IndexedDB
      const isMutation = options.method && options.method !== 'GET';
      const isNetworkError =
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        err?.name === 'TypeError' ||
        err?.message?.includes('fetch') ||
        err?.message?.includes('Network');

      if (isMutation && isNetworkError) {
        try {
          const { syncManager } = await import('./syncManager');
          await syncManager.queueMutation({
            endpoint,
            method: options.method as any,
            body: options.body ? JSON.parse(options.body as string) : null,
            label: `${options.method} ${endpoint}`,
          });

          return {
            id: `offline-${Date.now()}`,
            _isOfflineQueued: true,
            status: 'OFFLINE_SAVED',
            message: 'Saved locally. Will sync when back online.',
          } as any;
        } catch (queueErr) {
          console.error('Failed to queue offline mutation:', queueErr);
        }
      }
      throw err;
    }
  }

  // Authentication
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.request<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    me: () => this.request<any>('/auth/me'),
    changePassword: (data: { oldPassword: string; newPassword: string }) =>
      this.request<any>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Patients
  patients = {
    list: (params?: { search?: string; page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append('search', params.search);
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.request<{ data: any[]; meta: any }>(`/patients${query}`);
    },
    get: (id: string) => this.request<any>(`/patients/${id}`),
    checkDuplicate: (phone: string, nationalId?: string) => {
      const sp = new URLSearchParams({ phone });
      if (nationalId) sp.append('nationalId', nationalId);
      return this.request<{ hasDuplicate: boolean; candidates: any[] }>(`/patients/check-duplicate?${sp.toString()}`);
    },
    create: (data: any) =>
      this.request<any>('/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  };

  // Visits
  visits = {
    list: (params?: { status?: string; patientId?: string; doctorId?: string }) => {
      const sp = new URLSearchParams();
      if (params?.status) sp.append('status', params.status);
      if (params?.patientId) sp.append('patientId', params.patientId);
      if (params?.doctorId) sp.append('doctorId', params.doctorId);
      const query = sp.toString() ? `?${sp.toString()}` : '';
      return this.request<any[]>(`/visits${query}`);
    },
    get: (id: string) => this.request<any>(`/visits/${id}`),
    create: (data: any) =>
      this.request<any>('/visits', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateVitals: (id: string, data: any) =>
      this.request<any>(`/visits/${id}/vitals`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    complete: (
      id: string,
      data: {
        diagnosis: string;
        notes?: string;
        doctorId?: string;
        physicalExam?: string;
        assessment?: string;
        treatmentPlan?: string;
        createConsultationInvoice?: boolean;
      },
    ) =>
      this.request<any>(`/visits/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // Prescriptions
  prescriptions = {
    list: (status?: string) => {
      const q = status ? `?status=${status}` : '';
      return this.request<any[]>(`/prescriptions${q}`);
    },
    get: (id: string) => this.request<any>(`/prescriptions/${id}`),
    create: (data: any) =>
      this.request<any>('/prescriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    dispense: (id: string) =>
      this.request<any>(`/prescriptions/${id}/dispense`, {
        method: 'PATCH',
      }),
  };



  // Payments & Invoices (KHQR Engine)
  payments = {
    listInvoices: (params?: { status?: string; patientId?: string }) => {
      const sp = new URLSearchParams();
      if (params?.status) sp.append('status', params.status);
      if (params?.patientId) sp.append('patientId', params.patientId);
      const query = sp.toString() ? `?${sp.toString()}` : '';
      return this.request<any[]>(`/payments/invoices${query}`);
    },
    getInvoice: (id: string) => this.request<any>(`/payments/invoices/${id}`),
    generateQr: (invoiceId: string) => {
      const key = `generate-qr:${invoiceId}`;
      if (this.inFlightPromises.has(key)) {
        return this.inFlightPromises.get(key)!;
      }
      const promise = this.request<any>('/payments/generate-qr', {
        method: 'POST',
        body: JSON.stringify({ invoiceId }),
      }).finally(() => {
        this.inFlightPromises.delete(key);
      });
      this.inFlightPromises.set(key, promise);
      return promise;
    },
    settle: (tranId: string) =>
      this.request<any>('/payments/settle', {
        method: 'POST',
        body: JSON.stringify({ tranId }),
      }),
    checkStatus: (tranId: string) => {
      const key = `status:${tranId}`;
      if (this.inFlightPromises.has(key)) {
        return this.inFlightPromises.get(key)!;
      }
      const promise = this.request<any>(`/payments/status/${tranId}`).finally(() => {
        this.inFlightPromises.delete(key);
      });
      this.inFlightPromises.set(key, promise);
      return promise;
    },
    createQuickInvoice: (data: {
      nameEn: string;
      nameKh?: string;
      phone?: string;
      amount: number;
      currency?: string;
      reason?: string;
    }) =>
      this.request<any>('/payments/quick-invoice', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    settleCash: (invoiceId: string, amountTendered: number) =>
      this.request<any>('/payments/settle-cash', {
        method: 'POST',
        body: JSON.stringify({ invoiceId, amountTendered }),
      }),
    updateInvoice: (
      id: string,
      data: { status?: string; payableAmount?: number; paymentMethod?: string; notes?: string },
    ) =>
      this.request<any>(`/payments/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // Follow-ups & Recalls
  followUps = {
    list: (params?: {
      status?: string;
      patientId?: string;
      doctorId?: string;
      fromDate?: string;
      toDate?: string;
    }) => {
      const sp = new URLSearchParams();
      if (params?.status) sp.append('status', params.status);
      if (params?.patientId) sp.append('patientId', params.patientId);
      if (params?.doctorId) sp.append('doctorId', params.doctorId);
      if (params?.fromDate) sp.append('fromDate', params.fromDate);
      if (params?.toDate) sp.append('toDate', params.toDate);
      const query = sp.toString() ? `?${sp.toString()}` : '';
      return this.request<any[]>(`/follow-ups${query}`);
    },
    get: (id: string) => this.request<any>(`/follow-ups/${id}`),
    create: (data: any) =>
      this.request<any>('/follow-ups', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      this.request<any>(`/follow-ups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // Documents & Lab Attachments
  documents = {
    list: (params?: { patientId?: string; category?: string; visitId?: string }) => {
      const sp = new URLSearchParams();
      if (params?.patientId) sp.append('patientId', params.patientId);
      if (params?.category) sp.append('category', params.category);
      if (params?.visitId) sp.append('visitId', params.visitId);
      const query = sp.toString() ? `?${sp.toString()}` : '';
      return this.request<any[]>(`/documents${query}`);
    },
    get: (id: string) => this.request<any>(`/documents/${id}`),
    create: (data: any) =>
      this.request<any>('/documents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      this.request<any>(`/documents/${id}`, {
        method: 'DELETE',
      }),
  };

  // Users & Staff Management
  users = {
    getDoctors: () => this.request<any[]>('/users/doctors'),
    list: (role?: string) => {
      const query = role ? `?role=${role}` : '';
      return this.request<any[]>(`/users${query}`);
    },
    create: (data: {
      email: string;
      password: string;
      fullNameEn: string;
      fullNameKh?: string;
      role: string;
      phone?: string;
    }) =>
      this.request<any>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    toggleActive: (id: string) =>
      this.request<any>(`/users/${id}/toggle-active`, {
        method: 'PATCH',
      }),
  };

  // Dashboard
  dashboard = {
    getMetrics: () => this.request<any>('/dashboard/metrics'),
  };

  // System Owner Governance (SUPER_ADMIN)
  system = {
    getStatus: () => this.request<any>('/system/status'),
    getPermissions: () => this.request<any[]>('/system/permissions'),
    getAuditLogs: () => this.request<any>('/system/audit-logs'),
    triggerBackup: () => this.request<any>('/system/backup', { method: 'POST' }),
  };
}

export const api = new ApiClient();
