import { Module } from '@nestjs/common';
import { BedsideInfusionController } from './infusion.controller.ts';
import { BedsideInfusionService } from './infusion.service.ts';

@Module({
  controllers: [BedsideInfusionController],
  providers: [BedsideInfusionService],
  exports: [BedsideInfusionService],
})
export class BedsideInfusionModule {}
