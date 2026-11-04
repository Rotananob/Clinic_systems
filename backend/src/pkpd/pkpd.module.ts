import { Module } from '@nestjs/common';
import { PkPdController } from './pkpd.controller';
import { PkPdService } from './pkpd.service';

@Module({
  controllers: [PkPdController],
  providers: [PkPdService],
  exports: [PkPdService]
})
export class PkPdModule {}
