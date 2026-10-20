import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import { SAAS_PLANS } from '../common/constants/plans.constant';
import { CreateSubscriptionCheckoutDto, BillingCycle } from './dto/create-subscription-checkout.dto';
import { VerifySubscriptionSettlementDto } from './dto/verify-subscription-settlement.dto';
import { TelegramService } from '../telegram/telegram.service';
import { PlatformMasterBotService } from '../telegram/platform-master-bot.service';
import * as crypto from 'crypto';

export function computeCrc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildDynamicKhqr(params: {
  bakongId: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  currency: 'USD' | 'KHR';
  billNumber: string;
}): { qrString: string; md5: string } {
  const { bakongId, merchantName, merchantCity, amount, currency, billNumber } = params;

  // Tag 29: Merchant Account Information
  const tag29_00 = `00${String(bakongId.length).padStart(2, '0')}${bakongId}`;
  const tag29 = `29${String(tag29_00.length).padStart(2, '0')}${tag29_00}`;

  // Tag 53: Currency (840 for USD, 116 for KHR)
  const currencyCode = currency === 'KHR' ? '116' : '840';
  const tag53 = `5303${currencyCode}`;

  // Tag 54: Transaction Amount
  const amountStr = amount.toFixed(2);
  const tag54 = `54${String(amountStr.length).padStart(2, '0')}${amountStr}`;

  // Tag 58: Country Code (KH)
  const tag58 = '5802KH';

  // Tag 59: Merchant Name
  const safeMerchantName = merchantName.slice(0, 25);
  const tag59 = `59${String(safeMerchantName.length).padStart(2, '0')}${safeMerchantName}`;

  // Tag 60: Merchant City
  const safeCity = merchantCity.slice(0, 15);
  const tag60 = `60${String(safeCity.length).padStart(2, '0')}${safeCity}`;

  // Tag 62: Additional Data Field (Bill Number)
  const tag62_01 = `01${String(billNumber.length).padStart(2, '0')}${billNumber}`;
  const tag62 = `62${String(tag62_01.length).padStart(2, '0')}${tag62_01}`;

  // Construct raw payload without CRC (Tag 01=12 signifies Dynamic KHQR)
  const rawPayload = `000201010212${tag29}52045999${tag53}${tag54}${tag58}${tag59}${tag60}${tag62}6304`;

  // Compute 16-bit CRC checksum
  const crc = computeCrc16(rawPayload);
  const qrString = `${rawPayload}${crc}`;
  const md5 = crypto.createHash('md5').update(qrString).digest('hex');

  return { qrString, md5 };
}

@Injectable()
export class SubscriptionPaymentService {
  private readonly logger = new Logger(SubscriptionPaymentService.name);
  private readonly activeSettlements = new Map<string, Promise<any>>();

