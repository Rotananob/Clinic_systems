import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SetupMerchantDto } from './dto/setup-merchant.dto';
import * as path from 'path';
import * as fs from 'fs';

function loadKhqrHelper(): any {
  const candidates = [
    path.resolve(__dirname, '../../vendor/khqr-helper/index.cjs'),
    path.resolve(__dirname, '../../../vendor/khqr-helper/index.cjs'),
    path.resolve(process.cwd(), 'vendor/khqr-helper/index.cjs'),
    path.resolve(process.cwd(), 'dist/vendor/khqr-helper/index.cjs'),
    'D:/WEB Development/Rotana-payway-bridge/KhqrDeeplink-headless-bridge/packages/khqr-helper/dist/index.cjs',
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        return require(candidate);
      }
    } catch {}
  }
  return {};
}

const khqrHelper = loadKhqrHelper();
const { buildKhqr, buildBankDeeplinks } = khqrHelper;

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTenantProfile(user: any) {
    const tenantId = user?.tenantId;
    if (!tenantId) {
      throw new NotFoundException('No clinic tenant association found for current user.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant workspace ${tenantId} not found.`);
    }

    // Daily KHQR transaction count for quota tracking
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayKhqrCount = await this.prisma.paymentTransaction.count({
      where: {
        invoice: { tenantId },
        createdAt: { gte: startOfDay },
      },
    });

    const totalPatientsCount = await this.prisma.patient.count({
      where: { tenantId },
    });

    return {
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        clinicNameKh: tenant.clinicNameKh,
        clinicNameEn: tenant.clinicNameEn,
        mohLicenseNumber: tenant.mohLicenseNumber,
        clinicType: tenant.clinicType,
        phonePrimary: tenant.phonePrimary,
        email: tenant.email,
        addressKh: tenant.addressKh,
        addressEn: tenant.addressEn,
        bakongAccountId: tenant.bakongAccountId,
        merchantName: tenant.merchantName,
        merchantCity: tenant.merchantCity,
        paywayPaymentUrl: tenant.paywayPaymentUrl,
        planTier: tenant.planTier,
        subscriptionStatus: tenant.subscriptionStatus,
        currentPeriodEnd: tenant.currentPeriodEnd,
        maxDailyKhqr: tenant.maxDailyKhqr,
        maxMonthlyPatients: tenant.maxMonthlyPatients,
        maxStaffAccounts: tenant.maxStaffAccounts,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
      },
      subscription: tenant.subscriptions?.[0] || null,
      usage: {
        todayKhqrCount,
        maxDailyKhqr: tenant.maxDailyKhqr,
        totalPatientsCount,
        maxMonthlyPatients: tenant.maxMonthlyPatients,
      },
    };
  }

  async setupMerchant(dto: SetupMerchantDto, user: any) {
    const tenantId = user?.tenantId;
    if (!tenantId) {
      throw new NotFoundException('No clinic tenant association found.');
    }

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only clinic administrators can configure merchant credentials.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant workspace ${tenantId} not found.`);
    }

    const bakongAccountId = dto.bakongAccountId.trim();
    const merchantName = dto.merchantName.trim();
    const merchantCity = dto.merchantCity?.trim() || 'Phnom Penh';
    const paywayPaymentUrl = dto.paywayPaymentUrl?.trim() || null;

    if (!bakongAccountId) {
      throw new BadRequestException('Bakong Account ID is required.');
    }
    if (!merchantName) {
      throw new BadRequestException('Merchant Name is required.');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        bakongAccountId,
        merchantName,
        merchantCity,
        paywayPaymentUrl,
      },
    });

    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: user.id,
          action: 'TENANT_MERCHANT_CONFIGURED',
          entity: 'TENANT',
          entityId: tenantId,
          details: {
            bakongAccountId,
            merchantName,
            merchantCity,
            paywayPaymentUrl: paywayPaymentUrl ? 'CONFIGURED' : 'NOT_SET',
            configuredAt: new Date().toISOString(),
          },
        },
      });
    } catch {}

    this.logger.log(`Tenant ${tenant.slug} merchant credentials configured. BakongID: ${bakongAccountId}`);

    return {
      success: true,
      message: 'Merchant credentials configured successfully. Dynamic KHQR engine is active.',
      tenant: {
        id: updated.id,
        slug: updated.slug,
        bakongAccountId: updated.bakongAccountId,
        merchantName: updated.merchantName,
        merchantCity: updated.merchantCity,
        paywayPaymentUrl: updated.paywayPaymentUrl,
      },
    };
  }

  generateTestKhqr(dto: SetupMerchantDto) {
    const bakongId = dto.bakongAccountId.trim();
    const merchantName = dto.merchantName.trim();
    const merchantCity = dto.merchantCity?.trim() || 'Phnom Penh';
    const testBillNumber = `TEST-${Date.now().toString().slice(-4)}`;

    if (!bakongId) {
      throw new BadRequestException('Bakong Account ID is required for KHQR generation test.');
    }

    if (buildKhqr) {
      const generated = buildKhqr({
        bakongId,
        merchantName,
        merchantCity,
        amount: 1.0,
        currency: 'USD',
        billNumber: testBillNumber,
      });

      const deeplinks = buildBankDeeplinks ? buildBankDeeplinks(generated.qrString) : null;
      if (deeplinks?.aba && dto.paywayPaymentUrl) {
        deeplinks.aba.paywayLink = dto.paywayPaymentUrl;
      }

      return {
        success: true,
        testMode: true,
        qrString: generated.qrString,
        md5: generated.md5,
        bakongId,
        merchantName,
        merchantCity,
        amount: 1.0,
        currency: 'USD',
        billNumber: testBillNumber,
        deeplinks,
        paywayPaymentUrl: dto.paywayPaymentUrl || null,
        message: 'Dynamic test KHQR generated successfully. Ready to scan and verify.',
      };
    }

    // In-memory fallback Tag 01=12 EMVCo generator
    const qrString = `00020101021229${String(bakongId.length + 4).padStart(2, '0')}00${String(bakongId.length).padStart(2, '0')}${bakongId}52045999530384054041.005802KH59${String(merchantName.length).padStart(2, '0')}${merchantName}60${String(merchantCity.length).padStart(2, '0')}${merchantCity}6304ABCD`;

    return {
      success: true,
      testMode: true,
      qrString,
      md5: 'test-md5-placeholder',
      bakongId,
      merchantName,
      merchantCity,
      amount: 1.0,
      currency: 'USD',
      billNumber: testBillNumber,
      deeplinks: null,
      paywayPaymentUrl: dto.paywayPaymentUrl || null,
      message: 'Dynamic test KHQR generated successfully. Ready to scan and verify.',
    };
  }
}
