import { Controller, Get, Post, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { SetupMerchantDto } from './dto/setup-merchant.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Tenant Management & Merchant Setup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiOperation({ summary: 'Get current tenant workspace profile, subscription, and quota usage' })
  @Get('me')
  getTenantProfile(@Request() req: any) {
    return this.tenantsService.getTenantProfile(req.user);
  }

  @ApiOperation({ summary: 'Update clinic workspace profile, identity, and merchant credentials (Admin & Doctor)' })
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiResponse({ status: 200, description: 'Clinic profile and merchant settings updated successfully' })
  @Patch('profile')
  updateTenantProfile(@Request() req: any, @Body() dto: UpdateTenantProfileDto) {
    return this.tenantsService.updateTenantProfile(dto, req.user);
  }

  @ApiOperation({ summary: 'Paste & Go: Setup Bakong Account ID and PayWay Merchant Credentials (Admin & Doctor)' })
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiResponse({ status: 200, description: 'Merchant credentials saved and isolated dynamic KHQR activated' })
  @Post('setup-merchant')
  setupMerchant(@Request() req: any, @Body() dto: SetupMerchantDto) {
    return this.tenantsService.setupMerchant(dto, req.user);
  }

  @ApiOperation({ summary: 'Generate instant test Dynamic KHQR to verify merchant credentials' })
  @Roles(Role.ADMIN, Role.DOCTOR)
  @Post('test-merchant-khqr')
  testMerchantKhqr(@Body() dto: SetupMerchantDto) {
    return this.tenantsService.generateTestKhqr(dto);
  }
}
