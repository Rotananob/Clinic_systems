export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('vercel.app')) {
      return 'https://houn-vannak-clinic-backend.onrender.com/api';
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

      // 2. Mutation (POST/PUT/PATCH/DELETE) offline / network failure -> Optimistic execution & Queue
      if (!isGet && isNetworkError) {
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
}

export const api = new ApiClient();
