import { Module, forwardRef } from '@nestjs/common';
import { BillingCycleService } from './billing-cycle.service';
import { SubscriptionPaymentService } from './subscription-payment.service';
import { QuotaGuardService } from './quota-guard.service';
import { SubscriptionInvoiceService } from './subscription-invoice.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PrismaModule, TelegramModule, forwardRef(() => PaymentsModule)],
  controllers: [SubscriptionsController],
  providers: [
    BillingCycleService,
    SubscriptionPaymentService,
    QuotaGuardService,
    SubscriptionInvoiceService,
  ],
  exports: [
    BillingCycleService,
    SubscriptionPaymentService,
    QuotaGuardService,
    SubscriptionInvoiceService,
  ],
})
export class SubscriptionsModule {}