  // Platform Owner receiving merchant credentials (SaaS Revenue)
  private readonly platformBakongId =
    process.env.PLATFORM_BAKONG_ACCOUNT_ID || 'rotana_saas@aba';
  private readonly platformMerchantName =
    process.env.PLATFORM_MERCHANT_NAME || 'CLINICOS PLATFORM PAAS';
  private readonly platformMerchantCity =
    process.env.PLATFORM_MERCHANT_CITY || 'Phnom Penh';
  private readonly platformPaywayUrl =
    process.env.PLATFORM_PAYWAY_URL ||
    process.env.PAYWAY_PAYMENT_URL ||
    'https://link.payway.com.kh/ABAPAYCK539089j';

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService?: TelegramService,
    @Optional()
    @Inject(forwardRef(() => PlatformMasterBotService))
    private readonly masterBotService?: PlatformMasterBotService,
  ) {}

  /**
   * Step 17: Creates a Dynamic KHQR Tag 01=12 checkout session for SaaS subscription upgrade or renewal.
   */
  async createCheckout(tenantId: string, dto: CreateSubscriptionCheckoutDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Clinic tenant ${tenantId} not found`);
    }

    if (dto.planTier === PlanTier.FREE) {
      throw new BadRequestException('Free Starter plan does not require payment checkout');
    }

    const planConfig = SAAS_PLANS[dto.planTier];
    if (!planConfig) {
      throw new BadRequestException(`Invalid plan tier: ${dto.planTier}`);
    }

    const isAnnual = dto.billingCycle === BillingCycle.ANNUAL;
    // Calculate pricing: Monthly price or Annual (20% discount)
    const amountUsd = isAnnual
      ? Math.round(planConfig.priceUsd * 12 * 0.8) // 20% discount
      : planConfig.priceUsd;

    const invoiceNumber = `SUB-${tenant.slug.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const tranId = `TXN-SUB-${tenant.slug}-${Date.now()}`;

    // Generate Dynamic KHQR Tag 01=12 with Platform Owner's receiving merchant account
    const khqr = buildDynamicKhqr({
      bakongId: this.platformBakongId,
      merchantName: this.platformMerchantName,
      merchantCity: this.platformMerchantCity,
      amount: amountUsd,
      currency: 'USD',
      billNumber: invoiceNumber,
    });

    const abaDeeplink = `https://link.payway.com.kh/app?qr=${encodeURIComponent(khqr.qrString)}`;
    const bakongDeeplink = `bakong://qr?data=${encodeURIComponent(khqr.qrString)}`;

    // Create pending subscription invoice record
    const subscription = await this.prisma.tenantSubscription.create({
      data: {
        tenantId: tenant.id,
        planTier: dto.planTier,
        amountUsd,
        status: SubscriptionStatus.PAST_DUE, // Pending payment confirmation
        startDate: new Date(),
        endDate: new Date(Date.now() + (isAnnual ? 365 : 30) * 24 * 60 * 60 * 1000),
        invoiceNumber,
        paymentTranId: tranId,
        paymentMethod: 'KHQR',
        notes: `Subscription Checkout: ${dto.planTier} (${isAnnual ? 'ANNUAL' : 'MONTHLY'})`,
      },
    });

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes TTL

    this.logger.log(
      `Generated KHQR Subscription checkout for ${tenant.slug}: ${dto.planTier} ($${amountUsd} USD). TranID: ${tranId}`,
    );

    return {
      success: true,
      subscriptionId: subscription.id,
      invoiceNumber,
      planTier: dto.planTier,
      planNameKh: planConfig.nameKh,
      planNameEn: planConfig.nameEn,
      billingCycle: isAnnual ? BillingCycle.ANNUAL : BillingCycle.MONTHLY,
      amountUsd,
      currency: 'USD',
      tranId,
      qrString: khqr.qrString,
      md5: khqr.md5,
      deeplinks: {
        aba: abaDeeplink,
        bakong: bakongDeeplink,
        paywayUrl: this.platformPaywayUrl,
      },
      merchant: {
        bakongId: this.platformBakongId,
        merchantName: this.platformMerchantName,
        merchantCity: this.platformMerchantCity,
      },
      expiresAt,
    };
  }

  /**
   * Step 18: Instant Automated Settlement & Plan Activation (+30 days auto-extension, Dual Bot alert)
   */
  async verifyAndActivateSettlement(tenantId: string, dto: VerifySubscriptionSettlementDto) {
    const lockKey = `${tenantId}:${dto.subscriptionId}`;
    if (this.activeSettlements.has(lockKey)) {
      return this.activeSettlements.get(lockKey);
    }

    const settlementPromise = this.executeSettlementTransaction(tenantId, dto);
    this.activeSettlements.set(lockKey, settlementPromise);

    try {
      return await settlementPromise;
    } finally {
      this.activeSettlements.delete(lockKey);
    }
  }

  private async executeSettlementTransaction(
    tenantId: string,
    dto: VerifySubscriptionSettlementDto,
  ) {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { id: dto.subscriptionId },
      include: { tenant: true },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription invoice ${dto.subscriptionId} not found`);
    }

    if (subscription.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot settle subscription belonging to another tenant');
    }

    // Idempotency check: Already activated
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return {
        success: true,
        alreadySettled: true,
        activated: true,
        subscriptionId: subscription.id,
        planTier: subscription.planTier,
        amountUsd: Number(subscription.amountUsd),
        endDate: subscription.endDate.toISOString(),
        message: 'Subscription has already been settled and activated',
      };
    }

    const tenant = subscription.tenant;
    const planConfig = SAAS_PLANS[subscription.planTier];
    const isAnnual =
      subscription.notes?.includes('ANNUAL') || Number(subscription.amountUsd) >= 40;
    const addedDays = isAnnual ? 365 : 30;

    const now = new Date();
    // Compute new expiration: If current subscription is still active and in the future, extend from that date
    const currentEnd = tenant.currentPeriodEnd;
    const baseDate = currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
    const newEndDate = new Date(baseDate.getTime() + addedDays * 24 * 60 * 60 * 1000);

    // Atomic transaction: Update subscription, tenant status, and log audit trail
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedSub = await tx.tenantSubscription.update({
        where: { id: subscription.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
          endDate: newEndDate,
          paymentTranId: dto.tranId || subscription.paymentTranId,
          paymentMethod: 'KHQR',
          notes: `Settled and activated via Dynamic KHQR Tag 01=12 on ${now.toISOString()}`,
        },
      });

      const updatedTenant = await tx.tenant.update({
        where: { id: tenant.id },
        data: {
          planTier: subscription.planTier,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: newEndDate,
          maxDailyKhqr: planConfig.maxDailyKhqr,
          maxMonthlyPatients: planConfig.maxMonthlyPatients,
          maxStaffAccounts: planConfig.maxStaffAccounts,
          isActive: true, // Auto-unfreeze if tenant was frozen
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'SUBSCRIPTION_ACTIVATED',
          entity: 'TENANT',
          entityId: tenant.id,
          tenantId: tenant.id,
          details: {
            planTier: subscription.planTier,
            amountUsd: Number(subscription.amountUsd),
            addedDays,
            newEndDate: newEndDate.toISOString(),
            tranId: dto.tranId || subscription.paymentTranId,
          },
        },
      });

      return { updatedSub, updatedTenant };
    });

    const newEndFormatted = newEndDate.toLocaleDateString('km-KH');
    const quotaDisplay =
      planConfig.maxDailyKhqr === -1 ? 'Unlimited' : `${planConfig.maxDailyKhqr} / ថ្ងៃ`;

    // 1. Dispatch congratulatory alert to Clinic Telegram Security Topic
    if (this.telegramService) {
      this.telegramService
        .notify(
          'SECURITY',
          [
            `<b>[ការទូទាត់ជោគជ័យ: SUBSCRIPTION ACTIVATED]</b>`,
            `----------------------------------------`,
            `• គ្លីនិក: <b>${tenant.clinicNameKh}</b>`,
            `• គម្រោងសេវាកម្ម: <b>${planConfig.nameEn} (${subscription.planTier})</b>`,
            `• ចំនួនទឹកប្រាក់: $${Number(subscription.amountUsd)}.00 USD`,
            `• វិធីសាស្ត្រទូទាត់: KHQR Dynamic Settlement`,
            `• សុពលភាពថ្មី: រហូតដល់ <b>${newEndFormatted}</b> (+${addedDays} ថ្ងៃ)`,
            `• កូតាប្រតិបត្តិការ KHQR: <b>${quotaDisplay}</b>`,
            `• ស្ថានភាពគ្លីនិក: ដំណើរការពេញលេញ (Active)`,
            `----------------------------------------`,
          ].join('\n'),
          tenant.id,
        )
        .catch(() => {});
    }

    // 2. Dispatch Platform Revenue Alert to Super Admin Master Bot
    if (this.masterBotService) {
      this.masterBotService
        .notifySubscriptionPaymentReceived({
          clinicName: tenant.clinicNameEn,
          slug: tenant.slug,
          planTier: subscription.planTier,
          amountUsd: Number(subscription.amountUsd),
          billingCycle: isAnnual ? 'ANNUAL' : 'MONTHLY',
          tranId: dto.tranId || subscription.paymentTranId || 'N/A',
          newEndDate: newEndFormatted,
          addedDays,
        })
        .catch(() => {});
    }

    this.logger.log(
      `Subscription activated for tenant ${tenant.slug}: Tier ${subscription.planTier}, New End: ${newEndDate.toISOString()}`,
    );

    return {
      success: true,
      activated: true,
      alreadySettled: false,
      subscriptionId: result.updatedSub.id,
      planTier: result.updatedTenant.planTier,
      amountUsd: Number(result.updatedSub.amountUsd),
      endDate: newEndDate.toISOString(),
      newExpiryFormatted: newEndFormatted,
      addedDays,
      message: 'Subscription successfully settled and activated',
    };
  }
}
