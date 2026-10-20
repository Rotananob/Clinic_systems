import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from '../common/services/tenant-context.service';

const TENANT_SCOPED_MODELS = new Set([
  'Patient',
  'Visit',
  'Prescription',
  'Invoice',
  'FollowUp',
  'AuditLog',
  'Document',
  'VisitorLog',
]);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.setupTenantIsolationMiddleware();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Automatic Tenant Isolation Middleware (Step 4 of SaaS Roadmap)
   * Injects tenantId filtering into queries for all tenant-scoped clinical models
   */
  private setupTenantIsolationMiddleware() {
    this.$use(async (params, next) => {
      // 1. Bypass check: If explicitly marked to bypass, or model is not tenant-scoped
      if (
        (params as any).__bypassTenantScoping ||
        !params.model ||
        !TENANT_SCOPED_MODELS.has(params.model)
      ) {
        return next(params);
      }

      // 2. Retrieve active tenant from AsyncLocalStorage
      const tenantId = TenantContextService.getTenantId();

      // If no tenant is active or superadmin bypass is active, proceed without scoping
      if (!tenantId || TenantContextService.isSuperAdminBypass()) {
        return next(params);
      }

      // 3. Read queries: findMany, findFirst, count, aggregate, groupBy
      if (
        params.action === 'findMany' ||
        params.action === 'count' ||
        params.action === 'aggregate' ||
        params.action === 'groupBy'
      ) {
        params.args = params.args || {};
        params.args.where = {
          ...(params.args.where || {}),
          tenantId,
        };
      } else if (params.action === 'findFirst') {
        params.args = params.args || {};
        params.args.where = {
          ...(params.args.where || {}),
          tenantId,
        };
      } else if (params.action === 'findUnique') {
        // Transform findUnique to findFirst to enforce compound tenantId isolation
        params.action = 'findFirst';
        params.args = params.args || {};
        params.args.where = {
          ...(params.args.where || {}),
          tenantId,
        };
      }

      // 4. Write operations: create, createMany
      else if (params.action === 'create') {
        params.args = params.args || {};
        params.args.data = {
          ...(params.args.data || {}),
          tenantId,
        };
      } else if (params.action === 'createMany') {
        params.args = params.args || {};
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((item: any) => ({
            ...item,
            tenantId,
          }));
        }
      }

      // 5. Bulk updates & deletes: updateMany, deleteMany
      else if (params.action === 'updateMany' || params.action === 'deleteMany') {
        params.args = params.args || {};
        params.args.where = {
          ...(params.args.where || {}),
          tenantId,
        };
      }

      // 6. Single update & delete: verify that target record belongs to active tenant
      else if (params.action === 'update' || params.action === 'delete') {
        if (params.args?.where) {
          const delegateKey =
            params.model.charAt(0).toLowerCase() + params.model.slice(1);
          const modelDelegate = (this as any)[delegateKey];

          if (modelDelegate && typeof modelDelegate.findFirst === 'function') {
            const existing = await modelDelegate.findFirst({
              where: { ...params.args.where, tenantId },
              select: { id: true },
            });
            if (!existing) {
              throw new Error(
                `Access denied: ${params.model} record does not belong to active tenant ${tenantId}`,
              );
            }
          }
        }
      }

      return next(params);
    });
  }
}
