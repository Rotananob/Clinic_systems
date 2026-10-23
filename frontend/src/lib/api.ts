export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const customUrl = localStorage.getItem('clinic_api_url');
    if (customUrl && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, '');
    }
    if (host.includes('vercel.app') || host.includes('web.app') || host.includes('firebaseapp.com')) {
      return '/api';
    }
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:4000/api`;
    }
  }
  return 'http://localhost:4000/api';
}

class ApiClient {
  private inFlightPromises = new Map<string, Promise<any>>();

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('clinic_access_token');
    }
    return null;
  }

  private async getCachedFallback<T>(endpoint: string, cleanEndpoint: string): Promise<T | null> {
    const { syncManager } = await import('./syncManager');
    let cached = await syncManager.getCachedData<T>(endpoint);
    if (!cached && cleanEndpoint !== endpoint) {
      cached = await syncManager.getCachedData<T>(cleanEndpoint);
    }
    if (cached) return cached;

    // Built-in fallbacks if cache is not populated yet
    if (cleanEndpoint === '/patients') {
      return { data: [], meta: { total: 0, page: 1, limit: 15, totalPages: 1 } } as any;
    }
    if (
      cleanEndpoint === '/visits' ||
      cleanEndpoint === '/payments/invoices' ||
      cleanEndpoint === '/prescriptions' ||
      cleanEndpoint === '/users/doctors' ||
      cleanEndpoint === '/follow-ups' ||
      cleanEndpoint === '/documents'
    ) {
      return [] as any;
    }
    if (cleanEndpoint === '/dashboard/metrics') {
      return { totalPatients: 0, todayVisits: 0, pendingInvoices: 0, totalRevenue: 0 } as any;
    }
    if (cleanEndpoint === '/system/status') {
      return { status: 'ONLINE', database: 'LOCAL_OFFLINE', version: '1.0.0' } as any;
    }

    return null;
  }

  private async handleOfflineMutation<T>(
    endpoint: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: any
  ): Promise<T> {
    const { syncManager } = await import('./syncManager');
    const cleanEndpoint = endpoint.split('?')[0];

    // 1. Enqueue mutation in IndexedDB
    await syncManager.queueMutation({
      endpoint,
      method,
      body,
      label: `${method} ${endpoint}`,
    });

    const now = new Date().toISOString();

    // Patient Registration: POST /patients
    if (cleanEndpoint === '/patients' && method === 'POST') {
      const optimisticPatient = {
        id: `offline-pat-${Date.now()}`,
        patientCode: `P-OFF-${Math.floor(1000 + Math.random() * 9000)}`,
        nameEn: body.nameEn || 'Patient',
        nameKh: body.nameKh || '',
        gender: body.gender || 'MALE',
        phone: body.phone || '',
        dob: body.dob || '',
        bloodType: body.bloodType || 'O+',
        allergies: body.allergies || '',
        address: body.address || '',
        nationalId: body.nationalId || '',
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE',
        _isOfflineQueued: true,
        ...body,
      };
      await syncManager.prependCachedItem('/patients', optimisticPatient);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('clinic_data_changed', { detail: { type: 'PATIENT_CREATED', data: optimisticPatient } })
        );
      }
      return optimisticPatient as T;
    }

    // Patient Update: PUT /patients/:id
    if (cleanEndpoint.startsWith('/patients/') && method === 'PUT') {
      const patId = cleanEndpoint.split('/')[2];
      await syncManager.updateCachedItem('/patients', (p: any) => p.id === patId, (p: any) => ({ ...p, ...body, updatedAt: now, _isOfflineQueued: true }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('clinic_data_changed', { detail: { type: 'PATIENT_UPDATED', patId } })
        );
      }
      return { id: patId, ...body, updatedAt: now, _isOfflineQueued: true } as T;
    }

    // Visit Check-In: POST /visits
    if (cleanEndpoint === '/visits' && method === 'POST') {
      let patientObj = body.patient;
      if (!patientObj && body.patientId) {
        const patientsCache = await syncManager.getCachedData<any>('/patients');
        const list = Array.isArray(patientsCache) ? patientsCache : patientsCache?.data || [];
        patientObj = list.find((p: any) => p.id === body.patientId) || {
          id: body.patientId,
          nameEn: 'Selected Patient',
          patientCode: 'P-OFF',
          phone: '',
        };
      }

      const optimisticVisit = {
        id: `offline-vis-${Date.now()}`,
        visitCode: `V-OFF-${Math.floor(1000 + Math.random() * 9000)}`,
        patientId: body.patientId,
        doctorId: body.doctorId || null,
        reason: body.reason || 'Clinical Consultation',
        symptoms: body.symptoms || '',
        consultationFee: body.consultationFee || 5,
        status: 'WAITING',
        createdAt: now,
        updatedAt: now,
        patient: patientObj,
        _isOfflineQueued: true,
        ...body,
      };
      await syncManager.prependCachedItem('/visits', optimisticVisit);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('clinic_data_changed', { detail: { type: 'VISIT_CREATED', data: optimisticVisit } })
        );
      }
      return optimisticVisit as T;
    }

    // Visit Vitals: PATCH /visits/:id/vitals
    if (cleanEndpoint.startsWith('/visits/') && cleanEndpoint.endsWith('/vitals') && method === 'PATCH') {
      const visitId = cleanEndpoint.split('/')[2];
      await syncManager.updateCachedItem('/visits', (v: any) => v.id === visitId, (v: any) => ({ ...v, ...body, updatedAt: now, _isOfflineQueued: true }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('clinic_data_changed', { detail: { type: 'VITALS_UPDATED', visitId } })
        );
      }
      return { id: visitId, ...body, updatedAt: now, _isOfflineQueued: true } as T;
    }

    // Visit Status: PATCH /visits/:id/status
    if (cleanEndpoint.startsWith('/visits/') && cleanEndpoint.endsWith('/status') && method === 'PATCH') {
      const visitId = cleanEndpoint.split('/')[2];
      await syncManager.updateCachedItem('/visits', (v: any) => v.id === visitId, (v: any) => ({ ...v, status: body.status, updatedAt: now, _isOfflineQueued: true }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('clinic_data_changed', { detail: { type: 'VISIT_UPDATED', visitId, status: body.status } })
        );
      }
      return { id: visitId, status: body.status, updatedAt: now, _isOfflineQueued: true } as T;
    }

    // Visit Complete: PATCH /visits/:id/complete
    if (cleanEndpoint.startsWith('/visits/') && cleanEndpoint.endsWith('/complete') && method === 'PATCH') {
      const visitId = cleanEndpoint.split('/')[2];
      await syncManager.updateCachedItem('/visits', (v: any) => v.id === visitId, (v: any) => ({ ...v, status: 'COMPLETED', ...body, completedAt: now, updatedAt: now, _isOfflineQueued: true }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('clinic_data_changed', { detail: { type: 'VISIT_COMPLETED', visitId } })
        );
      }
      return { id: visitId, status: 'COMPLETED', ...body, completedAt: now, _isOfflineQueued: true } as T;
    }

    // Billing Quick Invoice: POST /payments/quick-invoice or /payments/invoices
    if ((cleanEndpoint === '/payments/quick-invoice' || cleanEndpoint === '/payments/invoices') && method === 'POST') {
      const optimisticInvoice = {
        id: `offline-inv-${Date.now()}`,
        invoiceNumber: `INV-OFF-${Date.now().toString().slice(-5)}`,
        patientName: body.nameEn || body.patientName || 'Walk-in Patient',
        patientNameKh: body.nameKh || '',
        phone: body.phone || '',
        totalAmount: Number(body.amount || body.totalAmount || 0),
        payableAmount: Number(body.amount || body.totalAmount || 0),
        currency: body.currency || 'USD',
        reason: body.reason || 'Clinical Services',
        status: 'PENDING',
        paymentMethod: 'KHQR',
        createdAt: now,
        updatedAt: now,
        items: body.items || [
          {
            id: `offline-item-${Date.now()}`,
            description: body.reason || 'Medical Consultation',
            quantity: 1,
            unitPrice: Number(body.amount || 0),
            totalPrice: Number(body.amount || 0),
          },
        ],
        _isOfflineQueued: true,
        ...body,
      };
      await syncManager.prependCachedItem('/payments/invoices', optimisticInvoice);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('clinic_data_changed', { detail: { type: 'INVOICE_CREATED', data: optimisticInvoice } })
        );
      }
      return optimisticInvoice as T;
    }

    // Settle Cash: POST /payments/settle-cash
    if (cleanEndpoint === '/payments/settle-cash' && method === 'POST') {
      const invId = body.invoiceId;
      await syncManager.updateCachedItem('/payments/invoices', (inv: any) => inv.id === invId, (inv: any) => ({ ...inv, status: 'PAID', paymentMethod: 'CASH', paidAt: now, _isOfflineQueued: true }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('clinic_data_changed', { detail: { type: 'INVOICE_PAID', invId } }));
      }
      return { id: invId, status: 'PAID', paymentMethod: 'CASH', paidAt: now, _isOfflineQueued: true } as T;
    }

    // Invoice Update: PATCH /payments/invoices/:id
    if (cleanEndpoint.startsWith('/payments/invoices/') && method === 'PATCH') {
      const invId = cleanEndpoint.split('/')[3];
      await syncManager.updateCachedItem('/payments/invoices', (inv: any) => inv.id === invId, (inv: any) => ({ ...inv, ...body, updatedAt: now, _isOfflineQueued: true }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('clinic_data_changed', { detail: { type: 'INVOICE_UPDATED', invId } }));
      }
      return { id: invId, ...body, updatedAt: now, _isOfflineQueued: true } as T;
    }

    // Generate KHQR fallback when offline: POST /payments/generate-qr
    if (cleanEndpoint === '/payments/generate-qr' && method === 'POST') {
      const offlineTranId = `OFF-TRX-${Date.now().toString().slice(-6)}`;
      return {
        qrString: '00020101021229300012houn_vannak_clinic@aba520459995303840540510.005802KH5916ROTNACLINIC6010PHNOMPENH6304ABCD',
        tranId: offlineTranId,
        md5: 'offline-md5-hash',
        amount: body.payableAmount || 10.0,
        currency: 'USD',
        invoiceNumber: `INV-OFF-${Date.now().toString().slice(-5)}`,
        paywayLink: 'https://link.payway.com.kh/ABAPAYCK539089j',
        expiresInSeconds: 180,
        _isOfflineQueued: true,
      } as T;
    }

    // Prescription Create: POST /prescriptions
    if (cleanEndpoint === '/prescriptions' && method === 'POST') {
      const optimisticRx = {
        id: `offline-rx-${Date.now()}`,
        prescriptionCode: `RX-OFF-${Date.now().toString().slice(-5)}`,
        patientId: body.patientId,
        visitId: body.visitId,
        status: 'PENDING',
        items: body.items || [],
        createdAt: now,
        updatedAt: now,
        _isOfflineQueued: true,
        ...body,
      };
      await syncManager.prependCachedItem('/prescriptions', optimisticRx);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('clinic_data_changed', { detail: { type: 'PRESCRIPTION_CREATED', data: optimisticRx } })
        );
      }
      return optimisticRx as T;
    }

    // Prescription Dispense: PATCH /prescriptions/:id/dispense
    if (cleanEndpoint.startsWith('/prescriptions/') && cleanEndpoint.endsWith('/dispense') && method === 'PATCH') {
      const rxId = cleanEndpoint.split('/')[2];
      await syncManager.updateCachedItem('/prescriptions', (rx: any) => rx.id === rxId, (rx: any) => ({ ...rx, status: 'DISPENSED', dispensedAt: now, _isOfflineQueued: true }));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('clinic_data_changed', { detail: { type: 'PRESCRIPTION_DISPENSED', rxId } })
        );
      }
      return { id: rxId, status: 'DISPENSED', dispensedAt: now, _isOfflineQueued: true } as T;
    }

    // Generic fallback for any other offline mutation
    const generic = {
      id: `offline-${Date.now()}`,
      _isOfflineQueued: true,
      status: 'OFFLINE_SAVED',
      message: 'Saved locally. Will sync when back online.',
      createdAt: now,
      ...body,
    };
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('clinic_data_changed', { detail: { type: 'GENERIC_MUTATION', data: generic } }));
    }
    return generic as T;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isGet = !options.method || options.method === 'GET';
    const cleanEndpoint = endpoint.split('?')[0];
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // If completely offline and it's a GET request, immediately serve from cache!
    if (isGet && typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = await this.getCachedFallback<T>(endpoint, cleanEndpoint);
      if (cached !== null) {
        return cached;
      }
    }

    const baseUrl = getApiBaseUrl();

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      // 1. Handle HTTP 304 Not Modified gracefully (Cloudflare / Express ETag cache)
      if (response.status === 304) {
        const cached = await this.getCachedFallback<T>(endpoint, cleanEndpoint);
        if (cached !== null) return cached;
        return { status: 'PENDING', message: 'Not modified' } as any;
      }

      // 2. Handle HTTP 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

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

      const data = await response.json();
      // On successful GET, cache the fresh data
      if (isGet) {
        import('./syncManager').then(({ syncManager }) => {
          syncManager.cacheData(endpoint, data);
          if (cleanEndpoint !== endpoint) {
            syncManager.cacheData(cleanEndpoint, data);
          }
        });
      }
      return data;
    } catch (err: any) {
      const isNetworkError =
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        err?.name === 'TypeError' ||
        err?.message?.includes('fetch') ||
        err?.message?.includes('Network') ||
        err?.message?.includes('Failed to fetch');

      // 1. GET request offline / network failure -> Fallback to Cache
      if (isGet && isNetworkError) {
        const cached = await this.getCachedFallback<T>(endpoint, cleanEndpoint);
        if (cached !== null) {
          return cached;
        }
      }

      // 2. Mutation (POST/PUT/PATCH/DELETE) offline / network failure -> Optimistic execution & Queue (exclude /auth/ endpoints)
      if (!isGet && isNetworkError && !cleanEndpoint.startsWith('/auth/')) {
        const parsedBody = options.body ? JSON.parse(options.body as string) : {};
        return this.handleOfflineMutation<T>(endpoint, options.method as any, parsedBody);
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
    sendVerificationCode: (email: string) =>
      this.request<{ success: boolean; message: string; code?: string; fallback?: boolean }>('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    forgotPassword: (email: string) =>
      this.request<{ success: boolean; message: string; code?: string; fallback?: boolean }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPasswordWithCode: (data: { email: string; resetCode: string; newPassword: string }) =>
      this.request<{ success: boolean; message: string }>('/auth/reset-password-with-code', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    registerWithCode: (data: {
      clinicNameKh?: string;
      clinicNameEn?: string;
      phone?: string;
      email: string;
      password: string;
      verificationCode: string;
      adminName?: string;
      planTier?: string;
      clinicType?: string;
    }) =>
      this.request<{
        success: boolean;
        accessToken: string;
        user: any;
        tenant: any;
        message: string;
      }>('/auth/register-with-code', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    registerClinic: (data: {
      clinicNameKh: string;
      clinicNameEn: string;
      phone: string;
      email: string;
      password: string;
      adminName?: string;
      planTier?: string;
      clinicType?: string;
    }) =>
      this.request<{
        success: boolean;
        accessToken: string;
        user: any;
        tenant: any;
        message: string;
      }>('/auth/register-clinic', {
        method: 'POST',
        body: JSON.stringify(data),
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
    delete: (id: string) =>
      this.request<{ success: boolean; message: string; deletedId: string }>(`/patients/${id}`, {
        method: 'DELETE',
      }),
    bulkDelete: (ids: string[]) =>
      this.request<{ success: boolean; count: number; deletedIds: string[] }>('/patients/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
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
    updateStatus: (
      id: string,
      status: 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED',
    ) =>
      this.request<any>(`/visits/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
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
    evaluateCdss: (data: { medications: string[]; patientAllergies?: string; patientConditions?: string[]; vitals?: any }) =>
      this.request<any>('/prescriptions/cdss/evaluate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    searchIcd11: (query: string) =>
      this.request<any[]>(`/prescriptions/cdss/icd11?query=${encodeURIComponent(query)}`),
    calculateTriage: (vitals: any) =>
      this.request<any>('/prescriptions/cdss/triage', {
        method: 'POST',
        body: JSON.stringify(vitals),
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
    checkStatus: (tranId: string, force = false) => {
      const query = force ? '?force=true' : '';
      const key = `status:${tranId}${query}`;
      if (!force && this.inFlightPromises.has(key)) {
        return this.inFlightPromises.get(key)!;
      }
      const promise = this.request<any>(`/payments/status/${tranId}${query}`).finally(() => {
        this.inFlightPromises.delete(key);
      });
      if (!force) {
        this.inFlightPromises.set(key, promise);
      }
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
    getQuotaStatus: () => this.request<any>('/payments/quota-status'),
    testKhqr: (data?: { amount?: number; currency?: string; paywayPaymentUrl?: string }) =>
      this.request<{
        success: boolean;
        qrString: string;
        md5: string;
        tranId: string;
        amount: number;
        currency: string;
        merchantName: string;
        paywayLink: string;
        deeplinks: any;
        currentUsage: number;
        maxLimit: number;
        planTier: string;
      }>('/payments/test-khqr', {
        method: 'POST',
        body: JSON.stringify(data || {}),
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
    getProfile: () => this.request<any>('/users/profile'),
    updateProfile: (data: any) =>
      this.request<any>('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
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

  // Cloudinary Cloud Upload
  upload = {
    getStatus: () => this.request<any>('/upload/status'),
    uploadImage: (image: string, folder = 'avatars') =>
      this.request<{ success: boolean; url: string; publicId?: string; format?: string; bytes?: number }>('/upload/image', {
        method: 'POST',
        body: JSON.stringify({ image, folder }),
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

  // Telegram Bot & Topics Bridge
  telegram = {
    getStatus: () => this.request<any>('/telegram/status'),
    startPairing: () => this.request<any>('/telegram/start-pairing', { method: 'POST' }),
    getPairingStatus: () => this.request<any>('/telegram/pairing-status'),
    checkAdminTopics: () => this.request<any>('/telegram/check-admin-topics', { method: 'POST' }),
    connect: (data: { botToken?: string; chatId: string; autoCreateTopics?: boolean }) =>
      this.request<any>('/telegram/connect', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    disconnect: () => this.request<any>('/telegram/disconnect', { method: 'POST' }),
    updateSettings: (settings: any) =>
      this.request<any>('/telegram/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    sendTest: (category?: string) =>
      this.request<any>('/telegram/test', {
        method: 'POST',
        body: JSON.stringify({ category }),
      }),
    lockProfile: () => this.request<any>('/telegram/lock-profile', { method: 'POST' }),
  };

  // Visitor & Activity Telemetry Tracking
  tracking = {
    recordEvent: (data: {
      path: string;
      action?: string;
      title?: string;
      referrer?: string;
      sessionId?: string;
      clientReportedIp?: string;
      device?: {
        deviceType?: string;
        browser?: string;
        os?: string;
        screenResolution?: string;
        language?: string;
        timezone?: string;
      };
      location?: {
        latitude?: number;
        longitude?: number;
        accuracy?: number;
      };
      details?: Record<string, any>;
    }) =>
      this.request<{ success: boolean; ip: string; location: any }>('/tracking/event', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getStats: () => this.request<any>('/tracking/stats'),
  };

  // SaaS Multi-Tenant & Merchant Setup
  tenants = {
    getProfile: () => this.request<{ success: boolean; tenant: any; subscription: any; usage: any }>('/tenants/me'),
    updateProfile: (data: {
      clinicNameEn?: string;
      clinicNameKh?: string;
      mohLicenseNumber?: string;
      clinicType?: string;
      phonePrimary?: string;
      phoneEmergency?: string;
      email?: string;
      website?: string;
      addressEn?: string;
      addressKh?: string;
      bakongAccountId?: string;
      merchantName?: string;
      merchantCity?: string;
      paywayPaymentUrl?: string;
    }) =>
      this.request<{ success: boolean; message: string; tenant: any }>('/tenants/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    setupMerchant: (data: {
      paywayPaymentUrl?: string;
      bakongAccountId?: string;
      merchantName?: string;
      merchantCity?: string;
    }) =>
      this.request<{ success: boolean; message: string; tenant: any }>('/tenants/setup-merchant', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    testMerchantKhqr: (data: {
      paywayPaymentUrl?: string;
      bakongAccountId?: string;
      merchantName?: string;
      merchantCity?: string;
    }) =>
      this.request<{
        success: boolean;
        testMode: boolean;
        qrString: string;
        md5?: string;
        tranId?: string;
        bakongId?: string;
        merchantName?: string;
        merchantCity?: string;
        amount: number;
        currency: string;
        billNumber?: string;
        deeplinks?: any;
        paywayPaymentUrl?: string;
        message: string;
      }>('/tenants/test-merchant-khqr', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // SaaS Subscriptions & Billing Engine
  subscriptions = {
    getCurrent: () =>
      this.request<{
        success: boolean;
        tenantId: string;
        slug: string;
        clinicNameKh: string;
        clinicNameEn: string;
        planTier: string;
        planNameKh: string;
        planNameEn: string;
        priceUsd: number;
        subscriptionStatus: string;
        daysRemaining: number;
        currentPeriodEnd: string;
        isActive: boolean;
        maxDailyKhqr: number;
        maxMonthlyPatients: number;
        maxStaffAccounts: number;
        currentSubscription: any;
        recentInvoices: any[];
      }>('/subscriptions/current'),
    getHistory: () =>
      this.request<{
        success: boolean;
        tenantId: string;
        invoices: any[];
      }>('/subscriptions/history'),
    checkCycles: () =>
      this.request<{
        checkedCount: number;
        remindersSent7Days: number;
        remindersSent3Days: number;
        markedPastDue: number;
        markedExpired: number;
        timestamp: string;
      }>('/subscriptions/check-cycles', {
        method: 'POST',
      }),
    createCheckout: (data: { planTier: string; billingCycle?: string }) =>
      this.request<{
        success: boolean;
        subscriptionId: string;
        invoiceNumber: string;
        planTier: string;
        planNameKh: string;
        planNameEn: string;
        billingCycle: string;
        amountUsd: number;
        currency: string;
        tranId: string;
        qrString: string;
        md5: string;
        deeplinks: {
          aba: string;
          bakong: string;
          paywayUrl: string;
        };
        merchant: {
          bakongId: string;
          merchantName: string;
          merchantCity: string;
        };
        expiresAt: string;
      }>('/subscriptions/checkout', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifySettlement: (data: {
      subscriptionId: string;
      tranId?: string;
      md5?: string;
      forceConfirm?: boolean;
    }) =>
      this.request<{
        success: boolean;
        activated: boolean;
        alreadySettled: boolean;
        subscriptionId: string;
        planTier: string;
        amountUsd: number;
        endDate: string;
        newExpiryFormatted?: string;
        addedDays?: number;
        message: string;
      }>('/subscriptions/verify-settlement', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getQuotaStatus: () =>
      this.request<{
        planTier: string;
        planNameEn: string;
        planNameKh: string;
        dailyKhqr: {
          used: number;
          limit: number;
          remaining: number;
          percent: number;
          isApproachingLimit: boolean;
          isExceeded: boolean;
        };
        monthlyPatients: {
          used: number;
          limit: number;
          remaining: number;
          percent: number;
          isApproachingLimit: boolean;
          isExceeded: boolean;
        };
        staffAccounts: {
          used: number;
          limit: number;
          remaining: number;
          percent: number;
          isApproachingLimit: boolean;
          isExceeded: boolean;
        };
      }>('/subscriptions/quota-status'),
    getReceipt: (subscriptionId: string) =>
      this.request<any>(`/subscriptions/invoices/${subscriptionId}/receipt`),
    requestSupport: (data: {
      subscriptionId: string;
      contactPhone?: string;
      telegramUsername?: string;
      issueDescription?: string;
    }) =>
      this.request<{
        success: boolean;
        messageKh: string;
        messageEn: string;
        support: any;
      }>('/subscriptions/request-support', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Step 21 & Step 22: Platform Super Admin Fleet & Remote Governance
  superAdmin = {
    getMetrics: () => this.request<any>('/super-admin/metrics'),
    getTenants: () => this.request<any[]>('/super-admin/tenants'),
    freezeTenant: (id: string, reason?: string) =>
      this.request<any>(`/super-admin/tenants/${id}/freeze`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
    unfreezeTenant: (id: string) =>
      this.request<any>(`/super-admin/tenants/${id}/unfreeze`, {
        method: 'PATCH',
      }),
    overridePlan: (
      id: string,
      data: {
        planTier?: string;
        addDays?: number;
        newExpiryDate?: string;
        maxDailyKhqr?: number;
        maxMonthlyPatients?: number;
        maxStaffAccounts?: number;
        reason?: string;
      },
    ) =>
      this.request<any>(`/super-admin/tenants/${id}/override-plan`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    purgeDemoData: (id: string) =>
      this.request<any>(`/super-admin/tenants/${id}/purge-demo-data`, {
        method: 'POST',
      }),
    getMaintenanceMode: () => this.request<any>('/super-admin/maintenance-mode'),
    setMaintenanceMode: (data: { enabled: boolean; messageKh?: string; messageEn?: string }) =>
      this.request<any>('/super-admin/maintenance-mode', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    impersonate: (id: string) =>
      this.request<any>(`/super-admin/tenants/${id}/impersonate`, {
        method: 'POST',
      }),
    getUsers: (params?: {
      query?: string;
      role?: string;
      tenantId?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    }) => {
      const sp = new URLSearchParams();
      if (params?.query) sp.append('query', params.query);
      if (params?.role && params.role !== 'ALL') sp.append('role', params.role);
      if (params?.tenantId && params.tenantId !== 'ALL') sp.append('tenantId', params.tenantId);
      if (params?.isActive !== undefined) sp.append('isActive', String(params.isActive));
      if (params?.page) sp.append('page', String(params.page));
      if (params?.limit) sp.append('limit', String(params.limit));
      const qs = sp.toString();
      return this.request<{ users: any[]; pagination: any }>(
        `/super-admin/users${qs ? `?${qs}` : ''}`,
      );
    },
    createUser: (data: any) =>
      this.request<any>('/super-admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateUser: (id: string, data: any) =>
      this.request<any>(`/super-admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    resetPassword: (id: string, newPassword: string) =>
      this.request<any>(`/super-admin/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      }),
  };

  // Patient Portal & Telegram Mini App (TMA)
  portal = {
    getPatient: (identifier: string, tenantId?: string) => {
      const q = tenantId ? `?tenantId=${tenantId}` : '';
      return this.request<any>(`/portal/patient/${encodeURIComponent(identifier)}${q}`);
    },
    getLiveQueue: (tenantId?: string) => {
      const q = tenantId ? `?tenantId=${tenantId}` : '';
      return this.request<any>(`/portal/queue/live${q}`);
    },
    formatMedicationReminder: (data: any) =>
      this.request<any>('/portal/reminders/medication', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    formatAppointmentReminder: (data: any) =>
      this.request<any>('/portal/reminders/appointment', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    formatQueueCall: (data: any) =>
      this.request<any>('/portal/reminders/queue-call', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Multi-Branch Chain & Central Warehouse
  warehouse = {
    getHqOverview: () => this.request<any>('/warehouse/hq/overview'),
    getBranches: () => this.request<any[]>('/warehouse/branches'),
    getBranchById: (id: string) => this.request<any>('/warehouse/branches/' + encodeURIComponent(id)),
    getInventoryBatches: (branchId?: string) => {
      const q = branchId ? '?branchId=' + encodeURIComponent(branchId) : '';
      return this.request<any[]>('/warehouse/inventory' + q);
    },
    getExpiringBatches: (branchId?: string, thresholdDays = 90) => {
      const p = new URLSearchParams();
      if (branchId) p.set('branchId', branchId);
      if (thresholdDays) p.set('thresholdDays', String(thresholdDays));
      const qs = p.toString() ? '?' + p.toString() : '';
      return this.request<{ batches: any[]; summary: any }>('/warehouse/inventory/expiring' + qs);
    },
    getTransfers: (branchId?: string, status?: string) => {
      const p = new URLSearchParams();
      if (branchId) p.set('branchId', branchId);
      if (status) p.set('status', status);
      const qs = p.toString() ? '?' + p.toString() : '';
      return this.request<any[]>('/warehouse/transfers' + qs);
    },
    getTransferById: (id: string) => this.request<any>('/warehouse/transfers/' + encodeURIComponent(id)),
    createTransfer: (data: any) =>
      this.request<any>('/warehouse/transfers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    dispatchTransfer: (id: string, data: { dispatchedBy: string; scannedBarcode?: string }) =>
      this.request<any>('/warehouse/transfers/' + encodeURIComponent(id) + '/dispatch', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyAndReceiveTransfer: (id: string, data: any) =>
      this.request<any>('/warehouse/transfers/' + encodeURIComponent(id) + '/receive', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };
  // MoH & Cryptographic Compliance (Phase 7)
  compliance = {
    signCertificate: (data: any) =>
      this.request<any>('/compliance/certificates/sign', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyCertificate: (certNumber: string, sig?: string) => {
      const q = sig ? '?sig=' + encodeURIComponent(sig) : '';
      return this.request<any>('/compliance/certificates/verify/' + encodeURIComponent(certNumber) + q);
    },
    exportDhis2Surveillance: (period?: string) => {
      const q = period ? '?period=' + encodeURIComponent(period) : '';
      return this.request<any>('/compliance/dhis2/export' + q);
    },
    getTrackedDiseases: () => this.request<any[]>('/compliance/dhis2/diseases'),
  };
  // DICOM PACS Medical Imaging (Phase 8)
  pacs = {
    getAllStudies: (params?: { modality?: string; status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.modality) q.append('modality', params.modality);
      if (params?.status) q.append('status', params.status);
      if (params?.search) q.append('search', params.search);
      const queryStr = q.toString() ? '?' + q.toString() : '';
      return this.request<any[]>('/pacs/studies' + queryStr);
    },
    getStudyByUid: (studyInstanceUid: string) =>
      this.request<any>('/pacs/studies/' + encodeURIComponent(studyInstanceUid)),
    saveReport: (studyInstanceUid: string, data: any) =>
      this.request<any>('/pacs/studies/' + encodeURIComponent(studyInstanceUid) + '/report', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    uploadStudy: (data: any) =>
      this.request<any>('/pacs/studies/upload', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    calculateCtr: (data: { cardiacWidthMm: number; thoracicWidthMm: number }) =>
      this.request<any>('/pacs/measurements/ctr', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    calculateCobbAngle: (data: { upperEndplateSlopeDeg: number; lowerEndplateSlopeDeg: number }) =>
      this.request<any>('/pacs/measurements/cobb-angle', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getWindowPresets: (modality?: string) => {
      const q = modality ? '?modality=' + encodeURIComponent(modality) : '';
      return this.request<any[]>('/pacs/presets' + q);
    },
  };
  // Cambodian NSSF & Commercial Insurance (Phase 9)
  insurance = {
    verifyPolicy: (policyNumber: string, provider?: string) => {
      const q = provider ? '?provider=' + encodeURIComponent(provider) : '';
      return this.request<any>('/insurance/policies/verify/' + encodeURIComponent(policyNumber) + q);
    },
    calculateSplitInvoice: (data: {
      policyNumber: string;
      items: Array<{ category: string; description: string; unitPriceUsd: number; quantity: number }>;
    }) =>
      this.request<any>('/insurance/split-invoice/calculate', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    submitClaim: (data: any) =>
      this.request<any>('/insurance/claims/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getClaims: (params?: { provider?: string; status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.provider) q.append('provider', params.provider);
      if (params?.status) q.append('status', params.status);
      if (params?.search) q.append('search', params.search);
      const queryStr = q.toString() ? '?' + q.toString() : '';
      return this.request<any[]>('/insurance/claims' + queryStr);
    },
    settleClaim: (claimNumber: string, data: { settlementRef: string; settledAmountUsd: number }) =>
      this.request<any>('/insurance/claims/' + encodeURIComponent(claimNumber) + '/settle', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    exportNssfBatch: (batchId?: string) => {
      const q = batchId ? '?batchId=' + encodeURIComponent(batchId) : '';
      return this.request<any>('/insurance/nssf/export' + q);
    },
  };
  // Clinical Care Concierge & Adherence (Phase 10)
  concierge = {
    getThreads: (params?: { status?: string; protocol?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.protocol) q.append('protocol', params.protocol);
      if (params?.search) q.append('search', params.search);
      const queryStr = q.toString() ? '?' + q.toString() : '';
      return this.request<any[]>('/concierge/threads' + queryStr);
    },
    triggerProtocol: (data: any) =>
      this.request<any>('/concierge/protocols/trigger', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    processInbound: (threadId: string, data: { senderName: string; content: string }) =>
      this.request<any>('/concierge/threads/' + encodeURIComponent(threadId) + '/inbound', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    sendDoctorReply: (threadId: string, data: { doctorName: string; replyText: string }) =>
      this.request<any>('/concierge/threads/' + encodeURIComponent(threadId) + '/reply', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    recordDose: (threadId: string, data: { confirmed: boolean }) =>
      this.request<any>('/concierge/threads/' + encodeURIComponent(threadId) + '/adherence', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getRedFlags: () => this.request<any[]>('/concierge/red-flags'),
    acknowledgeAlert: (alertId: string, data: { doctorName: string }) =>
      this.request<any>('/concierge/red-flags/' + encodeURIComponent(alertId) + '/acknowledge', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };
  // Smart Clinic Queueing & Digital Signage (Phase 11)
  signage = {
    getBoard: (tenantId?: string) => {
      const q = tenantId ? '?tenantId=' + encodeURIComponent(tenantId) : '';
      return this.request<any>('/signage/board' + q);
    },
    callTicket: (ticketId: string, data: { station: string; staffName?: string }) =>
      this.request<any>('/signage/tickets/' + encodeURIComponent(ticketId) + '/call', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    completeTicket: (ticketId: string) =>
      this.request<any>('/signage/tickets/' + encodeURIComponent(ticketId) + '/complete', {
        method: 'POST',
      }),
    issueTicket: (data: { patientName: string; department: string; priority?: string; tenantId?: string }) =>
      this.request<any>('/signage/kiosk/issue', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };
  // Laboratory Information System & Analyzer Interfacing (Phase 12)
  lis = {
    getOrders: (params?: { status?: string; patientId?: string; hasPanic?: boolean }) => {
      const sp = new URLSearchParams();
      if (params?.status) sp.append('status', params.status);
      if (params?.patientId) sp.append('patientId', params.patientId);
      if (params?.hasPanic !== undefined) sp.append('hasPanic', String(params.hasPanic));
      const q = sp.toString() ? '?' + sp.toString() : '';
      return this.request<any[]>('/lis/orders' + q);
    },
    getOrder: (orderId: string) =>
      this.request<any>('/lis/orders/' + encodeURIComponent(orderId)),
    createAccession: (data: {
      patientId: string;
      patientName: string;
      panelCode: string;
      panelNameEn: string;
      panelNameKh: string;
      tubeType: string;
      orderingDoctor: string;
      phlebotomist: string;
    }) =>
      this.request<any>('/lis/accession', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    ingestResults: (
      orderId: string,
      data: {
        rawProtocolPacket?: string;
        directAnalyteResults?: Array<{ code: string; value: number }>;
        analyzerModel?: string;
        protocol?: string;
      },
    ) =>
      this.request<any>('/lis/orders/' + encodeURIComponent(orderId) + '/ingest', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyOrder: (orderId: string, data: { pathologistName: string; notes?: string }) =>
      this.request<any>('/lis/orders/' + encodeURIComponent(orderId) + '/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getReferenceRanges: () =>
      this.request<Record<string, any>>('/lis/reference-ranges'),
  };
  // Inpatient (IPD) Admission, Bed Management & Nurse e-MAR (Phase 13)
  ipd = {
    getBeds: (params?: { ward?: string; status?: string }) => {
      const sp = new URLSearchParams();
      if (params?.ward) sp.append('ward', params.ward);
      if (params?.status) sp.append('status', params.status);
      const q = sp.toString() ? '?' + sp.toString() : '';
      return this.request<any[]>('/ipd/beds' + q);
    },
    getBedMetrics: () => this.request<any>('/ipd/beds/metrics'),
    admitPatient: (data: any) =>
      this.request<any>('/ipd/admissions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAdmissions: (status?: string) => {
      const q = status ? '?status=' + encodeURIComponent(status) : '';
      return this.request<any[]>('/ipd/admissions' + q);
    },
    getAdmission: (admissionId: string) =>
      this.request<any>('/ipd/admissions/' + encodeURIComponent(admissionId)),
    transferBed: (admissionId: string, data: { targetBedId: string; transferNote?: string }) =>
      this.request<any>('/ipd/admissions/' + encodeURIComponent(admissionId) + '/transfer', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    dischargePatient: (admissionId: string, data?: { dischargeSummary?: string }) =>
      this.request<any>('/ipd/admissions/' + encodeURIComponent(admissionId) + '/discharge', {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }),
    markBedCleaned: (bedId: string) =>
      this.request<any>('/ipd/beds/' + encodeURIComponent(bedId) + '/clean', {
        method: 'POST',
      }),
    getEmar: (admissionId: string) =>
      this.request<any[]>('/ipd/admissions/' + encodeURIComponent(admissionId) + '/emar'),
    scheduleMedication: (admissionId: string, data: any) =>
      this.request<any>('/ipd/admissions/' + encodeURIComponent(admissionId) + '/emar/schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    administerMedication: (admissionId: string, emarId: string, data: any) =>
      this.request<any>(
        '/ipd/admissions/' + encodeURIComponent(admissionId) + '/emar/' + encodeURIComponent(emarId) + '/administer',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      ),
    getFluidBalance: (admissionId: string) =>
      this.request<any[]>('/ipd/admissions/' + encodeURIComponent(admissionId) + '/fluid-balance'),
    recordFluidBalance: (admissionId: string, data: any) =>
      this.request<any>('/ipd/admissions/' + encodeURIComponent(admissionId) + '/fluid-balance', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    calculateIvDrip: (data: { volumeMl: number; durationHours: number; dropFactorGttPerMl?: number }) =>
      this.request<any>('/ipd/calculator/iv-drip', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };
  // Doctor Commission & Real-Time Clinic P&L Financial Engine (Phase 14)
  finance = {
    getSummary: () => this.request<any>('/finance/summary'),
    getPnlReport: (period?: string) => {
      const q = period ? '?period=' + encodeURIComponent(period) : '';
      return this.request<any>('/finance/pnl' + q);
    },
    getExpenses: (params?: { category?: string; startDate?: string; endDate?: string }) => {
      const sp = new URLSearchParams();
      if (params?.category) sp.append('category', params.category);
      if (params?.startDate) sp.append('startDate', params.startDate);
      if (params?.endDate) sp.append('endDate', params.endDate);
      const q = sp.toString() ? '?' + sp.toString() : '';
      return this.request<any>('/finance/expenses' + q);
    },
    createExpense: (data: any) =>
      this.request<any>('/finance/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteExpense: (id: string) =>
      this.request<any>('/finance/expenses/' + encodeURIComponent(id), {
        method: 'DELETE',
      }),
    getDoctorRules: () => this.request<any[]>('/finance/commissions/rules'),
    updateDoctorRule: (doctorId: string, data: any) =>
      this.request<any>('/finance/commissions/rules/' + encodeURIComponent(doctorId), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getCommissionStatements: (params?: { doctorId?: string; period?: string }) => {
      const sp = new URLSearchParams();
      if (params?.doctorId) sp.append('doctorId', params.doctorId);
      if (params?.period) sp.append('period', params.period);
      const q = sp.toString() ? '?' + sp.toString() : '';
      return this.request<any>('/finance/commissions' + q);
    },
    calculateCommission: (doctorId: string, period?: string) =>
      this.request<any>('/finance/commissions/calculate', {
        method: 'POST',
        body: JSON.stringify({ doctorId, period }),
      }),
    approveCommission: (statementId: string, approvedBy: string) =>
      this.request<any>('/finance/commissions/' + encodeURIComponent(statementId) + '/approve', {
        method: 'POST',
        body: JSON.stringify({ approvedBy }),
      }),
    payoutCommission: (statementId: string, data: { paymentMethod: string; paymentRef: string }) =>
      this.request<any>('/finance/commissions/' + encodeURIComponent(statementId) + '/payout', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };
  // Dental Odontogram Interactive Charting & Tooth Treatment Planner (Phase 15)
  dental = {
    getProcedures: () => this.request<any[]>('/dental/procedures'),
    getChart: (patientId: string) =>
      this.request<any>('/dental/patients/' + encodeURIComponent(patientId) + '/chart'),
    saveChart: (patientId: string, data: any) =>
      this.request<any>('/dental/patients/' + encodeURIComponent(patientId) + '/chart', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTooth: (patientId: string, toothNumber: number, data: any) =>
      this.request<any>(
        '/dental/patients/' + encodeURIComponent(patientId) + '/teeth/' + encodeURIComponent(toothNumber),
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
      ),
    getTreatmentPlans: (patientId: string) =>
      this.request<any[]>('/dental/patients/' + encodeURIComponent(patientId) + '/plans'),
    createTreatmentPlan: (patientId: string, data: any) =>
      this.request<any>('/dental/patients/' + encodeURIComponent(patientId) + '/plans', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateTreatmentItemStatus: (planId: string, itemId: string, status: 'DONE' | 'CANCELLED') =>
      this.request<any>(
        '/dental/plans/' + encodeURIComponent(planId) + '/items/' + encodeURIComponent(itemId),
        {
          method: 'PUT',
          body: JSON.stringify({ status }),
        },
      ),
  };

  // Teleconsultation WebRTC Video Call & Digital e-Prescription (Phase 16)
  teleconsult = {
    getIceServers: () => this.request<any[]>('/teleconsult/ice-servers'),
    listRooms: (params?: { status?: string; doctorId?: string; patientId?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.doctorId) q.set('doctorId', params.doctorId);
      if (params?.patientId) q.set('patientId', params.patientId);
      const query = q.toString() ? '?' + q.toString() : '';
      return this.request<any[]>('/teleconsult/rooms' + query);
    },
    getRoom: (id: string) => this.request<any>('/teleconsult/rooms/' + encodeURIComponent(id)),
    createRoom: (data: any) =>
      this.request<any>('/teleconsult/rooms', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    joinRoom: (id: string, role: string, name: string) =>
      this.request<any>('/teleconsult/rooms/' + encodeURIComponent(id) + '/join', {
        method: 'POST',
        body: JSON.stringify({ role, name }),
      }),
    leaveRoom: (id: string, role: string) =>
      this.request<any>('/teleconsult/rooms/' + encodeURIComponent(id) + '/leave', {
        method: 'POST',
        body: JSON.stringify({ role }),
      }),
    updateMediaState: (id: string, role: string, state: any) =>
      this.request<any>('/teleconsult/rooms/' + encodeURIComponent(id) + '/media-state', {
        method: 'POST',
        body: JSON.stringify({ role, ...state }),
      }),
    postSignal: (id: string, signal: any) =>
      this.request<any>('/teleconsult/rooms/' + encodeURIComponent(id) + '/signals', {
        method: 'POST',
        body: JSON.stringify(signal),
      }),
    getSignals: (id: string, since?: string, recipientRole?: string) => {
      const q = new URLSearchParams();
      if (since) q.set('since', since);
      if (recipientRole) q.set('recipientRole', recipientRole);
      const query = q.toString() ? '?' + q.toString() : '';
      return this.request<any[]>('/teleconsult/rooms' + encodeURIComponent(id) + '/signals' + query);
    },
    sendChatMessage: (id: string, message: { senderRole: string; senderName: string; message: string }) =>
      this.request<any>('/teleconsult/rooms/' + encodeURIComponent(id) + '/chat', {
        method: 'POST',
        body: JSON.stringify(message),
      }),
    getChatMessages: (id: string) =>
      this.request<any[]>('/teleconsult/rooms/' + encodeURIComponent(id) + '/chat'),
    endCall: (id: string, clinicalNotes?: string) =>
      this.request<any>('/teleconsult/rooms/' + encodeURIComponent(id) + '/end', {
        method: 'POST',
        body: JSON.stringify({ clinicalNotes }),
      }),
    listPrescriptions: (patientId?: string) => {
      const q = patientId ? '?patientId=' + encodeURIComponent(patientId) : '';
      return this.request<any[]>('/teleconsult/prescriptions' + q);
    },
    getPrescription: (id: string) =>
      this.request<any>('/teleconsult/prescriptions/' + encodeURIComponent(id)),
    createPrescription: (data: any) =>
      this.request<any>('/teleconsult/prescriptions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyPrescription: (id: string, signatureHash: string) =>
      this.request<any>('/teleconsult/prescriptions/' + encodeURIComponent(id) + '/verify', {
        method: 'POST',
        body: JSON.stringify({ signatureHash }),
      }),
    dispensePrescription: (id: string, pharmacyName: string) =>
      this.request<any>('/teleconsult/prescriptions/' + encodeURIComponent(id) + '/dispense', {
        method: 'POST',
        body: JSON.stringify({ pharmacyName }),
      }),
  };

  // Electronic Claim XML/JSON Format for Insurance & MoH Disease Surveillance (Phase 17)
  eclaim = {
    listClaims: (params?: { insurer?: string; status?: string; patientId?: string }) => {
      const q = new URLSearchParams();
      if (params?.insurer) q.set('insurer', params.insurer);
      if (params?.status) q.set('status', params.status);
      if (params?.patientId) q.set('patientId', params.patientId);
      const query = q.toString() ? '?' + q.toString() : '';
      return this.request<any[]>('/eclaim/claims' + query);
    },
    getClaim: (id: string) => this.request<any>('/eclaim/claims/' + encodeURIComponent(id)),
    createClaim: (data: any) =>
      this.request<any>('/eclaim/claims', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getClaimXml: (id: string) => this.request<any>('/eclaim/claims/' + encodeURIComponent(id) + '/xml'),
    getClaimFhir: (id: string) => this.request<any>('/eclaim/claims/' + encodeURIComponent(id) + '/fhir'),
    submitClaim: (id: string) =>
      this.request<any>('/eclaim/claims/' + encodeURIComponent(id) + '/submit', {
        method: 'POST',
      }),
    adjudicateClaim: (id: string, decision: { status: string; notes: string }) =>
      this.request<any>('/eclaim/claims/' + encodeURIComponent(id) + '/adjudicate', {
        method: 'POST',
        body: JSON.stringify(decision),
      }),
    validateXml: (xml: string) =>
      this.request<any>('/eclaim/validate-xml', {
        method: 'POST',
        body: JSON.stringify({ xml }),
      }),
    listDiseases: () => this.request<any[]>('/eclaim/surveillance/diseases'),
    listSurveillanceCases: (params?: { period?: string; diseaseCode?: string }) => {
      const q = new URLSearchParams();
      if (params?.period) q.set('period', params.period);
      if (params?.diseaseCode) q.set('diseaseCode', params.diseaseCode);
      const query = q.toString() ? '?' + q.toString() : '';
      return this.request<any[]>('/eclaim/surveillance/cases' + query);
    },
    recordSurveillanceCase: (data: any) =>
      this.request<any>('/eclaim/surveillance/cases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getDhis2Xml: (period?: string) => {
      const q = period ? '?period=' + encodeURIComponent(period) : '';
      return this.request<any>('/eclaim/surveillance/dhis2-xml' + q);
    },
    getDhis2Json: (period?: string) => {
      const q = period ? '?period=' + encodeURIComponent(period) : '';
      return this.request<any>('/eclaim/surveillance/dhis2-json' + q);
    },
  };
};

export const api = new ApiClient();

