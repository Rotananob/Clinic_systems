import { Module } from '@nestjs/common';
import { DentalController } from './dental.controller.js';
import { DentalService } from './dental.service.js';

@Module({
  controllers: [DentalController],
  providers: [DentalService],
  exports: [DentalService]
})
export class DentalModule {}
