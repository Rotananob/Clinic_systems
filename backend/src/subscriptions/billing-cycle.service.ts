import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Optional, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import { SAAS_PLANS, PLAN_TIER_RANK } from '../common/constants/plans.constant';
import { TelegramService } from '../telegram/telegram.service';
import { PlatformMasterBotService } from '../telegram/platform-master-bot.service';

export interface BillingCycleCheckSummary {
  checkedCount: number;
  remindersSent7Days: number;
  remindersSent3Days: number;
  markedPastDue: number;
  markedExpired: number;
  timestamp: string;
}

@Injectable()
export class BillingCycleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BillingCycleService.name);
  private checkIntervalTimer: NodeJS.Timeout | null = null;
  private readonly checkIntervalMs = 60 * 60 * 1000; // 60 minutes
  private readonly reminderSentSet = new Set<string>(); // tenantId:daysRemaining:YYYY-MM-DD deduplication cache

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(forwardRef(() => TelegramService)) private readonly telegramService?: TelegramService,
    @Optional() @Inject(forwardRef(() => PlatformMasterBotService)) private readonly masterBotService?: PlatformMasterBotService,
  ) {}

  onModuleInit() {
    this.logger.log('Billing Cycle Engine initialized. Background check scheduled.');
    // Run initial cycle check after 5 seconds
    setTimeout(() => {
      this.runBillingCycleCheck().catch((err) => {
        this.logger.warn(`Initial billing cycle check skipped: ${err.message}`);
      });
    }, 5000);

    // Recurring cycle check every 60 minutes
    this.checkIntervalTimer = setInterval(() => {
      this.runBillingCycleCheck().catch((err) => {
        this.logger.warn(`Scheduled billing cycle check error: ${err.message}`);
      });
    }, this.checkIntervalMs);
  }

  onModuleDestroy() {
    if (this.checkIntervalTimer) {
      clearInterval(this.checkIntervalTimer);
      this.checkIntervalTimer = null;
    }
  }

  /**
   * Evaluates all clinic subscriptions, dispatches 7-day and 3-day reminders,
   * enforces 3-day grace period, and auto-generates renewal invoices.
   */
  async runBillingCycleCheck(): Promise<BillingCycleCheckSummary> {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    this.logger.log(`Running SaaS Billing Cycle check at ${now.toISOString()}`);

    const tenants = await this.prisma.tenant.findMany({
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    let remindersSent7Days = 0;
    let remindersSent3Days = 0;
    let markedPastDue = 0;
    let markedExpired = 0;

    for (const tenant of tenants) {
      // Free Forever tier never expires and is never marked PAST_DUE or frozen
      if (tenant.planTier === PlanTier.FREE) continue;
      const activeSub = tenant.subscriptions?.[0];
      const expiryDate = activeSub?.endDate || tenant.currentPeriodEnd;

      if (!expiryDate) continue;

      const msDiff = expiryDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      const planConfig = SAAS_PLANS[tenant.planTier] || SAAS_PLANS[PlanTier.FREE];
      const expiryFormatted = expiryDate.toLocaleDateString('km-KH');

      // 1. 7-Day Advance Reminder
      if (daysRemaining <= 7 && daysRemaining > 3) {
        const dedupeKey = `${tenant.id}:7days:${todayStr}`;
        if (!this.reminderSentSet.has(dedupeKey)) {
          this.reminderSentSet.add(dedupeKey);
          remindersSent7Days++;

          // Dispatch to Clinic Telegram Security Topic
          if (this.telegramService) {
            this.telegramService.notify(
              'SECURITY',
              [
                `<b>[សេចក្តីជូនដំណឹងផុតកំណត់គម្រោង] ${tenant.clinicNameKh}</b>`,
                `----------------------------------------`,
                `• គម្រោងសេវាកម្ម: <b>${planConfig.nameEn} (${tenant.planTier})</b>`,
                `• កាលបរិច្ឆេទផុតកំណត់: <b>${expiryFormatted}</b>`,
                `• រយៈពេលនៅសល់: <b>${daysRemaining} ថ្ងៃ</b>`,
                `• តម្លៃជាវប្រចាំខែ: $${planConfig.priceUsd}.00 USD`,
                `• សកម្មភាព: សូមចូលទៅកាន់ Settings -> Subscription ដើម្បីបន្តសុពលភាពតាម KHQR ដោយផ្ទាល់។`,
                `----------------------------------------`,
              ].join('\n'),
              tenant.id,
            ).catch(() => {});
          }

          // Dispatch to Master Bot for Super Admin
          if (this.masterBotService) {
            this.masterBotService.notifySubscriptionExpiryReminder({
              clinicName: tenant.clinicNameEn,
              slug: tenant.slug,
              planTier: tenant.planTier,
              daysRemaining,
              endDate: expiryFormatted,
            }).catch(() => {});
          }
        }
      }

      // 2. Urgent 3-Day Reminder
      else if (daysRemaining <= 3 && daysRemaining > 0) {
        const dedupeKey = `${tenant.id}:3days:${todayStr}`;
        if (!this.reminderSentSet.has(dedupeKey)) {
          this.reminderSentSet.add(dedupeKey);
          remindersSent3Days++;

          if (this.telegramService) {
            this.telegramService.notify(
              'SECURITY',
              [
                `<b>[បន្ទាន់: សេចក្តីជូនដំណឹងផុតកំណត់គម្រោង] ${tenant.clinicNameKh}</b>`,
                `----------------------------------------`,
                `• គម្រោងសេវាកម្ម: <b>${planConfig.nameEn} (${tenant.planTier})</b>`,
                `• កាលបរិច្ឆេទផុតកំណត់: <b>${expiryFormatted}</b>`,
                `• រយៈពេលនៅសល់: <b>${daysRemaining} ថ្ងៃចុងក្រោយ</b>`,
                `• សកម្មភាព: សូមបន្តសុពលភាពជាវជាបន្ទាន់ ដើម្បីបញ្ចៀសការរអាក់រអួលដល់ដំណើរការពិនិត្យអ្នកជំងឺ។`,
                `----------------------------------------`,
              ].join('\n'),
              tenant.id,
            ).catch(() => {});
          }

          if (this.masterBotService) {
            this.masterBotService.notifySubscriptionExpiryReminder({
              clinicName: tenant.clinicNameEn,
              slug: tenant.slug,
              planTier: tenant.planTier,
              daysRemaining,
              endDate: expiryFormatted,
            }).catch(() => {});
          }
        }
      }

      // 3. Grace Period Enforced: 0 to -3 days past due
      else if (daysRemaining <= 0 && daysRemaining >= -3 && activeSub?.status === SubscriptionStatus.ACTIVE) {
        markedPastDue++;
        await this.prisma.$transaction(async (tx) => {
          await tx.tenant.update({
            where: { id: tenant.id },
            data: { subscriptionStatus: SubscriptionStatus.PAST_DUE },
          });

          if (activeSub) {
            await tx.tenantSubscription.update({
              where: { id: activeSub.id },
              data: { status: SubscriptionStatus.PAST_DUE },
            });
          }

          // Auto-generate upcoming renewal invoice
          const invNum = `SUB-${tenant.slug.toUpperCase()}-${Date.now().toString().slice(-6)}`;
          await tx.tenantSubscription.create({
            data: {
              tenantId: tenant.id,
              planTier: tenant.planTier,
              amountUsd: planConfig.priceUsd,
              status: SubscriptionStatus.PAST_DUE,
              startDate: now,
              endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
              invoiceNumber: invNum,
              paymentMethod: 'KHQR',
              notes: 'Auto-generated renewal subscription invoice by Billing Cycle Engine',
            },
          });
        });

        if (this.telegramService) {
          this.telegramService.notify(
            'SECURITY',
            [
              `<b>[ការផុតកំណត់គម្រោង: GRACE PERIOD] ${tenant.clinicNameKh}</b>`,
              `----------------------------------------`,
              `• គម្រោងសេវាកម្មបានផុតកំណត់សុពលភាពត្រឹមថ្ងៃ: ${expiryFormatted}`,
              `• ប្រព័ន្ធផ្ដល់ជូន Grace Period ចំនួន ៣ ថ្ងៃមុននឹងផ្អាកដំណើរការ។`,
              `• សូមបង់ប្រាក់ Subscription តាម KHQR ដើម្បីរក្សាដំណើរការធម្មតា។`,
              `----------------------------------------`,
            ].join('\n'),
            tenant.id,
          ).catch(() => {});
        }
      }

      // 4. Past Grace Period: more than 3 days past due -> Freeze Workspace
      else if (daysRemaining < -3 && tenant.isActive && tenant.subscriptionStatus === SubscriptionStatus.PAST_DUE) {
        markedExpired++;
        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            subscriptionStatus: SubscriptionStatus.EXPIRED,
            isActive: false, // Freeze tenant access
          },
        });

        if (this.telegramService) {
          this.telegramService.notify(
            'SECURITY',
            [
              `<b>[ផ្អាកដំណើរការគ្លីនិកជាបណ្ដោះអាសន្ន] ${tenant.clinicNameKh}</b>`,
              `----------------------------------------`,
              `• គម្រោងបានផុតកំណត់ហួស Grace Period រយៈពេល ៣ ថ្ងៃ។`,
              `• គណនីគ្លីនិកត្រូវបានផ្អាកដំណើរការជាបណ្ដោះអាសន្ន (Workspace Frozen)។`,
              `• សូមទាក់ទង Super Admin ឬបង់ប្រាក់ Subscription ដើម្បីបើកដំណើរការឡើងវិញ។`,
              `----------------------------------------`,
            ].join('\n'),
            tenant.id,
          ).catch(() => {});
        }

        if (this.masterBotService) {
          this.masterBotService.sendMasterNotification([
            `<b>[PLATFORM BILLING: WORKSPACE AUTO-FROZEN]</b>`,
            `----------------------------------------`,
            `Clinic: <b>${tenant.clinicNameEn}</b> (<code>${tenant.slug}</code>)`,
            `Status: EXPIRED (Grace Period Exceeded)`,
            `Action: Login locked automatically`,
            `----------------------------------------`,
          ].join('\n')).catch(() => {});
        }
      }
    }

    const summary: BillingCycleCheckSummary = {
      checkedCount: tenants.length,
      remindersSent7Days,
      remindersSent3Days,
      markedPastDue,
      markedExpired,
      timestamp: now.toISOString(),
    };

    this.logger.log(`Billing Cycle check completed: ${JSON.stringify(summary)}`);
    return summary;
  }

  /**
   * Fetches current tenant subscription status, days remaining, and plan details.
   */
  async getCurrentSubscription(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const activeSub = tenant.subscriptions?.[0] || null;
    const now = new Date();
    const isFree = tenant.planTier === PlanTier.FREE;
    const expiryDate = isFree ? null : (activeSub?.endDate || tenant.currentPeriodEnd || null);
    
    let daysRemaining = null;
    let isExpired = false;
    let isPastDue = false;

    if (!isFree && expiryDate) {
      const msDiff = expiryDate.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
      isExpired = tenant.subscriptionStatus === SubscriptionStatus.EXPIRED || (expiryDate.getTime() < now.getTime() && msDiff < -3 * 24 * 60 * 60 * 1000);
      isPastDue = tenant.subscriptionStatus === SubscriptionStatus.PAST_DUE || (expiryDate.getTime() < now.getTime() && !isExpired);
    }

    const planConfig = SAAS_PLANS[tenant.planTier] || SAAS_PLANS[PlanTier.FREE];
    const currentRank = PLAN_TIER_RANK[tenant.planTier] ?? 0;

    return {
      success: true,
      tenantId: tenant.id,
      slug: tenant.slug,
      clinicNameKh: tenant.clinicNameKh,
      clinicNameEn: tenant.clinicNameEn,
      planTier: tenant.planTier,
      planNameKh: planConfig.nameKh,
      planNameEn: planConfig.nameEn,
      priceUsd: planConfig.priceUsd,
      subscriptionStatus: isFree ? SubscriptionStatus.ACTIVE : tenant.subscriptionStatus,
      isFree,
      daysRemaining: isFree ? null : daysRemaining,
      currentPeriodEnd: expiryDate ? expiryDate.toISOString() : null,
      expiryFormattedKh: expiryDate ? expiryDate.toLocaleDateString('km-KH') : null,
      expiryFormattedEn: expiryDate ? expiryDate.toLocaleDateString('en-US') : null,
      isActive: tenant.isActive,
      maxDailyKhqr: tenant.maxDailyKhqr,
      maxMonthlyPatients: tenant.maxMonthlyPatients,
      maxStaffAccounts: tenant.maxStaffAccounts,
      currentSubscription: activeSub,
      recentInvoices: tenant.subscriptions || [],
      currentRank,
      canUpgrade: currentRank < 3,
      canRenew: !isFree,
    };
  }

  /**
   * Returns all available subscription plan tiers with upgrade, renewal, and downgrade eligibility flags.
   */
  async getAvailablePlans(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException(`Clinic tenant ${tenantId} not found`);
    }

    const currentRank = PLAN_TIER_RANK[tenant.planTier] ?? 0;
    const isFree = tenant.planTier === PlanTier.FREE;

    const plans = Object.values(SAAS_PLANS).map((p) => {
      const rank = PLAN_TIER_RANK[p.tier] ?? 0;
      const isCurrent = p.tier === tenant.planTier;
      const isDowngrade = rank < currentRank;
      const isUpgrade = rank > currentRank;
      const canSelect = !isDowngrade;
      const canRenew = isCurrent && p.tier !== PlanTier.FREE;

      return {
        tier: p.tier,
        nameKh: p.nameKh,
        nameEn: p.nameEn,
        priceUsd: p.priceUsd,
        annualPriceUsd: p.priceUsd > 0 ? Math.round(p.priceUsd * 12 * 0.8) : 0,
        annualDiscountPercent: 20,
        maxMonthlyPatients: p.maxMonthlyPatients,
        maxDailyKhqr: p.maxDailyKhqr,
        maxStaffAccounts: p.maxStaffAccounts,
        telegramTopicsAllowed: p.telegramTopicsAllowed,
        voiceCallAllowed: p.voiceCallAllowed,
        inventoryFullAllowed: p.inventoryFullAllowed,
        rank,
        isCurrent,
        isDowngrade,
        isUpgrade,
        canSelect,
        canRenew,
      };
    });

    return {
      success: true,
      currentPlanTier: tenant.planTier,
      currentRank,
      isFree,
      plans,
    };
  }

  /**
   * Fetches past billing invoice records for the current tenant.
   */
  async getSubscriptionHistory(tenantId: string) {
    const history = await this.prisma.tenantSubscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      tenantId,
      invoices: history,
    };
  }
}
