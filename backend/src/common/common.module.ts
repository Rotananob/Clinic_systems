import { Module, Global } from '@nestjs/common';
import { TestAccountThrottleService } from './services/test-account-throttle.service';
import { TenantContextService } from './services/tenant-context.service';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';

@Global()
@Module({
  providers: [TestAccountThrottleService, TenantContextService, TenantContextMiddleware],
  exports: [TestAccountThrottleService, TenantContextService, TenantContextMiddleware],
})
export class CommonModule {}
