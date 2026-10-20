import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { OverridePlanDto } from './dto/override-plan.dto';
import { ToggleMaintenanceDto } from './dto/toggle-maintenance.dto';

@ApiTags('Super Admin Platform Dashboard & Governance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @ApiOperation({ summary: 'Step 21: Get Master Platform KPI metrics (SUPER_ADMIN only)' })
  @Get('metrics')
  getMetrics() {
    return this.superAdminService.getPlatformMetrics();
  }

  @ApiOperation({ summary: 'Step 21: Get Multi-Clinic Fleet Directory & Usage (SUPER_ADMIN only)' })
  @Get('tenants')
  getFleetTenants() {
    return this.superAdminService.getFleetClinics();
  }

  @ApiOperation({ summary: 'Step 22: Emergency Lockout - Freeze a clinic workspace (SUPER_ADMIN only)' })
  @Patch('tenants/:id/freeze')
  freezeTenant(@Param('id') id: string, @Body() body?: { reason?: string }) {
    return this.superAdminService.freezeClinic(id, body?.reason);
  }

  @ApiOperation({ summary: 'Step 22: Restore / Unfreeze clinic workspace access (SUPER_ADMIN only)' })
  @Patch('tenants/:id/unfreeze')
  unfreezeTenant(@Param('id') id: string) {
    return this.superAdminService.unfreezeClinic(id);
  }

  @ApiOperation({ summary: 'Step 22: Override SaaS plan tier or manually extend validity (SUPER_ADMIN only)' })
  @Patch('tenants/:id/override-plan')
  overridePlan(@Param('id') id: string, @Body() dto: OverridePlanDto) {
    return this.superAdminService.overridePlan(id, dto);
  }

  @ApiOperation({ summary: 'Step 22: Purge mock demo patients and transactions for a clinic (SUPER_ADMIN only)' })
  @Post('tenants/:id/purge-demo-data')
  purgeDemoData(@Param('id') id: string) {
    return this.superAdminService.purgeDemoData(id);
  }

  @ApiOperation({ summary: 'Step 22: Get platform-wide maintenance mode status (SUPER_ADMIN only)' })
  @Get('maintenance-mode')
  getMaintenanceMode() {
    return this.superAdminService.getMaintenanceMode();
  }

  @ApiOperation({ summary: 'Step 22: Toggle nationwide platform maintenance mode (SUPER_ADMIN only)' })
  @Post('maintenance-mode')
  setMaintenanceMode(@Body() dto: ToggleMaintenanceDto) {
    return this.superAdminService.setMaintenanceMode(dto);
  }

  @ApiOperation({ summary: 'Step 22: Issue temporary audit token to impersonate clinic workspace (SUPER_ADMIN only)' })
  @Post('tenants/:id/impersonate')
  impersonateTenant(@Param('id') id: string, @Request() req: any) {
    return this.superAdminService.impersonateTenant(id, req.user);
  }
}
