import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaywayDirectService } from './payway-direct.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [ConfigModule, TelegramModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaywayDirectService],
  exports: [PaymentsService, PaywayDirectService],
})
export class PaymentsModule {}
