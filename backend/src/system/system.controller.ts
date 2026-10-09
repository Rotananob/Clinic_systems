import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('System Owner & Master Governance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @ApiOperation({ summary: 'Retrieve system owner status and license metrics (SUPER_ADMIN only)' })
  @Roles(Role.SUPER_ADMIN)
  @Get('status')
  getSystemStatus() {
    return this.systemService.getSystemStatus();
  }

  @ApiOperation({ summary: 'Retrieve comprehensive role and permission matrix (SUPER_ADMIN only)' })
  @Roles(Role.SUPER_ADMIN)
  @Get('permissions')
  getPermissions() {
    return this.systemService.getPermissionsMatrix();
  }

  @ApiOperation({ summary: 'Retrieve system security audit logs (SUPER_ADMIN only)' })
  @Roles(Role.SUPER_ADMIN)
  @Get('audit-logs')
  getAuditLogs() {
    return this.systemService.getAuditLogs();
  }

  @ApiOperation({ summary: 'Trigger emergency database backup snapshot (SUPER_ADMIN only)' })
  @Roles(Role.SUPER_ADMIN)
  @Post('backup')
  triggerBackup() {
    return this.systemService.triggerEmergencyBackup();
  }
}
