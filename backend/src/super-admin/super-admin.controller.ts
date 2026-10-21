import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { OverridePlanDto } from './dto/override-plan.dto';
import { ToggleMaintenanceDto } from './dto/toggle-maintenance.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { CreateGlobalUserDto } from './dto/create-global-user.dto';
import { UpdateGlobalUserDto } from './dto/update-global-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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

  @ApiOperation({ summary: 'Phase 1: Global User Governance - List all users across clinics with filtering (SUPER_ADMIN only)' })
  @Get('users')
  getGlobalUsers(@Query() dto: GetUsersDto) {
    return this.superAdminService.getGlobalUsers(dto);
  }

  @ApiOperation({ summary: 'Phase 1: Global User Governance - Provision a new user directly (SUPER_ADMIN only)' })
  @Post('users')
  createGlobalUser(@Body() dto: CreateGlobalUserDto) {
    return this.superAdminService.createGlobalUser(dto);
  }

  @ApiOperation({ summary: 'Phase 1: Global User Governance - Update user role, clinic, or status (SUPER_ADMIN only)' })
  @Patch('users/:id')
  updateGlobalUser(@Param('id') id: string, @Body() dto: UpdateGlobalUserDto) {
    return this.superAdminService.updateGlobalUser(id, dto);
  }

  @ApiOperation({ summary: 'Phase 1: Global User Governance - Administrative password reset (SUPER_ADMIN only)' })
  @Post('users/:id/reset-password')
  resetUserPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.superAdminService.resetUserPassword(id, dto);
  }
}
