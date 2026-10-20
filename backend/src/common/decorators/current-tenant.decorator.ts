import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContextService } from '../services/tenant-context.service';

/**
 * Decorator to extract the active tenant ID from request context or AsyncLocalStorage
 */
export const CurrentTenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const req = ctx.switchToHttp().getRequest();
    return req?.tenantId || TenantContextService.getTenantId();
  },
);

/**
 * Decorator to extract the active tenant slug from request context or AsyncLocalStorage
 */
export const CurrentTenantSlug = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const req = ctx.switchToHttp().getRequest();
    return req?.tenantSlug || TenantContextService.getTenantSlug();
  },
);
