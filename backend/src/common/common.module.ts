import { Module, Global } from '@nestjs/common';
import { TestAccountThrottleService } from './services/test-account-throttle.service';

@Global()
@Module({
  providers: [TestAccountThrottleService],
  exports: [TestAccountThrottleService],
})
export class CommonModule {}
