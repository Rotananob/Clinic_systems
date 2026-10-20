import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentTenantId } from '../common/decorators/current-tenant.decorator';

@ApiTags('Telegram Bot & Topics Bridge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @ApiOperation({ summary: 'Get Telegram Bot connection status and topic mappings (tenant-scoped)' })
  @Get('status')
  getStatus(@CurrentTenantId() tenantId: string | null) {
    return this.telegramService.getPublicStatus(tenantId || undefined);
  }

  @ApiOperation({ summary: 'Start 1-Click pairing session with deep link' })
  @Post('start-pairing')
  startPairing(@CurrentTenantId() tenantId: string | null) {
    return this.telegramService.startPairingSession(tenantId || undefined);
  }

  @ApiOperation({ summary: 'Get current pairing session status' })
  @Get('pairing-status')
  getPairingStatus(@CurrentTenantId() tenantId: string | null) {
    return this.telegramService.getPairingStatus(tenantId || undefined);
  }

  @ApiOperation({ summary: 'Check admin privileges and create forum topics if newly granted' })
  @Post('check-admin-topics')
  checkAdminTopics() {
    return this.telegramService.checkAdminAndCreateTopics();
  }

  @ApiOperation({ summary: 'Manual connect Telegram Bot with Chat ID' })
  @Post('connect')
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
  disconnect(@CurrentTenantId() tenantId: string | null) {
    return this.telegramService.disconnect(tenantId || undefined);
  }

  @ApiOperation({ summary: 'Update Telegram notification category preferences' })
  @Put('settings')
  updateSettings(@Body() settings: any, @CurrentTenantId() tenantId: string | null) {
    return this.telegramService.updateSettings(settings, tenantId || undefined);
  }

  @ApiOperation({ summary: 'Enforce and lock official Telegram Bot name and descriptions' })
  @Post('lock-profile')
  lockProfile() {
    return this.telegramService.enforceBotProfileLock();
  }

  @ApiOperation({ summary: 'Verify Clinic Alert Bot integrity and auto-heal if tampered' })
  @Post('verify-integrity')
  verifyIntegrity() {
    return this.telegramService.verifyAndHealProfile();
  }

  @ApiOperation({ summary: 'Send test notification to specified topic' })
  @Post('test')
  async sendTest(
    @Body('category') category?: 'PAYMENTS' | 'QUEUE' | 'PHARMACY' | 'SECURITY',
  ) {
    const success = await this.telegramService.sendTestNotification(category || 'PAYMENTS');
    return {
      success,
      message: success
        ? 'Test notification sent to Telegram!'
        : 'Failed to send notification. Check bot status and permissions.',
    };
  }
}
