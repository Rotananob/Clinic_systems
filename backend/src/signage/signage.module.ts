import { Module } from '@nestjs/common';
import { SignageController } from './signage.controller';
import { SignageService } from './signage.service';

@Module({
  controllers: [SignageController],
  providers: [SignageService],
  exports: [SignageService],
})
export class SignageModule {}
