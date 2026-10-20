import { Module } from '@nestjs/common';
import { BillingCycleService } from './billing-cycle.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [PrismaModule, TelegramModule],
  controllers: [SubscriptionsController],
  providers: [BillingCycleService],
  exports: [BillingCycleService],
})
export class SubscriptionsModule {}
