import { Module, Global } from '@nestjs/common';
import { TestAccountThrottleService } from './services/test-account-throttle.service';
import { TenantContextService } from './services/tenant-context.service';
import { ClinicalSecurityService } from './services/clinical-security.service';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';

@Global()
@Module({
  providers: [
    TestAccountThrottleService,
    TenantContextService,
    ClinicalSecurityService,
    TenantContextMiddleware,
  ],
  exports: [
    TestAccountThrottleService,
    TenantContextService,
    ClinicalSecurityService,
    TenantContextMiddleware,
  ],
})
export class CommonModule {}
