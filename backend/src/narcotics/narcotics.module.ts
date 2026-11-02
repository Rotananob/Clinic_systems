import { Module } from '@nestjs/common';
import { NarcoticsController } from './narcotics.controller';
import { NarcoticsService } from './narcotics.service';

@Module({
  controllers: [NarcoticsController],
  providers: [NarcoticsService],
  exports: [NarcoticsService],
})
export class NarcoticsModule {}
