import { Module } from '@nestjs/common';
import { TeleconsultController } from './teleconsult.controller.js';
import { TeleconsultService } from './teleconsult.service.js';

@Module({
  controllers: [TeleconsultController],
  providers: [TeleconsultService],
  exports: [TeleconsultService]
})
export class TeleconsultModule {}
