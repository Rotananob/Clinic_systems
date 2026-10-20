import { Module } from '@nestjs/common';
import { IpdService } from './ipd.service';
import { IpdController } from './ipd.controller';

@Module({
  controllers: [IpdController],
  providers: [IpdService],
  exports: [IpdService],
})
export class IpdModule {}
