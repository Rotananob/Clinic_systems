import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../services/tenant-context.service';
import { SuperAdminService } from '../../super-admin/super-admin.service';

interface CachedTenant {
  tenantId: string;
  expiresAt: number;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly slugCache = new Map<string, CachedTenant>();
  private readonly reservedSubdomains = new Set([
    'www',
    'api',
    'admin',
    'app',
    'system',
    'platform',
    'mail',
    'dev',
    'stage',
    'static',
    'cdn',
    'assets',
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    let tenantId: string | null = null;
    let tenantSlug: string | null = null;
    let isSuperAdminBypass = false;

    // 1. Try explicit header: x-tenant-id
    const headerTenantId = req.headers['x-tenant-id'];
    if (typeof headerTenantId === 'string' && headerTenantId.trim()) {
      tenantId = headerTenantId.trim();
    }

    // 2. Try JWT Bearer token payload extraction
    if (!tenantId) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
            const payload = JSON.parse(payloadJson);
            if (payload.tenantId) {
              tenantId = payload.tenantId;
            }
            if (payload.role === 'SUPER_ADMIN' && !tenantId) {
              isSuperAdminBypass = true;
            }
          }
        } catch {
          // Ignore malformed JWT token; Passport AuthGuard handles validation downstream
        }
      }
    }

    // 3. Try Host header Subdomain extraction (e.g. rotana.domain.com or rotana.localhost:3000)
    const host = req.headers.host || '';
    const hostWithoutPort = host.split(':')[0].toLowerCase();
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostWithoutPort);

    if (!isIp && hostWithoutPort !== 'localhost') {
      const parts = hostWithoutPort.split('.');
      if (parts.length >= 2) {
        const candidate = parts[0];
        if (!this.reservedSubdomains.has(candidate)) {
          tenantSlug = candidate;
        }
      }
    }

    // 4. If slug is present and tenantId is not yet resolved, query database
    if (!tenantId && tenantSlug) {
      const cached = this.slugCache.get(tenantSlug);
      const now = Date.now();
      if (cached && now < cached.expiresAt) {
        tenantId = cached.tenantId;
      } else {
        try {
          const tenant = await this.prisma.tenant.findUnique({
            where: { slug: tenantSlug },
            select: { id: true, isActive: true },
          });

          if (tenant && tenant.isActive) {
            tenantId = tenant.id;
            this.slugCache.set(tenantSlug, {
              tenantId: tenant.id,
              expiresAt: now + 5 * 60 * 1000, // Cache for 5 minutes
            });
          }
        } catch {
          // If query fails, continue without tenantId
        }
      }
    }

    // 5. Attach tenant details to the Express Request
    (req as any).tenantId = tenantId;
    (req as any).tenantSlug = tenantSlug;

    // Step 22: Platform Maintenance Mode Guard (Exempts SUPER_ADMIN and health checks)
    if (SuperAdminService.isMaintenanceModeActive() && !isSuperAdminBypass) {
      const path = req.path || req.url || '';
      const isExempt =
        path.includes('/auth/login') ||
        path.includes('/super-admin') ||
        path.includes('/health');
      if (!isExempt) {
        const { messageKh, messageEn } = SuperAdminService.getMaintenanceMessage();
        res.status(503).json({
          statusCode: 503,
          error: 'MAINTENANCE_MODE',
          messageKh,
          messageEn,
        });
        return;
      }
    }

    // 6. Execute request within AsyncLocalStorage scope
    this.tenantContextService.run(
      {
        tenantId,
        slug: tenantSlug,
        isSuperAdminBypass,
      },
      () => next(),
    );
  }
}
