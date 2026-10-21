import { Module } from '@nestjs/common';
import { EclaimController } from './eclaim.controller.js';
import { EclaimService } from './eclaim.service.js';

@Module({
  controllers: [EclaimController],
  providers: [EclaimService],
  exports: [EclaimService]
})
export class EclaimModule {}
