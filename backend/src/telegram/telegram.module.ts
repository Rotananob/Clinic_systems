import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { PlatformMasterBotService } from './platform-master-bot.service';
import { PlatformMasterBotController } from './platform-master-bot.controller';

@Module({
  controllers: [TelegramController, PlatformMasterBotController],
  providers: [TelegramService, PlatformMasterBotService],
  exports: [TelegramService, PlatformMasterBotService],
})
export class TelegramModule {}
