import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import { SAAS_PLANS } from '../common/constants/plans.constant';
import { OverridePlanDto } from './dto/override-plan.dto';
import { ToggleMaintenanceDto } from './dto/toggle-maintenance.dto';
import * as bcrypt from 'bcryptjs';
import { GetUsersDto } from './dto/get-users.dto';
import { CreateGlobalUserDto } from './dto/create-global-user.dto';
import { UpdateGlobalUserDto } from './dto/update-global-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface PlatformMetrics {
  fleet: {
    totalClinics: number;
    activeClinics: number;
    pastDueClinics: number;
    frozenClinics: number;
  };
  financial: {
    totalRevenueUsd: number;
    mrrUsd: number;
    arrUsd: number;
    totalSubscriptionOrders: number;
  };
  activity: {
    totalPatients: number;
    totalVisits: number;
    totalPrescriptions: number;
    totalKhqrTransactions: number;
    totalStaffAccounts: number;
  };
  system: {
    maintenanceMode: boolean;
    maintenanceMessageKh: string;
    maintenanceMessageEn: string;
    uptimeSeconds: number;
  };
}

export interface FleetClinicItem {
  id: string;
  slug: string;
  clinicNameKh: string;
  clinicNameEn: string;
  subdomain: string;
  mohLicenseNumber: string | null;
  phonePrimary: string | null;
  email: string | null;
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  daysRemaining: number;
  isActive: boolean;
  createdAt: Date;
  bakongAccountId: string | null;
  merchantName: string | null;
  stats: {
    patientCount: number;
    staffCount: number;
    todayKhqrCount: number;
    dailyKhqrQuota: number;
    monthlyPatientQuota: number;
    totalRevenueUsd: number;
  };
}

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  // Global Platform Maintenance State
  private static maintenanceMode: boolean = false;
  private static maintenanceMessageKh: string =
    'ប្រព័ន្ធកំពុងដំណើរការថែទាំប្រចាំខែ (Scheduled System Maintenance)។ សូមអធ្យាស្រ័យចំពោះការរំខាន។';
  private static maintenanceMessageEn: string =
    'ClinicOS platform is currently undergoing scheduled system maintenance. All services will resume shortly.';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Check whether global maintenance mode is active platform-wide
   */
  static isMaintenanceModeActive(): boolean {
    return SuperAdminService.maintenanceMode;
  }

  static getMaintenanceMessage(): { messageKh: string; messageEn: string } {
    return {
      messageKh: SuperAdminService.maintenanceMessageKh,
      messageEn: SuperAdminService.maintenanceMessageEn,
    };
  }

  /**
   * Calculates Cambodia midnight (UTC+7) for today
   */
  private getStartOfTodayCambodia(): Date {
    const now = new Date();
    const cambodiaTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    cambodiaTime.setUTCHours(0, 0, 0, 0);
    return new Date(cambodiaTime.getTime() - 7 * 60 * 60 * 1000);
  }

  /**
   * Step 21: Master Platform KPI metrics
   */
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    const startOfToday = this.getStartOfTodayCambodia();

    const [
      totalClinics,
      activeClinics,
      pastDueClinics,
      frozenClinics,
      totalPatients,
      totalVisits,
      totalPrescriptions,
      totalKhqrTransactions,
      totalStaffAccounts,
      subscriptionInvoices,
      allTenants,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({
        where: { isActive: true, subscriptionStatus: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.tenant.count({
        where: { subscriptionStatus: SubscriptionStatus.PAST_DUE },
      }),
      this.prisma.tenant.count({
        where: {
          OR: [
            { isActive: false },
            { subscriptionStatus: SubscriptionStatus.CANCELLED },
            { subscriptionStatus: SubscriptionStatus.EXPIRED },
          ],
        },
      }),
      this.prisma.patient.count(),
      this.prisma.visit.count(),
      this.prisma.prescription.count(),
      this.prisma.paymentTransaction.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.tenantSubscription.findMany({
        select: { amountUsd: true, status: true },
      }),
      this.prisma.tenant.findMany({
        where: { isActive: true, subscriptionStatus: SubscriptionStatus.ACTIVE },
        select: { planTier: true },
      }),
    ]);

    // Calculate total all-time revenue collected
    const totalRevenueUsd = subscriptionInvoices.reduce(
      (sum, item) => sum + Number(item.amountUsd),
      0,
    );

    // Calculate Monthly Recurring Revenue (MRR) based on currently active clinic tiers
    const tierPricingMap: Record<PlanTier, number> = {
      [PlanTier.FREE]: 0,
      [PlanTier.STARTER_5]: 5,
      [PlanTier.PRO_8]: 8,
      [PlanTier.ENTERPRISE_12]: 12,
    };

    const mrrUsd = allTenants.reduce(
      (sum, tenant) => sum + (tierPricingMap[tenant.planTier] || 0),
      0,
    );
    const arrUsd = mrrUsd * 12;

    return {
      fleet: {
        totalClinics,
        activeClinics,
        pastDueClinics,
        frozenClinics,
      },
      financial: {
        totalRevenueUsd,
        mrrUsd,
        arrUsd,
        totalSubscriptionOrders: subscriptionInvoices.length,
      },
      activity: {
        totalPatients,
        totalVisits,
        totalPrescriptions,
        totalKhqrTransactions,
        totalStaffAccounts,
      },
      system: {
        maintenanceMode: SuperAdminService.maintenanceMode,
        maintenanceMessageKh: SuperAdminService.maintenanceMessageKh,
        maintenanceMessageEn: SuperAdminService.maintenanceMessageEn,
        uptimeSeconds: Math.floor(process.uptime()),
      },
    };
  }

  /**
   * Step 21: Full fleet list of all clinics with live metrics
   */
  async getFleetClinics(): Promise<FleetClinicItem[]> {
    const startOfToday = this.getStartOfTodayCambodia();

    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            patients: true,
            users: true,
          },
        },
        subscriptions: {
          select: {
            amountUsd: true,
          },
        },
      },
    });

    const now = new Date();

    const clinicItems: FleetClinicItem[] = await Promise.all(
      tenants.map(async (tenant) => {
        // Count today's transactions for this tenant
        const todayKhqrCount = await this.prisma.paymentTransaction.count({
          where: {
            invoice: { tenantId: tenant.id },
            createdAt: { gte: startOfToday },
          },
        });

        // Compute days remaining
        let daysRemaining = 0;
        if (tenant.currentPeriodEnd) {
          const msDiff = tenant.currentPeriodEnd.getTime() - now.getTime();
          daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
        }

        const totalRevenueUsd = tenant.subscriptions.reduce(
          (sum, sub) => sum + Number(sub.amountUsd),
          0,
        );

        const planConfig = SAAS_PLANS[tenant.planTier] || SAAS_PLANS[PlanTier.FREE];

        return {
          id: tenant.id,
          slug: tenant.slug,
          clinicNameKh: tenant.clinicNameKh,
          clinicNameEn: tenant.clinicNameEn,
          subdomain: `${tenant.slug}.${process.env.APP_DOMAIN || 'clinic.com'}`,
          mohLicenseNumber: tenant.mohLicenseNumber,
          phonePrimary: tenant.phonePrimary,
          email: tenant.email,
          planTier: tenant.planTier,
          subscriptionStatus: tenant.subscriptionStatus,
          currentPeriodEnd: tenant.currentPeriodEnd,
          daysRemaining,
          isActive: tenant.isActive,
          createdAt: tenant.createdAt,
          bakongAccountId: tenant.bakongAccountId,
          merchantName: tenant.merchantName,
          stats: {
            patientCount: tenant._count.patients,
            staffCount: tenant._count.users,
            todayKhqrCount,
            dailyKhqrQuota: tenant.maxDailyKhqr ?? planConfig.maxDailyKhqr,
            monthlyPatientQuota: tenant.maxMonthlyPatients ?? planConfig.maxMonthlyPatients,
            totalRevenueUsd,
          },
        };
      }),
    );

    return clinicItems;
  }

  /**
   * Step 22: Emergency Lockout / Freeze a clinic workspace
   */
  async freezeClinic(tenantId: string, reason?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isActive: false,
        subscriptionStatus: SubscriptionStatus.CANCELLED,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'TENANT_EMERGENCY_LOCKOUT',
        entity: 'TENANT',
        entityId: tenantId,
        details: {
          reason: reason || 'Suspended by Super Admin platform security governance',
          previousStatus: tenant.subscriptionStatus,
        },
      },
    });

    this.logger.warn(`Clinic ${tenant.slug} (${tenant.id}) has been FROZEN by Super Admin.`);

    return {
      success: true,
      tenantId: updated.id,
      slug: updated.slug,
      isActive: updated.isActive,
      subscriptionStatus: updated.subscriptionStatus,
      messageKh: `គ្លីនិក ${updated.clinicNameKh} ត្រូវបានផ្អាកដំណើរការ (Frozen) ដោយជោគជ័យ។`,
      messageEn: `Clinic ${updated.clinicNameEn} has been suspended (Frozen) successfully.`,
    };
  }

  /**
   * Step 22: Unfreeze a clinic workspace
   */
  async unfreezeClinic(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isActive: true,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'TENANT_RESTORED',
        entity: 'TENANT',
        entityId: tenantId,
        details: {
          action: 'Clinic unfreezed and workspace access restored by Super Admin',
        },
      },
    });

    this.logger.log(`Clinic ${tenant.slug} (${tenant.id}) has been UNFROZEN by Super Admin.`);

    return {
      success: true,
      tenantId: updated.id,
      slug: updated.slug,
      isActive: updated.isActive,
      subscriptionStatus: updated.subscriptionStatus,
      messageKh: `គ្លីនិក ${updated.clinicNameKh} ត្រូវបានបើកដំណើរការឡើងវិញ (Unfrozen) ដោយជោគជ័យ។`,
      messageEn: `Clinic ${updated.clinicNameEn} has been restored (Unfrozen) successfully.`,
    };
  }

  /**
   * Step 22: Override plan tier or manually extend validity
   */
  async overridePlan(tenantId: string, dto: OverridePlanDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const targetTier = dto.planTier || tenant.planTier;
    const planConfig = SAAS_PLANS[targetTier] || SAAS_PLANS[PlanTier.FREE];

    const now = new Date();
    let newPeriodEnd = tenant.currentPeriodEnd;

    if (dto.newExpiryDate) {
      newPeriodEnd = new Date(dto.newExpiryDate);
    } else if (dto.addDays && dto.addDays > 0) {
      const baseTime =
        tenant.currentPeriodEnd && tenant.currentPeriodEnd > now
          ? tenant.currentPeriodEnd.getTime()
          : now.getTime();
      newPeriodEnd = new Date(baseTime + dto.addDays * 24 * 60 * 60 * 1000);
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        planTier: targetTier,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        isActive: true,
        currentPeriodEnd: newPeriodEnd,
        maxDailyKhqr: dto.maxDailyKhqr ?? planConfig.maxDailyKhqr,
        maxMonthlyPatients: dto.maxMonthlyPatients ?? planConfig.maxMonthlyPatients,
        maxStaffAccounts: dto.maxStaffAccounts ?? planConfig.maxStaffAccounts,
      },
    });

    // Record administrative override record in tenant_subscriptions
    if (dto.addDays || dto.planTier || dto.newExpiryDate) {
      await this.prisma.tenantSubscription.create({
        data: {
          tenantId,
          planTier: targetTier,
          amountUsd: 0.0,
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
          endDate: newPeriodEnd || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          paymentMethod: 'SUPER_ADMIN_OVERRIDE',
          paymentTranId: `MANUAL-${Date.now().toString(36).toUpperCase()}`,
          invoiceNumber: `OVR-${Date.now().toString(36).toUpperCase()}`,
          notes: dto.reason || 'Super Admin manual plan adjustment or complimentary extension',
        },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'TENANT_PLAN_OVERRIDE',
        entity: 'TENANT',
        entityId: tenantId,
        details: {
          previousTier: tenant.planTier,
          newTier: targetTier,
          newExpiryDate: newPeriodEnd,
          reason: dto.reason,
        },
      },
    });

    return {
      success: true,
      tenantId: updated.id,
      slug: updated.slug,
      planTier: updated.planTier,
      currentPeriodEnd: updated.currentPeriodEnd,
      maxDailyKhqr: updated.maxDailyKhqr,
      maxMonthlyPatients: updated.maxMonthlyPatients,
      messageKh: `បានកែប្រែគម្រោង និងពន្យារសុពលភាពគ្លីនិក ${updated.clinicNameKh} ដោយជោគជ័យ។`,
      messageEn: `Plan override and validity extension applied for ${updated.clinicNameEn} successfully.`,
    };
  }

  /**
   * Step 22: Purge mock / demo clinical activity for a specific clinic
   */
  async purgeDemoData(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    // Purge records in strict foreign-key order
    const [
      deletedPayments,
      deletedPrescriptionItems,
      deletedInvoices,
      deletedPrescriptions,
      deletedMedicalRecords,
      deletedVisits,
      deletedFollowUps,
      deletedPatients,
    ] = await this.prisma.$transaction([
      this.prisma.paymentTransaction.deleteMany({
        where: { invoice: { tenantId } },
      }),
      this.prisma.prescriptionItem.deleteMany({
        where: { prescription: { tenantId } },
      }),
      this.prisma.invoice.deleteMany({
        where: { tenantId },
      }),
      this.prisma.prescription.deleteMany({
        where: { tenantId },
      }),
      this.prisma.medicalRecord.deleteMany({
        where: { patient: { tenantId } },
      }),
      this.prisma.visit.deleteMany({
        where: { tenantId },
      }),
      this.prisma.followUp.deleteMany({
        where: { tenantId },
      }),
      this.prisma.patient.deleteMany({
        where: { tenantId },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'TENANT_DEMO_DATA_PURGED',
        entity: 'TENANT',
        entityId: tenantId,
        details: {
          deletedPatients: deletedPatients.count,
          deletedVisits: deletedVisits.count,
          deletedInvoices: deletedInvoices.count,
        },
      },
    });

    this.logger.warn(`Demo data purged for clinic ${tenant.slug} (${tenant.id}).`);

    return {
      success: true,
      tenantId: tenant.id,
      slug: tenant.slug,
      purged: {
        patients: deletedPatients.count,
        visits: deletedVisits.count,
        invoices: deletedInvoices.count,
        prescriptions: deletedPrescriptions.count,
        payments: deletedPayments.count,
      },
      messageKh: `បានសម្អាតទិន្នន័យសាកល្បងរបស់គ្លីនិក ${tenant.clinicNameKh} ចំនួន ${deletedPatients.count} អ្នកជំងឺ និង ${deletedInvoices.count} វិក្កយបត្ររួចរាល់។`,
      messageEn: `Demo data cleaned for ${tenant.clinicNameEn}: ${deletedPatients.count} patients and ${deletedInvoices.count} invoices purged.`,
    };
  }

  /**
   * Step 22: Configure global maintenance mode
   */
  async setMaintenanceMode(dto: ToggleMaintenanceDto) {
    SuperAdminService.maintenanceMode = dto.enabled;
    if (dto.messageKh) {
      SuperAdminService.maintenanceMessageKh = dto.messageKh;
    }
    if (dto.messageEn) {
      SuperAdminService.maintenanceMessageEn = dto.messageEn;
    }

    this.logger.warn(
      `Global Maintenance Mode has been toggled: ${dto.enabled ? 'ACTIVE (SYSTEM LOCKED)' : 'INACTIVE (NORMAL OPERATIONS)'}`,
    );

    return {
      success: true,
      maintenanceMode: SuperAdminService.maintenanceMode,
      messageKh: SuperAdminService.maintenanceMessageKh,
      messageEn: SuperAdminService.maintenanceMessageEn,
    };
  }

  /**
   * Step 22: Get maintenance status
   */
  getMaintenanceMode() {
    return {
      maintenanceMode: SuperAdminService.maintenanceMode,
      messageKh: SuperAdminService.maintenanceMessageKh,
      messageEn: SuperAdminService.maintenanceMessageEn,
    };
  }

  /**
   * Step 22: Temporary audit session token for workspace inspection
   */
  async impersonateTenant(tenantId: string, superAdminUser: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    const payload = {
      sub: superAdminUser.id,
      email: superAdminUser.email,
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      isImpersonating: true,
      impersonatedAt: new Date().toISOString(),
    };

    const token = this.jwtService.sign(payload, { expiresIn: '2h' });

    await this.prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: 'SUPER_ADMIN_WORKSPACE_IMPERSONATION',
        entity: 'TENANT',
        entityId: tenant.id,
        details: {
          superAdminEmail: superAdminUser.email,
        },
      },
    });

    return {
      success: true,
      token,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        clinicNameKh: tenant.clinicNameKh,
        clinicNameEn: tenant.clinicNameEn,
        subdomain: `${tenant.slug}.${process.env.APP_DOMAIN || 'clinic.com'}`,
      },
      messageKh: `បានបង្កើត Audit Token សម្រាប់ចូលត្រួតពិនិត្យគ្លីនិក ${tenant.clinicNameKh} ដោយជោគជ័យ។`,
      messageEn: `Audit Token created for inspecting ${tenant.clinicNameEn} workspace.`,
    };
  }

  /**
   * Phase 1: Global User Governance - List all users across clinics with filtering & pagination
   */
  async getGlobalUsers(dto: GetUsersDto) {
    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(dto.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dto.role) {
      where.role = dto.role;
    }

    if (dto.tenantId) {
      where.tenantId = dto.tenantId;
    }

    if (dto.isActive !== undefined) {
      where.isActive = dto.isActive;
    }

    if (dto.query && dto.query.trim()) {
      const q = dto.query.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { fullNameEn: { contains: q, mode: 'insensitive' } },
        { fullNameKh: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullNameEn: true,
          fullNameKh: true,
          role: true,
          phone: true,
          department: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          tenantId: true,
          tenant: {
            select: {
              id: true,
              slug: true,
              clinicNameKh: true,
              clinicNameEn: true,
              planTier: true,
              isActive: true,
            },
          },
        },
      }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Phase 1: Global User Governance - Provision a new user directly
   */
  async createGlobalUser(dto: CreateGlobalUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new BadRequestException('A user with this email address already exists');
    }

    if (dto.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: dto.tenantId },
      });
      if (!tenant) {
        throw new NotFoundException('Specified clinic tenant not found');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        fullNameEn: dto.fullNameEn.trim(),
        fullNameKh: dto.fullNameKh?.trim() || null,
        role: dto.role,
        tenantId: dto.tenantId || null,
        phone: dto.phone?.trim() || null,
        department: dto.department?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        fullNameEn: true,
        fullNameKh: true,
        role: true,
        phone: true,
        department: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            clinicNameKh: true,
            clinicNameEn: true,
          },
        },
      },
    });

    this.logger.log(`[SuperAdmin] Created global user ${newUser.email} (${newUser.role})`);
    return newUser;
  }

  /**
   * Phase 1: Global User Governance - Update user role, clinic, or active status
   */
  async updateGlobalUser(userId: string, dto: UpdateGlobalUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.tenantId !== undefined && dto.tenantId !== null) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: dto.tenantId },
      });
      if (!tenant) {
        throw new NotFoundException('Specified clinic tenant not found');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullNameEn !== undefined && { fullNameEn: dto.fullNameEn.trim() }),
        ...(dto.fullNameKh !== undefined && { fullNameKh: dto.fullNameKh?.trim() || null }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.tenantId !== undefined && { tenantId: dto.tenantId }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
        ...(dto.department !== undefined && { department: dto.department?.trim() || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        email: true,
        fullNameEn: true,
        fullNameKh: true,
        role: true,
        phone: true,
        department: true,
        isActive: true,
        tenantId: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            clinicNameKh: true,
            clinicNameEn: true,
          },
        },
      },
    });

    this.logger.log(`[SuperAdmin] Updated global user ${updated.email}`);
    return updated;
  }

  /**
   * Phase 1: Global User Governance - Administrative password reset
   */
  async resetUserPassword(userId: string, dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.log(`[SuperAdmin] Reset password for user ${user.email}`);
    return {
      success: true,
      message: `Password successfully reset for ${user.email}`,
    };
  }
}
