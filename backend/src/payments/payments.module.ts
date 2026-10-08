import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaywayDirectService } from './payway-direct.service';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaywayDirectService],
  exports: [PaymentsService, PaywayDirectService],
})
export class PaymentsModule {}
