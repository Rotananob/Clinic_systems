// Offline & Synchronization Manager for ClinicOS Multi-Tenant SaaS
// Local-First architecture using browser IndexedDB and AES-256 encrypted storage

const CIPHER_PREFIX = 'enc:v1:';

function getCryptoSubtle(): SubtleCrypto | null {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto && (globalThis as any).crypto.subtle) {
    return (globalThis as any).crypto.subtle;
  }
  return null;
}

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  let binary: string;
  if (typeof atob !== 'undefined') {
    binary = atob(base64);
  } else {
    binary = Buffer.from(base64, 'base64').toString('binary');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function deriveTenantCryptoKey(tenantSlug = 'default'): Promise<CryptoKey | null> {
  const subtle = getCryptoSubtle();
  if (!subtle) return null;

  const rawKeyMaterial = new TextEncoder().encode(`clinicos:edge:resiliency:${tenantSlug.toLowerCase().trim()}`);
  const keyHash = await subtle.digest('SHA-256', rawKeyMaterial);

  return subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptOfflineData(data: any, tenantSlug = 'default'): Promise<string> {
  const jsonString = JSON.stringify(data);
  const subtle = getCryptoSubtle();

  if (!subtle) {
    const rawBytes = new TextEncoder().encode(jsonString);
    return `plain:v1:${arrayBufferToBase64(rawBytes)}`;
  }

  try {
    const key = await deriveTenantCryptoKey(tenantSlug);
    if (!key) throw new Error('Failed to derive crypto key');

    const iv = new Uint8Array(12);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(iv);
    } else {
      for (let i = 0; i < 12; i++) iv[i] = Math.floor(Math.random() * 256);
    }

    const encodedData = new TextEncoder().encode(jsonString);
    const cipherBuffer = await subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    const ivB64 = arrayBufferToBase64(iv);
    const cipherB64 = arrayBufferToBase64(cipherBuffer);

    return `${CIPHER_PREFIX}${ivB64}:${cipherB64}`;
  } catch {
    const rawBytes = new TextEncoder().encode(jsonString);
    return `plain:v1:${arrayBufferToBase64(rawBytes)}`;
  }
}

export async function decryptOfflineData<T>(encryptedString: string, tenantSlug = 'default'): Promise<T | null> {
  if (!encryptedString) return null;

  if (encryptedString.startsWith('plain:v1:')) {
    const base64 = encryptedString.slice('plain:v1:'.length);
    const buffer = base64ToArrayBuffer(base64);
    const decoded = new TextDecoder().decode(buffer);
    return JSON.parse(decoded) as T;
  }

  if (encryptedString.startsWith(CIPHER_PREFIX)) {
    const subtle = getCryptoSubtle();
    if (!subtle) return null;

    try {
      const parts = encryptedString.slice(CIPHER_PREFIX.length).split(':');
      if (parts.length !== 2) return null;

      const [ivB64, cipherB64] = parts;
      const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
      const cipherBuffer = base64ToArrayBuffer(cipherB64);

      const key = await deriveTenantCryptoKey(tenantSlug);
      if (!key) return null;

      const decryptedBuffer = await subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherBuffer
      );

      const jsonString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(jsonString) as T;
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(encryptedString) as T;
  } catch {
    return null;
  }
}

function extractTenantSubdomain(rawHost: string | null | undefined): string | null {
  if (!rawHost) return null;
  const host = rawHost.split(':')[0].trim().toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === 'clinicos.app' || host === 'www.clinicos.app') {
    return null;
  }
  if (host.endsWith('.localhost')) return host.replace('.localhost', '');
  if (host.endsWith('.clinicos.app')) return host.replace('.clinicos.app', '');
  return null;
}

