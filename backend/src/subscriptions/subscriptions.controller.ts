import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BillingCycleService } from './billing-cycle.service';
import { SubscriptionPaymentService } from './subscription-payment.service';
import { QuotaGuardService } from './quota-guard.service';
import { SubscriptionInvoiceService } from './subscription-invoice.service';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
import { VerifySubscriptionSettlementDto } from './dto/verify-subscription-settlement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Subscriptions & Billing Engine')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly billingCycleService: BillingCycleService,
    private readonly subscriptionPaymentService: SubscriptionPaymentService,
    private readonly quotaGuardService: QuotaGuardService,
    private readonly subscriptionInvoiceService: SubscriptionInvoiceService,
  ) {}

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

  @ApiOperation({ summary: 'Step 19: Get real-time usage quotas vs limits for KHQR, patients, and staff' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('quota-status')
  getQuotaStatus(@Request() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
    return this.quotaGuardService.getQuotaStatus(tenantId);
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

  @ApiOperation({ summary: 'Step 17: Generate Dynamic KHQR Tag 01=12 checkout for SaaS subscription' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Dynamic KHQR payload and bank deeplinks returned' })
  @Post('checkout')
  createCheckout(@Request() req: any, @Body() dto: CreateSubscriptionCheckoutDto) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
    return this.subscriptionPaymentService.createCheckout(tenantId, dto);
  }

  @ApiOperation({ summary: 'Step 18: Instant automated settlement verification & plan activation' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Plan activated and +30 days extended' })
  @Post('verify-settlement')
  verifySettlement(@Request() req: any, @Body() dto: VerifySubscriptionSettlementDto) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
    return this.subscriptionPaymentService.verifyAndActivateSettlement(tenantId, dto);
  }

  @ApiOperation({ summary: 'Step 20: Get official electronic tax receipt JSON data for subscription invoice' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('invoices/:id/receipt')
  getSubscriptionReceipt(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
    return this.subscriptionInvoiceService.getSubscriptionReceipt(tenantId, id);
  }

  @ApiOperation({ summary: 'Step 20: Render printable official tax invoice HTML page' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'text/html')
  @Get('invoices/:id/html')
  renderHtmlReceipt(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
    return this.subscriptionInvoiceService.renderHtmlReceipt(tenantId, id);
  }
}
