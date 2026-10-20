import { Module } from '@nestjs/common';
import { PacsController } from './pacs.controller';
import { PacsService } from './pacs.service';

@Module({
  controllers: [PacsController],
  providers: [PacsService],
  exports: [PacsService],
})
export class PacsModule {}
