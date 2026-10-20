import { Controller, Get, Post, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BillingCycleService } from './billing-cycle.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Subscriptions & Billing Engine')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly billingCycleService: BillingCycleService) {}

  @ApiOperation({ summary: 'Get current clinic subscription status, days remaining, and plan quotas' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('current')
  getCurrentSubscription(@Request() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
    return this.billingCycleService.getCurrentSubscription(tenantId);
  }

  @ApiOperation({ summary: 'List past SaaS subscription invoices and billing records' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('history')
  getSubscriptionHistory(@Request() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
    return this.billingCycleService.getSubscriptionHistory(tenantId);
  }

  @ApiOperation({ summary: 'Trigger manual billing cycle check (Super Admin or Scheduled Runner)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Cycle check execution summary returned' })
  @Post('check-cycles')
  triggerCycleCheck(@Request() req: any) {
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Only system administrators can trigger billing cycle runs');
    }
    return this.billingCycleService.runBillingCycleCheck();
  }
}
