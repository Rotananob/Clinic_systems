import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import { SAAS_PLANS, ROUTE_MINIMUM_PLAN, isRouteAllowedForPlan } from '../common/constants/plans.constant';

export interface QuotaStatus {
  planTier: PlanTier;
  planNameEn: string;
  planNameKh: string;
  isExpired?: boolean;
  dailyKhqr: {
    used: number;
    limit: number;
    remaining: number;
    percent: number;
    isApproachingLimit: boolean;
    isExceeded: boolean;
  };
  monthlyPatients: {
    used: number;
    limit: number;
    remaining: number;
    percent: number;
    isApproachingLimit: boolean;
    isExceeded: boolean;
  };
  accountPatients?: {
    used: number;
    limit: number;
    remaining: number;
    percent: number;
    isApproachingLimit: boolean;
    isExceeded: boolean;
  };
  staffAccounts: {
    used: number;
    limit: number;
    remaining: number;
    percent: number;
    isApproachingLimit: boolean;
    isExceeded: boolean;
  };
}

@Injectable()
export class QuotaGuardService {
  private readonly logger = new Logger(QuotaGuardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates beginning of today in Asia/Phnom_Penh (UTC+7) timezone
   */
  private getStartOfTodayCambodia(): Date {
    const now = new Date();
    // Offset by +7 hours to get Cambodia local time
    const cambodiaTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    cambodiaTime.setUTCHours(0, 0, 0, 0);
    // Convert back to UTC timestamp
    return new Date(cambodiaTime.getTime() - 7 * 60 * 60 * 1000);
  }

  /**
   * Calculates beginning of current 30-day billing cycle or current month
   */
  private getStartOfCurrentCycle(): Date {
    const now = new Date();
    const cycleStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return cycleStart;
  }

  /**
   * Resolves the real, tamper-proof effective plan tier.
   * If a clinic's subscription has expired (currentPeriodEnd in the past or status EXPIRED),
   * strictly restricts effective quotas and permissions to FREE tier limits to prevent bypass.
   */
  public resolveEffectivePlan(tenant: {
    id: string;
    slug?: string;
    planTier: PlanTier;
    subscriptionStatus?: SubscriptionStatus | null;
    currentPeriodEnd?: Date | null;
  }): { planTier: PlanTier; isExpired: boolean } {
    if (tenant.planTier === PlanTier.FREE) {
      return { planTier: PlanTier.FREE, isExpired: false };
    }

    const now = new Date();
    const isPastPeriodEnd = Boolean(
      tenant.currentPeriodEnd && tenant.currentPeriodEnd.getTime() < now.getTime(),
    );
    const isStatusExpired =
      tenant.subscriptionStatus === SubscriptionStatus.EXPIRED;

    if (isPastPeriodEnd || isStatusExpired) {
      this.logger.warn(
        `Anti-Bypass Guard: Tenant ${tenant.slug || tenant.id} (${tenant.planTier}) subscription is expired (End: ${tenant.currentPeriodEnd?.toISOString() || 'N/A'}, Status: ${tenant.subscriptionStatus}). Demoting effective tier strictly to FREE limits.`,
      );

      // Lazily sync subscriptionStatus in DB if not already marked EXPIRED
      if (tenant.subscriptionStatus !== SubscriptionStatus.EXPIRED) {
        this.prisma.tenant
          .update({
            where: { id: tenant.id },
            data: { subscriptionStatus: SubscriptionStatus.EXPIRED },
          })
          .catch((err) => {
            this.logger.debug(`Background expired status sync skipped: ${err.message}`);
          });
      }

      return { planTier: PlanTier.FREE, isExpired: true };
    }

    return { planTier: tenant.planTier, isExpired: false };
  }

  /**
   * Step 19: Enforces daily dynamic KHQR transaction limits per SaaS plan tier.
   * - Plan Free: 5 / day (or 10 / day free trial)
   * - Plan $5 (Starter): 250 / day
   * - Plan $8 (Pro): 1,500 / day
   * - Plan $12 (Enterprise): Unlimited (-1)
   */
  async checkAndEnforceKhqrQuota(tenantId: string): Promise<{ warning?: boolean; message?: string }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        planTier: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        maxDailyKhqr: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const effective = this.resolveEffectivePlan(tenant);
    const planConfig = SAAS_PLANS[effective.planTier] || SAAS_PLANS[PlanTier.FREE];
    const maxLimit = effective.isExpired
      ? planConfig.maxDailyKhqr
      : (tenant.maxDailyKhqr ?? planConfig.maxDailyKhqr);

    // Unlimited tier (-1)
    if (maxLimit === -1) {
      return {};
    }

    const startOfToday = this.getStartOfTodayCambodia();

    // Count today's payment transactions for this tenant
    const todayCount = await this.prisma.paymentTransaction.count({
      where: {
        invoice: { tenantId: tenant.id },
        createdAt: { gte: startOfToday },
      },
    });

    if (todayCount >= maxLimit) {
      this.logger.warn(
        `Quota exceeded for tenant ${tenant.slug} (${tenant.planTier}, effective: ${effective.planTier}): ${todayCount}/${maxLimit} daily KHQR generated`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'QUOTA_EXCEEDED',
          quotaType: 'DAILY_KHQR',
          currentUsage: todayCount,
          maxLimit,
          planTier: effective.planTier,
          isSubscriptionExpired: effective.isExpired,
          upgradeRecommended:
            effective.planTier === PlanTier.STARTER_5 ? 'PRO_8' : 'ENTERPRISE_12',
          messageKh: effective.isExpired
            ? `គម្រោងសេវាកម្មបានផុតកំណត់។ លោកអ្នកត្រូវបានកំណត់កូតាត្រឹម ${maxLimit}/${maxLimit} សម្រាប់គម្រោង Free។ សូមបន្តគម្រោង Starter ឬ Pro ដើម្បីទទួលបានកូតាបន្ថែម។`
            : `លោកអ្នកបានប្រើប្រាស់កូតា Dynamic KHQR ពេញ ${maxLimit}/${maxLimit} សម្រាប់ថ្ងៃនេះហើយ។ សូម Upgrade គម្រោង Polyclinic Pro ឬ Hospital Enterprise ដើម្បីទទួលបានកូតាបន្ថែម។`,
          messageEn: effective.isExpired
            ? `Your subscription has expired and reverted to Free tier (${maxLimit} daily KHQR). Please renew to unlock full quota.`
            : `You have reached your daily limit of ${maxLimit} dynamic KHQR transactions. Please upgrade to Polyclinic Pro or Hospital Enterprise for higher limits.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Approach warning threshold (>= 80%)
    if (todayCount >= Math.floor(maxLimit * 0.8)) {
      const remaining = maxLimit - todayCount;
      return {
        warning: true,
        message: `You have used ${todayCount}/${maxLimit} daily KHQR transactions (${remaining} remaining today).`,
      };
    }

    return {};
  }

  /**
   * Step 19: Enforces patient intake registration limits per account tier.
   * - Plan Free: 50 / account
   * - Plan $5 (Starter): 1,000 / account
   * - Plan $8 (Pro): 5,000 / account
   * - Plan $12 (Enterprise): Unlimited (-1)
   */
  async checkAndEnforcePatientQuota(tenantId: string): Promise<{ warning?: boolean; message?: string }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        planTier: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        maxMonthlyPatients: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const effective = this.resolveEffectivePlan(tenant);
    const planConfig = SAAS_PLANS[effective.planTier] || SAAS_PLANS[PlanTier.FREE];
    const maxLimit = effective.isExpired
      ? planConfig.maxMonthlyPatients
      : (tenant.maxMonthlyPatients ?? planConfig.maxMonthlyPatients);

    if (maxLimit === -1) {
      return {};
    }

    const patientCount = await this.prisma.patient.count({
      where: {
        tenantId: tenant.id,
      },
    });

    if (patientCount >= maxLimit) {
      this.logger.warn(
        `Patient quota exceeded for tenant ${tenant.slug} (${tenant.planTier}, effective: ${effective.planTier}): ${patientCount}/${maxLimit} patients registered in account`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'QUOTA_EXCEEDED',
          quotaType: 'ACCOUNT_PATIENTS',
          currentUsage: patientCount,
          maxLimit,
          planTier: effective.planTier,
          isSubscriptionExpired: effective.isExpired,
          upgradeRecommended: effective.planTier === PlanTier.FREE ? 'STARTER_5' : effective.planTier === PlanTier.STARTER_5 ? 'PRO_8' : 'ENTERPRISE_12',
          messageKh: effective.isExpired
            ? `គម្រោងសេវាកម្មបានផុតកំណត់។ លោកអ្នកបានចុះឈ្មោះអ្នកជំងឺដល់កម្រិតកំណត់ ${maxLimit}/${maxLimit} នាក់ក្នុងមួយគណនី។ សូមបន្តសុពលភាពគម្រោងឡើងវិញ។`
            : `លោកអ្នកបានចុះឈ្មោះអ្នកជំងឺដល់កម្រិតកំណត់ ${maxLimit}/${maxLimit} នាក់ក្នុងមួយគណនីហើយ។ សូម Upgrade គម្រោង Polyclinic Pro ឬ Hospital Enterprise ដើម្បីទទួលបានកូតាបន្ថែម។`,
          messageEn: effective.isExpired
            ? `Your subscription has expired and patient intake is capped at ${maxLimit} per account. Please renew your paid plan.`
            : `You have reached your limit of ${maxLimit} registered patients per account. Please upgrade to Polyclinic Pro or Hospital Enterprise for higher limits.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (patientCount >= Math.floor(maxLimit * 0.8)) {
      return {
        warning: true,
        message: `You have registered ${patientCount}/${maxLimit} patients in this account. Consider upgrading for higher capacity.`,
      };
    }

    return {};
  }

  /**
   * Step 19: Enforces staff account allocation limits per plan tier.
   * - Plan Free: 2 staff
   * - Plan $5: 5 staff
   * - Plan $8: 15 staff
   * - Plan $12: Unlimited (-1)
   */
  async checkAndEnforceStaffQuota(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        planTier: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        maxStaffAccounts: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const effective = this.resolveEffectivePlan(tenant);
    const planConfig = SAAS_PLANS[effective.planTier] || SAAS_PLANS[PlanTier.FREE];
    const maxLimit = effective.isExpired
      ? planConfig.maxStaffAccounts
      : (tenant.maxStaffAccounts ?? planConfig.maxStaffAccounts);

    if (maxLimit === -1) {
      return;
    }

    const staffCount = await this.prisma.user.count({
      where: { tenantId: tenant.id, isActive: true },
    });

    if (staffCount >= maxLimit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'QUOTA_EXCEEDED',
          quotaType: 'STAFF_ACCOUNTS',
          currentUsage: staffCount,
          maxLimit,
          planTier: effective.planTier,
          isSubscriptionExpired: effective.isExpired,
          messageKh: effective.isExpired
            ? `គម្រោងសេវាកម្មបានផុតកំណត់។ គណនីបុគ្គលិកត្រូវបានកំណត់ត្រឹម ${maxLimit}/${maxLimit} នាក់។ សូមបន្តសុពលភាពគម្រោងឡើងវិញ។`
            : `គ្លីនិករបស់លោកអ្នកបានបង្កើតគណនីបុគ្គលិកពេញ ${maxLimit}/${maxLimit} ហើយ។ សូម Upgrade គម្រោងដើម្បីបន្ថែមបុគ្គលិក។`,
          messageEn: effective.isExpired
            ? `Your subscription has expired and team accounts are restricted to ${maxLimit}. Please renew to add more team members.`
            : `You have reached your staff account limit of ${maxLimit} members. Please upgrade your subscription to add more team members.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Enforces progressive feature tier gating (Free -> Starter -> Pro -> Enterprise)
   * with anti-bypass demotion if subscription is expired.
   */
  async checkFeatureAccess(tenantId: string, pathname: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        planTier: true,
        clinicType: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const effective = this.resolveEffectivePlan(tenant);

    if (!isRouteAllowedForPlan(effective.planTier, pathname, tenant.clinicType)) {
      const requiredPlan = ROUTE_MINIMUM_PLAN[pathname] || PlanTier.STARTER_5;
      const planCfg = SAAS_PLANS[requiredPlan];

      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'FEATURE_UPGRADE_REQUIRED',
          currentPlan: effective.planTier,
          requiredPlan,
          requiredPlanName: planCfg?.nameKh || requiredPlan,
          isSubscriptionExpired: effective.isExpired,
          messageKh: effective.isExpired
            ? `គម្រោងសេវាកម្មរបស់អ្នកបានផុតកំណត់ហើយ។ សូមបង់ប្រាក់បន្តគម្រោង ${planCfg?.nameKh} ($${planCfg?.priceUsd}/ខែ) ដើម្បីប្រើប្រាស់មុខងារនេះឡើងវិញ។`
            : `មុខងារនេះទាមទារគម្រោង ${planCfg?.nameKh} ($${planCfg?.priceUsd}/ខែ) ឬខ្ពស់ជាងនេះ។ សូម Upgrade គម្រោងរបស់អ្នក។`,
          messageEn: effective.isExpired
            ? `Your subscription has expired. Please renew your ${planCfg?.nameEn} ($${planCfg?.priceUsd}/mo) plan to access this feature.`
            : `This feature requires ${planCfg?.nameEn} ($${planCfg?.priceUsd}/mo) or higher. Please upgrade your subscription.`,
        },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  /**
   * Step 19: Fetches real-time quota status and percentage progress for the clinic dashboard.
   */
  async getQuotaStatus(tenantId: string): Promise<QuotaStatus> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const effective = this.resolveEffectivePlan(tenant);
    const planConfig = SAAS_PLANS[effective.planTier] || SAAS_PLANS[PlanTier.FREE];
    const startOfToday = this.getStartOfTodayCambodia();
    const cycleStart = this.getStartOfCurrentCycle();

    const [todayKhqrCount, patientCount, staffCount] = await Promise.all([
      this.prisma.paymentTransaction.count({
        where: {
          invoice: { tenantId: tenant.id },
          createdAt: { gte: startOfToday },
        },
      }),
      this.prisma.patient.count({
        where: {
          tenantId: tenant.id,
        },
      }),
      this.prisma.user.count({
        where: {
          tenantId: tenant.id,
          isActive: true,
        },
      }),
    ]);

    const khqrLimit = effective.isExpired
      ? planConfig.maxDailyKhqr
      : (tenant.maxDailyKhqr ?? planConfig.maxDailyKhqr);
    const patientLimit = effective.isExpired
      ? planConfig.maxMonthlyPatients
      : (tenant.maxMonthlyPatients ?? planConfig.maxMonthlyPatients);
    const staffLimit = effective.isExpired
      ? planConfig.maxStaffAccounts
      : (tenant.maxStaffAccounts ?? planConfig.maxStaffAccounts);

    const calcMetric = (used: number, limit: number) => {
      if (limit === -1) {
        return {
          used,
          limit: -1,
          remaining: 999999,
          percent: 0,
          isApproachingLimit: false,
          isExceeded: false,
        };
      }
      const percent = Math.min(100, Math.round((used / limit) * 100));
      return {
        used,
        limit,
        remaining: Math.max(0, limit - used),
        percent,
        isApproachingLimit: percent >= 80,
        isExceeded: used >= limit,
      };
    };

    const patientMetric = calcMetric(patientCount, patientLimit);

    return {
      planTier: effective.planTier,
      planNameEn: planConfig.nameEn,
      planNameKh: planConfig.nameKh,
      isExpired: effective.isExpired,
      dailyKhqr: calcMetric(todayKhqrCount, khqrLimit),
      monthlyPatients: patientMetric,
      accountPatients: patientMetric,
      staffAccounts: calcMetric(staffCount, staffLimit),
    };
  }
}
