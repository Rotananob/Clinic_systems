import { Module } from '@nestjs/common';
import { LisService } from './lis.service';
import { LisController } from './lis.controller';

@Module({
  controllers: [LisController],
  providers: [LisService],
  exports: [LisService],
})
export class LisModule {}
