import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlatformMasterBotService } from './platform-master-bot.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Platform Master Bot (Super Admin SaaS Operations)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('telegram/platform')
export class PlatformMasterBotController {
  constructor(private readonly platformMasterBotService: PlatformMasterBotService) {}

  @ApiOperation({ summary: 'Get Platform Master Bot operational status and notification toggles' })
  @Get('status')
  getStatus() {
    return this.platformMasterBotService.getPublicStatus();
  }

  @ApiOperation({ summary: 'Configure Platform Master Bot credentials and alert triggers' })
  @Post('configure')
  configure(
    @Body()
    dto: {
      botToken?: string;
      chatId?: string;
      botUsername?: string;
      notifyOnNewClinic?: boolean;
      notifyOnSubscriptionPaid?: boolean;
      notifyOnSystemError?: boolean;
      notifyOnDatabaseBackup?: boolean;
      notifyOnDailySummary?: boolean;
    },
  ) {
    return this.platformMasterBotService.updateConfig(dto);
  }

  @ApiOperation({ summary: 'Send a verification test message to Master Telegram chat' })
  @Post('test-message')
  testMessage() {
    return this.platformMasterBotService.testConnection();
  }

  @ApiOperation({ summary: 'Execute administrative Master Bot command' })
  @Post('command')
  async executeCommand(@Body() dto: { command: string }) {
    const reply = await this.platformMasterBotService.executeAdminCommand(dto.command || '/help');
    return { success: true, reply };
  }

  @ApiOperation({ summary: 'Enforce and lock official Platform Master Bot profile' })
  @Post('lock-profile')
  lockProfile() {
    return this.platformMasterBotService.enforceMasterBotProfileLock();
  }

  @ApiOperation({ summary: 'Verify Platform Master Bot integrity and auto-heal if tampered' })
  @Post('verify-integrity')
  verifyIntegrity() {
    return this.platformMasterBotService.verifyAndHealProfile();
  }
}
