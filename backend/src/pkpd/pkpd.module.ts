import { Module } from '@nestjs/common';
import { PkPdController } from './pkpd.controller.ts';
import { PkPdService } from './pkpd.service.ts';

@Module({
  controllers: [PkPdController],
  providers: [PkPdService],
  exports: [PkPdService]
})
export class PkPdModule {}
