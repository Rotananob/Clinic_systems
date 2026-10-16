// Offline & Synchronization Manager for Rotana Clinic
// Local-First architecture using browser IndexedDB
import { getApiBaseUrl } from './api';

export type SyncState = 'OFFLINE' | 'LOCAL_SAVE' | 'SYNCING' | 'SYNCED' | 'SYNC_FAILED';

export interface QueuedMutation {
  id?: number;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: any;
  label: string;
  status: 'PENDING' | 'SYNCING' | 'FAILED' | 'COMPLETED';
  retryCount: number;
  createdAt: string;
  errorMessage?: string;
}

export interface SyncStatusInfo {
  state: SyncState;
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
}

const DB_NAME = 'clinic_offline_db';
const DB_VERSION = 1;
const STORE_MUTATIONS = 'offline_mutations';
const STORE_CACHE = 'cached_records';

class OfflineSyncManager {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private listeners: Set<(info: SyncStatusInfo) => void> = new Set();
  private state: SyncState = 'SYNCED';
  private lastSyncedAt: string | null = null;
  private isSyncing = false;

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

  private initDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB not supported'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_MUTATIONS)) {
          const mutationStore = db.createObjectStore(STORE_MUTATIONS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          mutationStore.createIndex('status', 'status', { unique: false });
          mutationStore.createIndex('createdAt', 'createdAt', { unique: false });
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

    let computedState: SyncState = this.state;
    if (!isOnline) {
      computedState = pendingCount > 0 ? 'LOCAL_SAVE' : 'OFFLINE';
    } else if (this.isSyncing) {
      computedState = 'SYNCING';
    } else if (pendingCount > 0) {
      computedState = 'LOCAL_SAVE';
    }

    return {
      state: computedState,
      isOnline,
      pendingCount,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  public async queueMutation(mutation: Omit<QueuedMutation, 'id' | 'status' | 'retryCount' | 'createdAt'>): Promise<number> {
    const db = await this.initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_MUTATIONS, 'readwrite');
      const store = tx.objectStore(STORE_MUTATIONS);

      const record: QueuedMutation = {
        ...mutation,
        status: 'PENDING',
        retryCount: 0,
        createdAt: new Date().toISOString(),
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

  public async syncPending(): Promise<{ total: number; succeeded: number; failed: number }> {
    if (this.isSyncing) return { total: 0, succeeded: 0, failed: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { total: 0, succeeded: 0, failed: 0 };
    }

    const pending = await this.getPendingMutations();
    if (pending.length === 0) {
      this.state = 'SYNCED';
      this.notify();
      return { total: 0, succeeded: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.state = 'SYNCING';
    this.notify();

    let succeeded = 0;
    let failed = 0;
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

        const res = await fetch(fullUrl, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (res.ok) {
          await this.removeMutation(item.id!);
          succeeded++;
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

    if (remainingCount === 0) {
      this.state = 'SYNCED';
      this.lastSyncedAt = new Date().toLocaleTimeString();
    } else {
      this.state = failed > 0 ? 'SYNC_FAILED' : 'LOCAL_SAVE';
    }

    this.notify();

    // Broadcast real-time synchronization completion event to auto-refresh all views without page reload
    if (typeof window !== 'undefined' && succeeded > 0) {
      window.dispatchEvent(
        new CustomEvent('clinic_data_synced', {
          detail: { succeeded, failed, total: pending.length },
        })
      );
      window.dispatchEvent(
        new CustomEvent('clinic_data_changed', {
          detail: { type: 'SYNC_COMPLETE', succeeded },
        })
      );
    }

    return { total: pending.length, succeeded, failed };
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

  // Local-First Read Caching
  public async cacheData(key: string, data: any): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`clinic_cache_${key}`, JSON.stringify(data));
      } catch {
        // Ignore localStorage quota limit
      }
    }

    try {
      const db = await this.initDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CACHE, 'readwrite');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.put({ key, data, cachedAt: new Date().toISOString() });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignore cache failure
    }
  }

  public async getCachedData<T>(key: string): Promise<T | null> {
    // 1. Instant recovery from localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`clinic_cache_${key}`);
        if (raw) return JSON.parse(raw);
      } catch {}
    }

    // 2. Recovery from IndexedDB
    try {
      const db = await this.initDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_CACHE, 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  // Prepend an optimistically created item to cached collections
  public async prependCachedItem(collectionKey: string, item: any): Promise<void> {
    try {
      const existing = await this.getCachedData<any>(collectionKey);
      if (Array.isArray(existing)) {
        const updated = [item, ...existing];
        await this.cacheData(collectionKey, updated);
      } else if (existing && Array.isArray(existing.data)) {
        const updated = {
          ...existing,
          data: [item, ...existing.data],
          meta: {
            ...existing.meta,
            total: (existing.meta?.total || existing.data.length) + 1,
          },
        };
        await this.cacheData(collectionKey, updated);
      } else {
        await this.cacheData(collectionKey, [item]);
      }
    } catch (err) {
      console.warn('Failed to prepend cached item:', err);
    }
  }

  // Update an existing item in cached collections
  public async updateCachedItem(
    collectionKey: string,
    predicate: (item: any) => boolean,
    updater: (item: any) => any
  ): Promise<void> {
    try {
      const existing = await this.getCachedData<any>(collectionKey);
      if (Array.isArray(existing)) {
        const updated = existing.map((el) => (predicate(el) ? updater(el) : el));
        await this.cacheData(collectionKey, updated);
      } else if (existing && Array.isArray(existing.data)) {
        const updated = {
          ...existing,
          data: existing.data.map((el: any) => (predicate(el) ? updater(el) : el)),
        };
        await this.cacheData(collectionKey, updated);
      }
    } catch (err) {
      console.warn('Failed to update cached item:', err);
    }
  }
}

export const syncManager = new OfflineSyncManager();
