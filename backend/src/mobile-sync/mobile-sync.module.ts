// Mobile Sync & Device Gateway Module
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { Module } from '@nestjs/common';
import { MobileSyncService } from './mobile-sync.service.ts';
import { MobileSyncController } from './mobile-sync.controller.ts';

@Module({
  controllers: [MobileSyncController],
  providers: [MobileSyncService],
  exports: [MobileSyncService],
})
export class MobileSyncModule {}
