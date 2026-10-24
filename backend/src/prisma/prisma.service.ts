import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as bcrypt from 'bcryptjs';
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
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
      await this.autoSyncSchemaAndSeed();
    } catch (err: any) {
      this.logger.error(`Database connection warning: ${err.message}. Connection will retry on query.`);
    }
    this.setupTenantIsolationMiddleware();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async autoSyncSchemaAndSeed() {
    if (process.env.NODE_ENV === 'test' || !process.env.DATABASE_URL) {
      return;
    }

    try {
      const tableCheck: any[] = await this.$queryRawUnsafe(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User'`
      );

      if (!tableCheck || tableCheck.length === 0) {
        this.logger.warn('[PRISMA] Table "User" not found in database. Running automated schema deployment (npx prisma db push)...');
        try {
          const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
          const pushOutput = execSync('npx prisma db push --skip-generate --accept-data-loss', {
            stdio: 'pipe',
            timeout: 60000,
            env: {
              ...process.env,
              DIRECT_URL: directUrl,
            },
          });
          this.logger.log(`[PRISMA] Database schema pushed successfully: ${pushOutput.toString().slice(0, 150)}`);
        } catch (pushErr: any) {
          this.logger.error(`[PRISMA] Automated db push error: ${pushErr.stderr?.toString() || pushErr.message}`);
        }
      }

      await this.ensureDefaultSeedUsers();
    } catch (err: any) {
      this.logger.warn(`[PRISMA] autoSyncSchemaAndSeed check warning: ${err.message}`);
    }
  }

  async ensureDefaultSeedUsers() {
    try {
      const userCount = await this.user.count();
      if (userCount === 0) {
        this.logger.log('[PRISMA] Database has 0 users. Seeding default accounts...');
        const superAdminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD || 'Rotana#Owner$2026!MasterKey';
        const superAdminHash = await bcrypt.hash(superAdminPassword, 12);

        const demoPassword = process.env.SEED_DEMO_PASSWORD || 'TestAdmin#2026!Clinic';
        const demoHash = await bcrypt.hash(demoPassword, 12);

        await this.user.upsert({
          where: { email: 'owner@clinic.com' },
          update: { passwordHash: superAdminHash, role: 'SUPER_ADMIN' as any, isActive: true },
          create: {
            email: 'owner@clinic.com',
            passwordHash: superAdminHash,
            fullNameEn: 'Rotana Nob (System Owner & Director)',
            fullNameKh: 'លោក ណុប រតនា - ម្ចាស់ប្រព័ន្ធ & នាយកប្រតិបត្តិ',
            role: 'SUPER_ADMIN' as any,
            phone: '012888999',
            isActive: true,
          },
        });

        await this.user.upsert({
          where: { email: 'test.admin@hounvannak.com' },
          update: { passwordHash: demoHash, role: 'SUPER_ADMIN' as any, isActive: true },
          create: {
            email: 'test.admin@hounvannak.com',
            passwordHash: demoHash,
            fullNameEn: 'Test Administrator',
            fullNameKh: 'អ្នកគ្រប់គ្រងប្រព័ន្ធសាកល្បង',
            role: 'SUPER_ADMIN' as any,
            phone: '012999000',
            isActive: true,
            department: 'Executive Medical Board',
            bio: 'Evaluation account with full administrative privileges.',
          },
        });

        this.logger.log('[PRISMA] Default accounts successfully seeded into PostgreSQL.');
      }
    } catch (seedErr: any) {
      this.logger.warn(`[PRISMA] ensureDefaultSeedUsers warning: ${seedErr.message}`);
    }
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

  /**
   * Generates a globally unique patient code: PAT-YYYY-XXXX
   * Bypasses tenant isolation to avoid collision across multiple tenant clinics
   */
  async generateNextPatientCode(): Promise<string> {
    const year = new Date().getFullYear();
    let maxSeq = 0;
    try {
      const rows: any[] = await this.$queryRawUnsafe(`
        SELECT substring("patientCode" from '^PAT-${year}-([0-9]+)$')::int as max_seq
        FROM patients
        WHERE "patientCode" ~ '^PAT-${year}-[0-9]+$'
        ORDER BY max_seq DESC
        LIMIT 1
      `);
      if (rows && rows.length > 0 && rows[0]?.max_seq != null) {
        maxSeq = Number(rows[0].max_seq);
      }
    } catch {
      try {
        const count = await this.patient.count();
        maxSeq = count;
      } catch {
        maxSeq = 0;
      }
    }

    let nextSeq = maxSeq + 1;
    let candidate = `PAT-${year}-${nextSeq.toString().padStart(4, '0')}`;
    let attempts = 0;
    while (attempts < 50) {
      let existing: any = null;
      try {
        const found: any[] = await this.$queryRawUnsafe(
          `SELECT id FROM patients WHERE "patientCode" = $1 LIMIT 1`,
          candidate,
        );
        if (Array.isArray(found) && found.length > 0) {
          existing = found[0];
        }
      } catch {
        try {
          existing = await this.patient.findFirst({
            where: { patientCode: candidate },
          });
        } catch {
          existing = null;
        }
      }

      if (!existing) {
        return candidate;
      }
      nextSeq++;
      candidate = `PAT-${year}-${nextSeq.toString().padStart(4, '0')}`;
      attempts++;
    }
    return `PAT-${year}-${Date.now().toString().slice(-4)}`;
  }

  /**
   * Generates a globally unique visit code: VST-YYYY-XXXX
   * Bypasses tenant isolation to avoid collision across multiple tenant clinics
   */
  async generateNextVisitCode(): Promise<string> {
    const year = new Date().getFullYear();
    let maxSeq = 0;
    try {
      const rows: any[] = await this.$queryRawUnsafe(`
        SELECT substring("visitCode" from '^VST-${year}-([0-9]+)$')::int as max_seq
        FROM visits
        WHERE "visitCode" ~ '^VST-${year}-[0-9]+$'
        ORDER BY max_seq DESC
        LIMIT 1
      `);
      if (rows && rows.length > 0 && rows[0]?.max_seq != null) {
        maxSeq = Number(rows[0].max_seq);
      }
    } catch {
      try {
        const count = await this.visit.count();
        maxSeq = count;
      } catch {
        maxSeq = 0;
      }
    }

    let nextSeq = maxSeq + 1;
    let candidate = `VST-${year}-${nextSeq.toString().padStart(4, '0')}`;
    let attempts = 0;
    while (attempts < 50) {
      let existing: any = null;
      try {
        const found: any[] = await this.$queryRawUnsafe(
          `SELECT id FROM visits WHERE "visitCode" = $1 LIMIT 1`,
          candidate,
        );
        if (Array.isArray(found) && found.length > 0) {
          existing = found[0];
        }
      } catch {
        try {
          existing = await this.visit.findFirst({
            where: { visitCode: candidate },
          });
        } catch {
          existing = null;
        }
      }

      if (!existing) {
        return candidate;
      }
      nextSeq++;
      candidate = `VST-${year}-${nextSeq.toString().padStart(4, '0')}`;
      attempts++;
    }
    return `VST-${year}-${Date.now().toString().slice(-4)}`;
  }

  /**
   * Generates a globally unique prescription code: RX-YYYY-XXXX
   * Bypasses tenant isolation to avoid collision across multiple tenant clinics
   */
  async generateNextPrescriptionCode(): Promise<string> {
    const year = new Date().getFullYear();
    let maxSeq = 0;
    try {
      const rows: any[] = await this.$queryRawUnsafe(`
        SELECT substring("prescriptionCode" from '^RX-${year}-([0-9]+)$')::int as max_seq
        FROM prescriptions
        WHERE "prescriptionCode" ~ '^RX-${year}-[0-9]+$'
        ORDER BY max_seq DESC
        LIMIT 1
      `);
      if (rows && rows.length > 0 && rows[0]?.max_seq != null) {
        maxSeq = Number(rows[0].max_seq);
      }
    } catch {
      try {
        const count = await this.prescription.count();
        maxSeq = count;
      } catch {
        maxSeq = 0;
      }
    }

    let nextSeq = maxSeq + 1;
    let candidate = `RX-${year}-${nextSeq.toString().padStart(4, '0')}`;
    let attempts = 0;
    while (attempts < 50) {
      let existing: any = null;
      try {
        const found: any[] = await this.$queryRawUnsafe(
          `SELECT id FROM prescriptions WHERE "prescriptionCode" = $1 LIMIT 1`,
          candidate,
        );
        if (Array.isArray(found) && found.length > 0) {
          existing = found[0];
        }
      } catch {
        try {
          existing = await this.prescription.findFirst({
            where: { prescriptionCode: candidate },
          });
        } catch {
          existing = null;
        }
      }

      if (!existing) {
        return candidate;
      }
      nextSeq++;
      candidate = `RX-${year}-${nextSeq.toString().padStart(4, '0')}`;
      attempts++;
    }
    return `RX-${year}-${Date.now().toString().slice(-4)}`;
  }

  /**
   * Generates a globally unique invoice number: INV-YYYY-XXXX
   * Bypasses tenant isolation to avoid collision across multiple tenant clinics
   */
  async generateNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    let maxSeq = 0;
    try {
      const rows: any[] = await this.$queryRawUnsafe(`
        SELECT substring("invoiceNumber" from '^INV-${year}-([0-9]+)$')::int as max_seq
        FROM invoices
        WHERE "invoiceNumber" ~ '^INV-${year}-[0-9]+$'
        ORDER BY max_seq DESC
        LIMIT 1
      `);
      if (rows && rows.length > 0 && rows[0]?.max_seq != null) {
        maxSeq = Number(rows[0].max_seq);
      }
    } catch {
      try {
        const count = await this.invoice.count();
        maxSeq = count;
      } catch {
        maxSeq = 0;
      }
    }

    let nextSeq = maxSeq + 1;
    let candidate = `INV-${year}-${nextSeq.toString().padStart(4, '0')}`;
    let attempts = 0;
    while (attempts < 50) {
      let existing: any = null;
      try {
        const found: any[] = await this.$queryRawUnsafe(
          `SELECT id FROM invoices WHERE "invoiceNumber" = $1 LIMIT 1`,
          candidate,
        );
        if (Array.isArray(found) && found.length > 0) {
          existing = found[0];
        }
      } catch {
        try {
          existing = await this.invoice.findFirst({
            where: { invoiceNumber: candidate },
          });
        } catch {
          existing = null;
        }
      }

      if (!existing) {
        return candidate;
      }
      nextSeq++;
      candidate = `INV-${year}-${nextSeq.toString().padStart(4, '0')}`;
      attempts++;
    }
    return `INV-${year}-${Date.now().toString().slice(-4)}`;
  }
}
