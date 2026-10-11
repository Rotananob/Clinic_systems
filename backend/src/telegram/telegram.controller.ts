import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Telegram Bot & Topics Bridge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @ApiOperation({ summary: 'Get Telegram Bot connection status and topic mappings' })
  @Get('status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  getStatus() {
    return this.telegramService.getPublicStatus();
  }

  @ApiOperation({ summary: 'Start 1-Click pairing session with deep link' })
  @Post('start-pairing')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  startPairing() {
    return this.telegramService.startPairingSession();
  }

  @ApiOperation({ summary: 'Get current pairing session status' })
  @Get('pairing-status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  getPairingStatus() {
    return this.telegramService.getPairingStatus();
  }

  @ApiOperation({ summary: 'Check admin privileges and create forum topics if newly granted' })
  @Post('check-admin-topics')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  checkAdminTopics() {
    return this.telegramService.checkAdminAndCreateTopics();
  }

  @ApiOperation({ summary: 'Manual connect Telegram Bot with Chat ID' })
  @Post('connect')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async connect(
    @Body()
    dto: {
      botToken?: string;
      chatId: string;
      autoCreateTopics?: boolean;
    },
  ) {
    return this.telegramService.connectAndInitialize(dto);
  }

  @ApiOperation({ summary: 'Disconnect Telegram Bot' })
  @Post('disconnect')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  disconnect() {
    return this.telegramService.disconnect();
  }

  @ApiOperation({ summary: 'Update Telegram notification category preferences' })
  @Put('settings')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  updateSettings(@Body() settings: any) {
    return this.telegramService.updateSettings(settings);
  }

  @ApiOperation({ summary: 'Send test notification to specified topic' })
  @Post('test')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async sendTest(@Body('category') category?: 'PAYMENTS' | 'QUEUE' | 'PHARMACY' | 'SECURITY') {
    const success = await this.telegramService.sendTestNotification(category || 'PAYMENTS');
    return {
      success,
      message: success ? 'Test notification sent to Telegram!' : 'Failed to send notification. Check bot status and permissions.',
    };
  }
}
