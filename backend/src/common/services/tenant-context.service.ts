import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId: string | null;
  slug?: string | null;
  planTier?: string | null;
  isSuperAdminBypass?: boolean;
}

@Injectable()
export class TenantContextService {
  private static readonly asyncLocalStorage = new AsyncLocalStorage<TenantStore>();

  /**
   * Run an asynchronous callback within a specific tenant context
   */
  run<R>(store: TenantStore, callback: () => R): R {
    return TenantContextService.asyncLocalStorage.run(store, callback);
  }

  /**
   * Retrieve the active tenant context store
   */
  getStore(): TenantStore | undefined {
    return TenantContextService.asyncLocalStorage.getStore();
  }

  /**
   * Get the active tenant ID, or null if running in global/unscoped context
   */
  static getTenantId(): string | null {
    return TenantContextService.asyncLocalStorage.getStore()?.tenantId || null;
  }

  getTenantId(): string | null {
    return TenantContextService.getTenantId();
  }

  /**
   * Get the active tenant subdomain slug, or null
   */
  static getTenantSlug(): string | null {
    return TenantContextService.asyncLocalStorage.getStore()?.slug || null;
  }

  getTenantSlug(): string | null {
    return TenantContextService.getTenantSlug();
  }

  /**
   * Check if Super Admin bypass is active
   */
  static isSuperAdminBypass(): boolean {
    return TenantContextService.asyncLocalStorage.getStore()?.isSuperAdminBypass === true;
  }

  isSuperAdminBypass(): boolean {
    return TenantContextService.isSuperAdminBypass();
  }
}
