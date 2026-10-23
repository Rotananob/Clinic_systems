import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import { PlanTier, SubscriptionStatus, Role } from '@prisma/client';
import { SAAS_PLANS, isRouteAllowedForPlan } from '../common/constants/plans.constant';
import { PlatformMasterBotService } from '../telegram/platform-master-bot.service';
import {
  ROLE_PERMISSIONS_MATRIX,
  ROLE_ALLOWED_ROUTES,
  SYSTEM_PERMISSIONS,
} from '../common/constants/permissions.constant';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Optional() private platformMasterBotService?: PlatformMasterBotService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const normalizedEmail = (email || '').trim().toLowerCase();
    let tenantInfo: any = null;

    // Recognized Test / Evaluation Accounts
    const isTestAccount =
      normalizedEmail === 'test.admin@hounvannak.com' ||
      normalizedEmail === 'test.superadmin@hounvannak.com' ||
      normalizedEmail === 'demo.superadmin@hounvannak.com' ||
      normalizedEmail === 'demo@clinic.com';

    // 1. Strict Expiration Enforcement: Account expires 31/12/2026
    if (isTestAccount) {
      const now = new Date();
      const expirationDate = new Date('2026-12-31T23:59:59.999Z');
      if (now > expirationDate) {
        throw new UnauthorizedException(
          'គណនីនេះបានផុតកំណត់សុពលភាពត្រឹមថ្ងៃទី 31/12/2026 (This account expired on 31/12/2026).'
        );
      }
    }

    // 2. Fetch User from Database safely
    let user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    // 3. Isolated Test Account Handler (ដាច់ដោយឡែកពី Acc Zin របស់ Admin / Owner)
    if (isTestAccount) {
      const validPasswords = [
        'TestAdmin#2026!Clinic',
        'Demo#SuperAdmin2026!MasterKey',
        process.env.SEED_DEMO_PASSWORD || '',
      ].filter(Boolean);

      let isMatch = false;
      if (user) {
        isMatch = (await bcrypt.compare(password, user.passwordHash)) || validPasswords.includes(password);
      } else {
        isMatch = validPasswords.includes(password);
      }

      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // If user row does not exist in DB yet, create its own distinct row with unique ID
      if (!user) {
        const hash = await bcrypt.hash('TestAdmin#2026!Clinic', 12);
        try {
          user = await this.prisma.user.create({
            data: {
              email: normalizedEmail,
              passwordHash: hash,
              fullNameEn: 'Clinical System Evaluation Admin',
              fullNameKh: 'គណនីវាយតម្លៃប្រព័ន្ធ (Test Account)',
              role: 'SUPER_ADMIN',
              phone: '0120002026',
              department: 'Clinical Evaluation Board',
              bio: 'Dedicated evaluation account expiring on 31/12/2026. Fully isolated from owner acc zin.',
              isActive: true,
            },
          });
        } catch {
          user = await this.prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
          });
        }
      } else {
        // If user already exists, ensure clean dedicated profile (not displaying owner name)
        if (user.fullNameEn?.includes('Rotana Nob') || user.fullNameEn === 'Test Administrator') {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              fullNameEn: 'Clinical System Evaluation Admin',
              fullNameKh: 'គណនីវាយតម្លៃប្រព័ន្ធ (Test Account)',
              department: 'Clinical Evaluation Board',
              bio: 'Dedicated evaluation account expiring on 31/12/2026. Fully isolated from owner acc zin.',
            },
          });
        }
      }

      if (!user) {
        throw new UnauthorizedException('Failed to initialize isolated evaluation account');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: 'SUPER_ADMIN',
        isTestAccount: true,
        tenantId: user.tenantId || null,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          fullNameEn: user.fullNameEn,
          fullNameKh: user.fullNameKh,
          role: 'SUPER_ADMIN',
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          department: user.department,
          telegramUsername: user.telegramUsername,
          bio: user.bio,
        tenant: tenantInfo,
          notificationsEnabled: user.notificationsEnabled,
          isTestAccount: true,
          expiresAt: '2026-12-31T23:59:59.999Z',
          tenantId: user.tenantId || null,
        },
      };
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account is disabled');
    }

    if (user.tenantId) {
      tenantInfo = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: {
          id: true,
          slug: true,
          clinicNameKh: true,
          clinicNameEn: true,
          clinicType: true,
          planTier: true,
          bakongAccountId: true,
          merchantName: true,
          merchantCity: true,
          paywayPaymentUrl: true,
          isActive: true,
        },
      });
      if (tenantInfo && !tenantInfo.isActive) {
        throw new UnauthorizedException(
          'គណនីគ្លីនិកនេះត្រូវបានផ្អាកដំណើរការជាបណ្ដោះអាសន្ន។ សូមទាក់ទង Super Admin (Clinic workspace is currently suspended).',
        );
      }
      if (tenantInfo) {
        (tenantInfo as any).isOnboarded = Boolean(
          tenantInfo.clinicNameKh &&
          tenantInfo.clinicNameEn &&
          tenantInfo.clinicNameEn !== 'New Clinic' &&
          (tenantInfo.paywayPaymentUrl || tenantInfo.bakongAccountId)
        );
      }
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId || null,
    };

    const clinicTypeStr = (tenantInfo?.clinicType || '').toLowerCase();
    let targetRoute = '/queue';
    if (user.role === Role.SUPER_ADMIN) {
      targetRoute = '/super-admin';
    } else if (user.role === Role.CASHIER) {
      targetRoute = '/billing';
    } else if (user.role === Role.PHARMACIST) {
      targetRoute = '/prescriptions';
    } else if (clinicTypeStr.includes('dental') || clinicTypeStr.includes('ធ្មេញ') || clinicTypeStr.includes('ទន្តសាស្ត្រ')) {
      targetRoute = '/dental';
    } else if (clinicTypeStr.includes('pharmacy') || clinicTypeStr.includes('ឱសថ') || clinicTypeStr.includes('drug')) {
      targetRoute = '/prescriptions';
    } else if (user.role === Role.DOCTOR) {
      targetRoute = '/visits';
    }

    let allowedRoutes = ROLE_ALLOWED_ROUTES[user.role] || ['/profile'];
    if (user.role !== Role.SUPER_ADMIN && tenantInfo?.planTier) {
      allowedRoutes = allowedRoutes.filter((route) =>
        isRouteAllowedForPlan(tenantInfo.planTier, route, tenantInfo.clinicType),
      );
    }

    return {
      accessToken: this.jwtService.sign(payload),
      targetRoute,
      permissions: ROLE_PERMISSIONS_MATRIX[user.role] || [],
      allowedRoutes,
      user: {
        id: user.id,
        email: user.email,
        fullNameEn: user.fullNameEn,
        fullNameKh: user.fullNameKh,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        department: user.department,
        telegramUsername: user.telegramUsername,
        bio: user.bio,
        tenant: tenantInfo,
        notificationsEnabled: user.notificationsEnabled,
        tenantId: user.tenantId || null,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match.');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }

  async validateUserExistsForPasswordReset(email: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('សូមបញ្ចូលអាសយដ្ឋាន Email របស់អ្នក។');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (!user) {
      throw new BadRequestException('មិនមានគណនីដែលបានចុះឈ្មោះជាមួយអាសយដ្ឋាន Email នេះក្នុងប្រព័ន្ធទេ។');
    }

    return user;
  }

  async resetPasswordWithVerifiedCode(email: string, newPassword: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួអក្សរ។');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (!user) {
      throw new BadRequestException('មិនមានគណនីដែលបានចុះឈ្មោះជាមួយអាសយដ្ឋាន Email នេះក្នុងប្រព័ន្ធទេ។');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return {
      success: true,
      message: 'ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្តូរដោយជោគជ័យ។ សូមចូលប្រើប្រាស់។',
    };
  }

  async checkEmailAvailability(email: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('សូមបញ្ចូលអាសយដ្ឋាន Gmail របស់អ្នក។');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (existingUser) {
      throw new BadRequestException(
        'អាសយដ្ឋាន Gmail នេះត្រូវបានចុះឈ្មោះរួចរាល់ហើយក្នុងប្រព័ន្ធ។ សូមចូលប្រើប្រាស់ - Login ឬប្រើប្រាស់ Gmail ផ្សេងទៀត។'
      );
    }
  }

  async registerClinic(dto: RegisterClinicDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    // 1. Check if email already registered
    await this.checkEmailAvailability(normalizedEmail);

    // 2. Resolve clinic names with optional defaults
    const clinicNameEn = (dto.clinicNameEn || '').trim() || (dto.adminName?.trim() ? `${dto.adminName.trim()} Clinic` : 'New Clinic');
    const clinicNameKh = (dto.clinicNameKh || '').trim();
    const phone = (dto.phone || '').trim();
    const clinicType = dto.clinicType?.trim() || 'General Medical Clinic';

    // 3. Generate unique subdomain slug from English clinic name
    let baseSlug = clinicNameEn
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!baseSlug) baseSlug = 'clinic';

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await this.prisma.tenant.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
      counter++;
      if (counter > 15) {
        uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
        break;
      }
    }

    // 4. Resolve plan tier configuration and quotas
    const selectedTier = dto.planTier || PlanTier.FREE;
    const planConfig = SAAS_PLANS[selectedTier] || SAAS_PLANS[PlanTier.FREE];
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 5. Atomically provision Isolated Tenant Workspace, Subscription, and Admin User within 2 seconds
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          slug: uniqueSlug,
          clinicNameKh,
          clinicNameEn,
          clinicType,
          phonePrimary: phone,
          email: normalizedEmail,
          planTier: selectedTier,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: periodEnd,
          maxDailyKhqr: planConfig.maxDailyKhqr === -1 ? 999999 : planConfig.maxDailyKhqr,
          maxMonthlyPatients: planConfig.maxMonthlyPatients === -1 ? 999999 : planConfig.maxMonthlyPatients,
          maxStaffAccounts: planConfig.maxStaffAccounts === -1 ? 999999 : planConfig.maxStaffAccounts,
          isActive: true,
        },
      });

      const subscription = await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planTier: selectedTier,
          amountUsd: planConfig.priceUsd,
          status: SubscriptionStatus.ACTIVE,
          startDate: now,
          endDate: periodEnd,
          invoiceNumber: `SUB-${tenant.slug.toUpperCase()}-${Date.now().toString().slice(-4)}`,
          paymentMethod: 'INITIAL_ONBOARDING_PROVISION',
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: normalizedEmail,
          passwordHash,
          fullNameEn: dto.adminName?.trim() || `${clinicNameEn} Admin`,
          fullNameKh: clinicNameKh || dto.adminName?.trim() || 'គ្លីនិកថ្មី',
          role: Role.ADMIN,
          phone: phone,
          department: 'Management',
          isActive: true,
        },
      });

      // Audit log entry for workspace creation
      try {
        await tx.auditLog.create({
          data: {
            tenantId: tenant.id,
            userId: user.id,
            action: 'TENANT_REGISTERED',
            entity: 'TENANT',
            entityId: tenant.id,
            details: {
              slug: tenant.slug,
              planTier: tenant.planTier,
              registeredAt: now.toISOString(),
            },
          },
        });
      } catch {}

      return { tenant, user, subscription };
    });

    // 5. Notify Platform Super Admin via Master Bot (non-blocking)
    if (this.platformMasterBotService) {
      this.platformMasterBotService
        .notifyNewClinicRegistration({
          slug: result.tenant.slug,
          clinicNameKh: result.tenant.clinicNameKh,
          clinicNameEn: result.tenant.clinicNameEn,
          planTier: result.tenant.planTier,
          ownerEmail: result.user.email,
          ownerPhone: result.user.phone || undefined,
        })
        .catch(() => {});
    }

    // 6. Generate immediate JWT auth token
    const tokenPayload = {
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
      tenantId: result.tenant.id,
    };

    const clinicTypeStr = (result.tenant.clinicType || '').toLowerCase();
    let targetRoute = '/queue';
    if (clinicTypeStr.includes('dental') || clinicTypeStr.includes('ធ្មេញ') || clinicTypeStr.includes('ទន្តសាស្ត្រ')) {
      targetRoute = '/dental';
    } else if (clinicTypeStr.includes('pharmacy') || clinicTypeStr.includes('ឱសថ') || clinicTypeStr.includes('drug')) {
      targetRoute = '/prescriptions';
    }

    return {
      success: true,
      accessToken: this.jwtService.sign(tokenPayload),
      targetRoute,
      permissions: ROLE_PERMISSIONS_MATRIX[result.user.role] || [],
      allowedRoutes: ROLE_ALLOWED_ROUTES[result.user.role] || ['/profile'],
      user: {
        id: result.user.id,
        email: result.user.email,
        fullNameEn: result.user.fullNameEn,
        fullNameKh: result.user.fullNameKh,
        role: result.user.role,
        tenantId: result.tenant.id,
      },
      tenant: {
        id: result.tenant.id,
        slug: result.tenant.slug,
        clinicNameKh: result.tenant.clinicNameKh,
        clinicNameEn: result.tenant.clinicNameEn,
        clinicType: result.tenant.clinicType,
        planTier: result.tenant.planTier,
        maxDailyKhqr: result.tenant.maxDailyKhqr,
        maxMonthlyPatients: result.tenant.maxMonthlyPatients,
        isOnboarded: Boolean(result.tenant.clinicNameKh && result.tenant.paywayPaymentUrl),
      },
      message: 'Clinic workspace provisioned successfully.',
    };
  }

  async getCurrentUserWithPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullNameEn: true,
        fullNameKh: true,
        role: true,
        phone: true,
        avatarUrl: true,
        department: true,
        telegramUsername: true,
        bio: true,
        notificationsEnabled: true,
        tenantId: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            slug: true,
            clinicNameKh: true,
            clinicNameEn: true,
            clinicType: true,
            planTier: true,
            bakongAccountId: true,
            merchantName: true,
            merchantCity: true,
            paywayPaymentUrl: true,
            maxDailyKhqr: true,
            maxMonthlyPatients: true,
            isActive: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    if (user.tenant) {
      (user.tenant as any).isOnboarded = Boolean(
        user.tenant.clinicNameKh &&
        user.tenant.clinicNameEn &&
        user.tenant.clinicNameEn !== 'New Clinic' &&
        (user.tenant.paywayPaymentUrl || user.tenant.bakongAccountId)
      );
    }

    const permissions = ROLE_PERMISSIONS_MATRIX[user.role] || [];
    let allowedRoutes = ROLE_ALLOWED_ROUTES[user.role] || ['/profile'];

    // Enforce progressive SaaS plan tier feature restrictions
    if (user.role !== Role.SUPER_ADMIN && user.tenant?.planTier) {
      allowedRoutes = allowedRoutes.filter((route) =>
        isRouteAllowedForPlan(user.tenant.planTier, route, user.tenant.clinicType),
      );
    }

    // Resolve primary target destination based on clinic specialization
    const clinicTypeStr = (user.tenant?.clinicType || '').toLowerCase();
    let targetRoute = '/queue';
    if (user.role === Role.SUPER_ADMIN) {
      targetRoute = '/super-admin';
    } else if (user.role === Role.CASHIER) {
      targetRoute = '/billing';
    } else if (user.role === Role.PHARMACIST) {
      targetRoute = '/prescriptions';
    } else if (clinicTypeStr.includes('dental') || clinicTypeStr.includes('ធ្មេញ') || clinicTypeStr.includes('ទន្តសាស្ត្រ')) {
      targetRoute = '/dental';
    } else if (clinicTypeStr.includes('pharmacy') || clinicTypeStr.includes('ឱសថ') || clinicTypeStr.includes('drug')) {
      targetRoute = '/prescriptions';
    }

    return {
      ...user,
      permissions,
      allowedRoutes,
      targetRoute,
      isVerifiedRealRole: true,
    };
  }

  getSystemPermissionsMatrix() {
    return {
      systemPermissions: SYSTEM_PERMISSIONS,
      rolePermissions: ROLE_PERMISSIONS_MATRIX,
      roleAllowedRoutes: ROLE_ALLOWED_ROUTES,
    };
  }
}