function getApiBaseUrl(): string {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
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

export type SyncState = 'OFFLINE' | 'LOCAL_SAVE' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED' | 'CONFLICT';

export interface QueuedMutation {
  id?: number;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: any;
  label: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED' | 'CONFLICT';
  retryCount: number;
  createdAt: string;
  errorMessage?: string;
  tenantSlug?: string;
  clientRevision?: number;
  serverConflictData?: any;
}

export interface SyncStatusInfo {
  state: SyncState;
  isOnline: boolean;
  pendingCount: number;
  conflictCount: number;
  lastSyncedAt: string | null;
  activeTenant: string;
}

const DB_NAME = 'clinic_offline_db';
const DB_VERSION = 2;
const STORE_MUTATIONS = 'offline_mutations';
const STORE_CACHE = 'cached_records';

class OfflineSyncManager {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private listeners: Set<(info: SyncStatusInfo) => void> = new Set();
  private state: SyncState = 'SYNCED';
  private lastSyncedAt: string | null = null;
  private isSyncing = false;
  private offlineQueueCounter = 100;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initDb();
      this.state = navigator.onLine ? 'SYNCED' : 'OFFLINE';

      window.addEventListener('online', () => {
        this.notify();
        this.syncPending();
      });

      window.addEventListener('offline', () => {
        this.state = 'OFFLINE';
        this.notify();
      });
    }
  }

  public getActiveTenantSlug(): string {
    if (typeof window === 'undefined') return 'default';

    // 1. Check document cookie
    try {
      const match = document.cookie.match(/(?:^|;\s*)clinicos_tenant_slug=([^;]+)/);
      if (match && match[1]) return decodeURIComponent(match[1]).toLowerCase().trim();
    } catch {
      // ignore
    }

    // 2. Check hostname subdomain
    try {
      const subdomain = extractTenantSubdomain(window.location.hostname);
      if (subdomain) return subdomain.toLowerCase().trim();
    } catch {
      // ignore
    }

    return 'default';
  }

  private initDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
          const mutationStore = db.createObjectStore(STORE_MUTATIONS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          mutationStore.createIndex('status', 'status', { unique: false });
          mutationStore.createIndex('createdAt', 'createdAt', { unique: false });
          mutationStore.createIndex('tenantSlug', 'tenantSlug', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  public subscribe(listener: (info: SyncStatusInfo) => void): () => void {
    this.listeners.add(listener);
    this.getStatus().then((status) => listener(status));
    return () => this.listeners.delete(listener);
  }

  private async notify() {
    const status = await this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  public async getStatus(): Promise<SyncStatusInfo> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const pendingCount = await this.getPendingCount();
    const conflictCount = await this.getConflictCount();

    let computedState: SyncState = this.state;
    if (!isOnline) {
      computedState = pendingCount > 0 ? 'LOCAL_SAVE' : 'OFFLINE';
    } else if (this.isSyncing) {
      computedState = 'SYNCING';
    } else if (conflictCount > 0) {
      computedState = 'CONFLICT';
    } else if (pendingCount > 0) {
      computedState = 'LOCAL_SAVE';
    }

    return {
      state: computedState,
      isOnline,
      pendingCount,
      conflictCount,
      lastSyncedAt: this.lastSyncedAt,
      activeTenant: this.getActiveTenantSlug(),
    };
  }

  public async queueMutation(
    mutation: Omit<QueuedMutation, 'id' | 'status' | 'retryCount' | 'createdAt'>
  ): Promise<number> {
    const db = await this.initDb();
    const activeTenant = mutation.tenantSlug || this.getActiveTenantSlug();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
      const store = tx.objectStore(STORE_MUTATIONS);

      const record: QueuedMutation = {
        ...mutation,
        tenantSlug: activeTenant,
        status: 'PENDING',
        retryCount: 0,
        createdAt: new Date().toISOString(),
        clientRevision: Date.now(),
      };

      const request = store.add(record);

      request.onsuccess = () => {
        this.state = 'LOCAL_SAVE';
        this.notify();

        // Broadcast real-time change event to all active UI listeners
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('clinic_data_changed', {
              detail: { type: 'MUTATION_QUEUED', mutation: record },
            })
          );
        }

        resolve(request.result as number);

        // If online, immediately try to sync
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          this.syncPending();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async getPendingCount(): Promise<number> {
    try {
      const db = await this.initDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MUTATIONS, 'readonly');
        const store = tx.objectStore(STORE_MUTATIONS);
        const index = store.index('status');
        const request = index.count(IDBKeyRange.only('PENDING'));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  public async getConflictCount(): Promise<number> {
    try {
      const db = await this.initDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_MUTATIONS, 'readonly');
        const store = tx.objectStore(STORE_MUTATIONS);
        const index = store.index('status');
        const request = index.count(IDBKeyRange.only('CONFLICT'));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  public async getPendingMutations(): Promise<QueuedMutation[]> {
    try {
      const db = await this.initDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_MUTATIONS, 'readonly');
        const store = tx.objectStore(STORE_MUTATIONS);
        const request = store.getAll();
        request.onsuccess = () => {
          const all = (request.result as QueuedMutation[]) || [];
          resolve(all.filter((m) => m.status === 'PENDING' || m.status === 'FAILED'));
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  public async getConflictMutations(): Promise<QueuedMutation[]> {
    try {
      const db = await this.initDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_MUTATIONS, 'readonly');
        const store = tx.objectStore(STORE_MUTATIONS);
        const request = store.getAll();
        request.onsuccess = () => {
          const all = (request.result as QueuedMutation[]) || [];
          resolve(all.filter((m) => m.status === 'CONFLICT'));
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  public async resolveConflict(id: number, resolution: 'SERVER_WINS' | 'CLIENT_WINS'): Promise<void> {
    const db = await this.initDb();
    if (resolution === 'SERVER_WINS') {
      await this.removeMutation(id);
    } else {
      // Re-queue client version with force flag
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
        const store = tx.objectStore(STORE_MUTATIONS);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const item = getReq.result as QueuedMutation;
          if (item) {
            item.status = 'PENDING';
            item.retryCount = 0;
            item.clientRevision = Date.now();
            store.put(item);
          }
          resolve();
        };
        getReq.onerror = () => reject(getReq.error);
      });
    }
    this.notify();
  }

  public async syncPending(): Promise<{ total: number; succeeded: number; failed: number; conflicts: number }> {
    if (this.isSyncing) return { total: 0, succeeded: 0, failed: 0, conflicts: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { total: 0, succeeded: 0, failed: 0, conflicts: 0 };
    }

    const pending = await this.getPendingMutations();
    if (pending.length === 0) {
      this.state = 'SYNCED';
      this.notify();
      return { total: 0, succeeded: 0, failed: 0, conflicts: 0 };
    }

    this.isSyncing = true;
    this.state = 'SYNCING';
    this.notify();

    let succeeded = 0;
    let failed = 0;
    let conflicts = 0;

    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('clinic_access_token') || localStorage.getItem('token')
        : null;

    const baseUrl = getApiBaseUrl();

    for (const item of pending) {
      try {
        const fullUrl = item.endpoint.startsWith('http')
          ? item.endpoint
          : `${baseUrl}${item.endpoint.startsWith('/') ? '' : '/'}${item.endpoint.replace(/^\/api\/?/, '')}`;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        if (item.tenantSlug) {
          headers['x-tenant-slug'] = item.tenantSlug;
        }

        const res = await fetch(fullUrl, {
          method: item.method,
          headers,
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (res.ok) {
          await this.removeMutation(item.id!);
          succeeded++;
        } else if (res.status === 409) {
          // Conflict detected (optimistic concurrency version collision)
          item.status = 'CONFLICT';
          try {
            item.serverConflictData = await res.json();
          } catch {
            item.serverConflictData = { error: 'Conflict occurred on server' };
          }
          await this.updateMutation(item);
          conflicts++;
        } else {
          item.retryCount += 1;
          item.status = 'FAILED';
          item.errorMessage = `HTTP ${res.status}: ${res.statusText}`;
          await this.updateMutation(item);
          failed++;
        }
      } catch (err: any) {
        item.retryCount += 1;
        item.status = 'FAILED';
        item.errorMessage = err?.message || 'Network request failed';
        await this.updateMutation(item);
        failed++;
      }
    }

    this.isSyncing = false;
    const remainingCount = await this.getPendingCount();
    const remainingConflicts = await this.getConflictCount();

    if (remainingCount === 0 && remainingConflicts === 0) {
      this.state = 'SYNCED';
      this.lastSyncedAt = new Date().toLocaleTimeString();
    } else if (remainingConflicts > 0) {
      this.state = 'CONFLICT';
    } else {
      this.state = failed > 0 ? 'SYNC_FAILED' : 'LOCAL_SAVE';
    }

    this.notify();

    // Broadcast synchronization completion event
    if (typeof window !== 'undefined' && succeeded > 0) {
      window.dispatchEvent(
        new CustomEvent('clinic_data_synced', {
          detail: { succeeded, failed, conflicts, total: pending.length },
        })
      );
      window.dispatchEvent(
        new CustomEvent('clinic_data_changed', {
          detail: { type: 'SYNC_COMPLETE', succeeded },
        })
      );
    }

    return { total: pending.length, succeeded, failed, conflicts };
  }

  private async removeMutation(id: number): Promise<void> {
    const db = await this.initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async updateMutation(item: QueuedMutation): Promise<void> {
    const db = await this.initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
      const store = tx.objectStore(STORE_MUTATIONS);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Tenant-Scoped and Encrypted Read Caching
  public async cacheData(key: string, data: any, tenantSlug?: string): Promise<void> {
    const activeTenant = tenantSlug || this.getActiveTenantSlug();
    const scopedKey = `${activeTenant}:${key}`;

    try {
      const encryptedString = await encryptOfflineData(data, activeTenant);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`clinic_cache_${scopedKey}`, encryptedString);
        } catch {
          // Ignore localStorage quota limit
        }
      }

      const db = await this.initDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CACHE, 'readwrite');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.put({
          key: scopedKey,
          data: encryptedString,
          tenantSlug: activeTenant,
          cachedAt: new Date().toISOString(),
        });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignore cache failure
    }
  }

  public async getCachedData<T>(key: string, tenantSlug?: string): Promise<T | null> {
    const activeTenant = tenantSlug || this.getActiveTenantSlug();
    const scopedKey = `${activeTenant}:${key}`;

    // 1. Check localStorage first
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`clinic_cache_${scopedKey}`);
        if (raw) {
          const decrypted = await decryptOfflineData<T>(raw, activeTenant);
          if (decrypted !== null) return decrypted;
        }
      } catch {}
    }

    // 2. Recovery from IndexedDB
    try {
      const db = await this.initDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_CACHE, 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.get(scopedKey);
        req.onsuccess = async () => {
          if (req.result && req.result.data) {
            const decrypted = await decryptOfflineData<T>(req.result.data, activeTenant);
            resolve(decrypted);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  // Prepend an optimistically created item to cached collections
  public async prependCachedItem(collectionKey: string, item: any, tenantSlug?: string): Promise<void> {
    try {
      const activeTenant = tenantSlug || this.getActiveTenantSlug();
      const existing = await this.getCachedData<any>(collectionKey, activeTenant);
      if (Array.isArray(existing)) {
        const updated = [item, ...existing];
        await this.cacheData(collectionKey, updated, activeTenant);
      } else if (existing && Array.isArray(existing.data)) {
        const updated = {
          ...existing,
          data: [item, ...existing.data],
          meta: {
            ...existing.meta,
            total: (existing.meta?.total || existing.data.length) + 1,
          },
        };
        await this.cacheData(collectionKey, updated, activeTenant);
      } else {
        await this.cacheData(collectionKey, [item], activeTenant);
      }
    } catch (err) {
      console.warn('Failed to prepend cached item:', err);
    }
  }

  // Update an existing item in cached collections
  public async updateCachedItem(
    collectionKey: string,
    predicate: (item: any) => boolean,
    updater: (item: any) => any,
    tenantSlug?: string
  ): Promise<void> {
    try {
      const activeTenant = tenantSlug || this.getActiveTenantSlug();
      const existing = await this.getCachedData<any>(collectionKey, activeTenant);
      if (Array.isArray(existing)) {
        const updated = existing.map((el) => (predicate(el) ? updater(el) : el));
        await this.cacheData(collectionKey, updated, activeTenant);
      } else if (existing && Array.isArray(existing.data)) {
        const updated = {
          ...existing,
          data: existing.data.map((el: any) => (predicate(el) ? updater(el) : el)),
        };
        await this.cacheData(collectionKey, updated, activeTenant);
      }
    } catch (err) {
      console.warn('Failed to update cached item:', err);
    }
  }

  // Helper to generate temporary offline queue ticket
  public generateOfflineQueueNumber(servicePrefix = 'OFF'): string {
    this.offlineQueueCounter += 1;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
    return `${servicePrefix}-${timeStr}-${this.offlineQueueCounter}`;
  }
}

export const syncManager = new OfflineSyncManager();
