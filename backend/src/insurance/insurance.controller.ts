import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InsuranceService, InsuranceProviderType } from './insurance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Cambodian NSSF & Commercial Insurance Settlement')
@Controller('insurance')
export class InsuranceController {
  private readonly insuranceService: InsuranceService;

  constructor(insuranceService: InsuranceService) {
    this.insuranceService = insuranceService;
  }

  @ApiOperation({ summary: 'Verify patient insurance policy validity, active status, and benefit limit' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'provider', required: false })
  @Get('policies/verify/:policyNumber')
  verifyPolicy(
    @Param('policyNumber') policyNumber: string,
    @Query('provider') provider?: InsuranceProviderType,
  ) {
    return this.insuranceService.verifyPolicy(policyNumber, provider);
  }

  @ApiOperation({ summary: 'Calculate real-time split-invoice: Insurer Covered Portion vs Patient Co-Pay/Deductible' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('split-invoice/calculate')
  calculateSplitInvoice(
    @Body()
    body: {
      policyNumber: string;
      items: Array<{
        category: string;
        description: string;
        unitPriceUsd: number;
        quantity: number;
      }>;
    },
  ) {
    return this.insuranceService.calculateSplitInvoice(body.policyNumber, body.items);
  }

  @ApiOperation({ summary: 'Submit insurance claim for pre-authorization or direct settlement' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('claims/submit')
  submitClaim(@Req() req: any, @Body() body: any) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.insuranceService.submitClaim(tenantId, body);
  }

  @ApiOperation({ summary: 'Get list of insurance claims filtered by provider and status' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'provider', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @Get('claims')
  getClaims(
    @Req() req: any,
    @Query('provider') provider?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.insuranceService.getClaims(tenantId, { provider, status, search });
  }

  @ApiOperation({ summary: 'Mark insurance claim as settled upon receiving remittance advice from underwriter' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('claims/:claimNumber/settle')
  settleClaim(
    @Param('claimNumber') claimNumber: string,
    @Body() body: { settlementRef: string; settledAmountUsd: number },
  ) {
    return this.insuranceService.settleClaim(claimNumber, body.settlementRef, body.settledAmountUsd);
  }

  @ApiOperation({ summary: 'Export NSSF Cambodia claims reimbursement batch report' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'batchId', required: false })
  @Get('nssf/export')
  exportNssfBatch(@Query('batchId') batchId?: string) {
    return this.insuranceService.exportNssfBatch(batchId);
  }
}
