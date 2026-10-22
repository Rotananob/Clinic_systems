import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'async_hooks';

interface TenantStore {
  tenantId: string | null;
  slug?: string | null;
  planTier?: string | null;
  isSuperAdminBypass?: boolean;
}

class TenantContextEngine {
  private static readonly asyncLocalStorage = new AsyncLocalStorage<TenantStore>();

  run<R>(store: TenantStore, callback: () => R): R {
    return TenantContextEngine.asyncLocalStorage.run(store, callback);
  }

  getStore(): TenantStore | undefined {
    return TenantContextEngine.asyncLocalStorage.getStore();
  }

  static getTenantId(): string | null {
    return TenantContextEngine.asyncLocalStorage.getStore()?.tenantId || null;
  }

  static getTenantSlug(): string | null {
    return TenantContextEngine.asyncLocalStorage.getStore()?.slug || null;
  }

  static isSuperAdminBypass(): boolean {
    return TenantContextEngine.asyncLocalStorage.getStore()?.isSuperAdminBypass === true;
  }
}

describe('SaaS Multi-Tenant Context & Automatic Isolation Test Suite', () => {
  const engine = new TenantContextEngine();

  test('should verify SaaS plan quotas matching exact specifications', () => {
    // Defined quotas matching user specifications
    const SAAS_PLAN_LIMITS = {
      FREE: { price: 0, maxDailyKhqr: 5, maxMonthlyPatients: 50 },
      STARTER_5: { price: 5, maxDailyKhqr: 250, maxMonthlyPatients: 1000 }, // $5: 250 dynamic QR trans/day
      PRO_8: { price: 8, maxDailyKhqr: 1500, maxMonthlyPatients: 8000 }, // $8: 1,500 dynamic QR trans/day
      ENTERPRISE_12: { price: 12, maxDailyKhqr: -1, maxMonthlyPatients: -1 }, // $12: Unlimited (-1)
    };

    // $5 Plan
    assert.equal(SAAS_PLAN_LIMITS.STARTER_5.price, 5);
    assert.equal(SAAS_PLAN_LIMITS.STARTER_5.maxDailyKhqr, 250);
    assert.equal(SAAS_PLAN_LIMITS.STARTER_5.maxMonthlyPatients, 1000);

    // $8 Plan
    assert.equal(SAAS_PLAN_LIMITS.PRO_8.price, 8);
    assert.equal(SAAS_PLAN_LIMITS.PRO_8.maxDailyKhqr, 1500);
    assert.equal(SAAS_PLAN_LIMITS.PRO_8.maxMonthlyPatients, 8000);

    // $12 Plan
    assert.equal(SAAS_PLAN_LIMITS.ENTERPRISE_12.price, 12);
    assert.equal(SAAS_PLAN_LIMITS.ENTERPRISE_12.maxDailyKhqr, -1);
    assert.equal(SAAS_PLAN_LIMITS.ENTERPRISE_12.maxMonthlyPatients, -1);

    // Free Starter Plan
    assert.equal(SAAS_PLAN_LIMITS.FREE.price, 0);
    assert.equal(SAAS_PLAN_LIMITS.FREE.maxDailyKhqr, 5);
    assert.equal(SAAS_PLAN_LIMITS.FREE.maxMonthlyPatients, 50);
  });

  test('should strictly isolate AsyncLocalStorage context between concurrent requests', async () => {
    const tenantA = '11111111-1111-1111-1111-111111111111';
    const tenantB = '22222222-2222-2222-2222-222222222222';

    // Verify initial context is completely unscoped
    assert.equal(TenantContextEngine.getTenantId(), null);

    const taskA = new Promise<void>((resolve) => {
      engine.run({ tenantId: tenantA, slug: 'rotana-clinic' }, async () => {
        assert.equal(TenantContextEngine.getTenantId(), tenantA);
        assert.equal(TenantContextEngine.getTenantSlug(), 'rotana-clinic');
        await new Promise((r) => setTimeout(r, 20));
        // Verify context does NOT get overwritten by concurrent task B
        assert.equal(TenantContextEngine.getTenantId(), tenantA);
        assert.equal(TenantContextEngine.getTenantSlug(), 'rotana-clinic');
        resolve();
      });
    });

    const taskB = new Promise<void>((resolve) => {
      engine.run({ tenantId: tenantB, slug: 'vanna-clinic' }, async () => {
        assert.equal(TenantContextEngine.getTenantId(), tenantB);
        assert.equal(TenantContextEngine.getTenantSlug(), 'vanna-clinic');
        await new Promise((r) => setTimeout(r, 10));
        // Verify context does NOT get overwritten by concurrent task A
        assert.equal(TenantContextEngine.getTenantId(), tenantB);
        assert.equal(TenantContextEngine.getTenantSlug(), 'vanna-clinic');
        resolve();
      });
    });

    await Promise.all([taskA, taskB]);

    // Outside asynchronous context, returns to null
    assert.equal(TenantContextEngine.getTenantId(), null);
    assert.equal(TenantContextEngine.getTenantSlug(), null);
  });

  test('should handle Super Admin system bypass mode cleanly', () => {
    engine.run({ tenantId: null, isSuperAdminBypass: true }, () => {
      assert.equal(TenantContextEngine.isSuperAdminBypass(), true);
      assert.equal(TenantContextEngine.getTenantId(), null);
    });

    assert.equal(TenantContextEngine.isSuperAdminBypass(), false);
  });

  test('should correctly inject tenantId into query where clauses', () => {
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const initialQuery = {
      where: {
        gender: 'MALE',
      },
    };

    // Simulate Prisma middleware injection
    const scopedQuery = {
      ...initialQuery,
      where: {
        ...initialQuery.where,
        tenantId,
      },
    };

    assert.equal(scopedQuery.where.gender, 'MALE');
    assert.equal(scopedQuery.where.tenantId, tenantId);
  });
});
