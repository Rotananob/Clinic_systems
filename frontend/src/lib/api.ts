const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('clinic_access_token');
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // use default error message
      }
      throw new Error(errorMessage);
    }

    return response.json();
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

  // Users & Staff
  users = {
    getDoctors: () => this.request<any[]>('/users/doctors'),
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
    generateQr: (invoiceId: string) =>
      this.request<any>('/payments/generate-qr', {
        method: 'POST',
        body: JSON.stringify({ invoiceId }),
      }),
    settle: (tranId: string) =>
      this.request<any>('/payments/settle', {
        method: 'POST',
        body: JSON.stringify({ tranId }),
      }),
    checkStatus: (tranId: string) =>
      this.request<any>(`/payments/status/${tranId}`),
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

  // Dashboard
  dashboard = {
    getMetrics: () => this.request<any>('/dashboard/metrics'),
  };
}

export const api = new ApiClient();
