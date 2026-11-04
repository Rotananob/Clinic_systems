import { Module } from '@nestjs/common';
import { BedsideInfusionController } from './infusion.controller';
import { BedsideInfusionService } from './infusion.service';

@Module({
  controllers: [BedsideInfusionController],
  providers: [BedsideInfusionService],
  exports: [BedsideInfusionService],
})
export class BedsideInfusionModule {}
