import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanTier } from '@prisma/client';
import { SAAS_PLANS, ROUTE_MINIMUM_PLAN, isRouteAllowedForPlan } from '../common/constants/plans.constant';

export interface QuotaStatus {
  planTier: PlanTier;
  planNameEn: string;
  planNameKh: string;
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
   * Step 19: Enforces daily dynamic KHQR transaction limits per SaaS plan tier.
   * - Plan Free: 5 / day
   * - Plan $5 (Starter): 250 / day
   * - Plan $8 (Pro): 1,500 / day
   * - Plan $12 (Enterprise): Unlimited (-1)
   */
  async checkAndEnforceKhqrQuota(tenantId: string): Promise<{ warning?: boolean; message?: string }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, planTier: true, maxDailyKhqr: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const planConfig = SAAS_PLANS[tenant.planTier] || SAAS_PLANS[PlanTier.FREE];
    const maxLimit = tenant.maxDailyKhqr ?? planConfig.maxDailyKhqr;

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
        `Quota exceeded for tenant ${tenant.slug} (${tenant.planTier}): ${todayCount}/${maxLimit} daily KHQR generated`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'QUOTA_EXCEEDED',
          quotaType: 'DAILY_KHQR',
          currentUsage: todayCount,
          maxLimit,
          planTier: tenant.planTier,
          upgradeRecommended: tenant.planTier === PlanTier.STARTER_5 ? 'PRO_8' : 'ENTERPRISE_12',
          messageKh: `លោកអ្នកបានប្រើប្រាស់កូតា Dynamic KHQR ពេញ ${maxLimit}/${maxLimit} សម្រាប់ថ្ងៃនេះហើយ។ សូម Upgrade គម្រោង Polyclinic Pro ឬ Hospital Enterprise ដើម្បីទទួលបានកូតាបន្ថែម។`,
          messageEn: `You have reached your daily limit of ${maxLimit} dynamic KHQR transactions. Please upgrade to Polyclinic Pro ($8/mo) or Hospital Enterprise ($12/mo) for higher limits.`,
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
   * Step 19: Enforces monthly patient intake registration limits per plan tier.
   * - Plan Free: 50 / month
   * - Plan $5 (Starter): 500 / month
   * - Plan $8 (Pro): Unlimited (-1)
   * - Plan $12 (Enterprise): Unlimited (-1)
   */
  async checkAndEnforcePatientQuota(tenantId: string): Promise<{ warning?: boolean; message?: string }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, planTier: true, maxMonthlyPatients: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const planConfig = SAAS_PLANS[tenant.planTier] || SAAS_PLANS[PlanTier.FREE];
    const maxLimit = tenant.maxMonthlyPatients ?? planConfig.maxMonthlyPatients;

    if (maxLimit === -1) {
      return {};
    }

    const cycleStart = this.getStartOfCurrentCycle();

    const patientCount = await this.prisma.patient.count({
      where: {
        tenantId: tenant.id,
        createdAt: { gte: cycleStart },
      },
    });

    if (patientCount >= maxLimit) {
      this.logger.warn(
        `Patient quota exceeded for tenant ${tenant.slug} (${tenant.planTier}): ${patientCount}/${maxLimit} monthly patients registered`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'QUOTA_EXCEEDED',
          quotaType: 'MONTHLY_PATIENTS',
          currentUsage: patientCount,
          maxLimit,
          planTier: tenant.planTier,
          upgradeRecommended: 'PRO_8',
          messageKh: `លោកអ្នកបានចុះឈ្មោះអ្នកជំងឺដល់កម្រិតកំណត់ ${maxLimit}/${maxLimit} នាក់ក្នុងខែនេះហើយ។ សូម Upgrade គម្រោង Polyclinic Pro ($8/ខែ) ដើម្បីទទួលបាន Unlimited អ្នកជំងឺ។`,
          messageEn: `You have reached your monthly limit of ${maxLimit} registered patients. Please upgrade to Polyclinic Pro ($8/mo) for unlimited patient records.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (patientCount >= Math.floor(maxLimit * 0.8)) {
      return {
        warning: true,
        message: `You have registered ${patientCount}/${maxLimit} monthly patients. Consider upgrading to Polyclinic Pro for unlimited patients.`,
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
      select: { id: true, slug: true, planTier: true, maxStaffAccounts: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const planConfig = SAAS_PLANS[tenant.planTier] || SAAS_PLANS[PlanTier.FREE];
    const maxLimit = tenant.maxStaffAccounts ?? planConfig.maxStaffAccounts;

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
          planTier: tenant.planTier,
          messageKh: `គ្លីនិករបស់លោកអ្នកបានបង្កើតគណនីបុគ្គលិកពេញ ${maxLimit}/${maxLimit} ហើយ។ សូម Upgrade គម្រោងដើម្បីបន្ថែមបុគ្គលិក។`,
          messageEn: `You have reached your staff account limit of ${maxLimit} members. Please upgrade your subscription to add more team members.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Enforces progressive feature tier gating (Free -> Starter -> Pro -> Enterprise)
   */
  async checkFeatureAccess(tenantId: string, pathname: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, planTier: true, clinicType: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    if (!isRouteAllowedForPlan(tenant.planTier, pathname, tenant.clinicType)) {
      const requiredPlan = ROUTE_MINIMUM_PLAN[pathname] || PlanTier.STARTER_5;
      const planCfg = SAAS_PLANS[requiredPlan];

      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          error: 'FEATURE_UPGRADE_REQUIRED',
          currentPlan: tenant.planTier,
          requiredPlan,
          requiredPlanName: planCfg?.nameKh || requiredPlan,
          messageKh: `មុខងារនេះទាមទារគម្រោង ${planCfg?.nameKh} ($${planCfg?.priceUsd}/ខែ) ឬខ្ពស់ជាងនេះ។ សូម Upgrade គម្រោងរបស់អ្នក។`,
          messageEn: `This feature requires ${planCfg?.nameEn} ($${planCfg?.priceUsd}/mo) or higher. Please upgrade your subscription.`,
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

    const planConfig = SAAS_PLANS[tenant.planTier] || SAAS_PLANS[PlanTier.FREE];
    const startOfToday = this.getStartOfTodayCambodia();
    const cycleStart = this.getStartOfCurrentCycle();

    const [todayKhqrCount, monthlyPatientCount, staffCount] = await Promise.all([
      this.prisma.paymentTransaction.count({
        where: {
          invoice: { tenantId: tenant.id },
          createdAt: { gte: startOfToday },
        },
      }),
      this.prisma.patient.count({
        where: {
          tenantId: tenant.id,
          createdAt: { gte: cycleStart },
        },
      }),
      this.prisma.user.count({
        where: {
          tenantId: tenant.id,
          isActive: true,
        },
      }),
    ]);

    const khqrLimit = tenant.maxDailyKhqr ?? planConfig.maxDailyKhqr;
    const patientLimit = tenant.maxMonthlyPatients ?? planConfig.maxMonthlyPatients;
    const staffLimit = tenant.maxStaffAccounts ?? planConfig.maxStaffAccounts;

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

    return {
      planTier: tenant.planTier,
      planNameEn: planConfig.nameEn,
      planNameKh: planConfig.nameKh,
      dailyKhqr: calcMetric(todayKhqrCount, khqrLimit),
      monthlyPatients: calcMetric(monthlyPatientCount, patientLimit),
      staffAccounts: calcMetric(staffCount, staffLimit),
    };
  }
}
