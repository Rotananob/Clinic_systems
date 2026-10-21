import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaywayDirectService } from '../payments/payway-direct.service';
import { SetupMerchantDto } from './dto/setup-merchant.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
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
const { buildKhqr, buildBankDeeplinks, parseKhqr, computeMd5 } = khqrHelper;

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paywayDirectService: PaywayDirectService,
  ) {}

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

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && user?.role !== 'DOCTOR') {
      throw new ForbiddenException('Only clinic administrators can configure merchant credentials.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant workspace ${tenantId} not found.`);
    }

    const paywayPaymentUrl = dto.paywayPaymentUrl?.trim() || null;
    const bakongAccountId = dto.bakongAccountId?.trim() || null;
    const merchantName =
      dto.merchantName?.trim() ||
      tenant.merchantName ||
      tenant.clinicNameEn ||
      tenant.clinicNameKh ||
      'Clinic';
    const merchantCity = dto.merchantCity?.trim() || tenant.merchantCity || 'Phnom Penh';

    if (!paywayPaymentUrl && !bakongAccountId) {
      throw new BadRequestException('Merchant ABA PayWay Link or Bakong Account ID is required.');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        bakongAccountId: bakongAccountId || tenant.bakongAccountId,
        merchantName,
        merchantCity,
        paywayPaymentUrl: paywayPaymentUrl || tenant.paywayPaymentUrl,
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

  async updateTenantProfile(dto: UpdateTenantProfileDto, user: any) {
    const tenantId = user?.tenantId;
    if (!tenantId) {
      throw new NotFoundException('No clinic tenant association found.');
    }

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && user?.role !== 'DOCTOR') {
      throw new ForbiddenException('Only clinic administrators can update clinic profile settings.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant workspace ${tenantId} not found.`);
    }

    const dataToUpdate: any = {};
    if (dto.clinicNameEn !== undefined) dataToUpdate.clinicNameEn = dto.clinicNameEn.trim();
    if (dto.clinicNameKh !== undefined) dataToUpdate.clinicNameKh = dto.clinicNameKh.trim();
    if (dto.mohLicenseNumber !== undefined) dataToUpdate.mohLicenseNumber = dto.mohLicenseNumber.trim();
    if (dto.clinicType !== undefined) dataToUpdate.clinicType = dto.clinicType.trim();
    if (dto.phonePrimary !== undefined) dataToUpdate.phonePrimary = dto.phonePrimary.trim();
    if (dto.phoneEmergency !== undefined) dataToUpdate.phoneEmergency = dto.phoneEmergency.trim();
    if (dto.email !== undefined) dataToUpdate.email = dto.email.trim();
    if (dto.website !== undefined) dataToUpdate.website = dto.website.trim();
    if (dto.addressEn !== undefined) dataToUpdate.addressEn = dto.addressEn.trim();
    if (dto.addressKh !== undefined) dataToUpdate.addressKh = dto.addressKh.trim();
    if (dto.bakongAccountId !== undefined) dataToUpdate.bakongAccountId = dto.bakongAccountId.trim();
    if (dto.merchantName !== undefined) dataToUpdate.merchantName = dto.merchantName.trim();
    if (dto.merchantCity !== undefined) dataToUpdate.merchantCity = dto.merchantCity.trim();
    if (dto.paywayPaymentUrl !== undefined) dataToUpdate.paywayPaymentUrl = dto.paywayPaymentUrl.trim();

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: dataToUpdate,
    });

    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: user.id,
          action: 'TENANT_PROFILE_UPDATED',
          entity: 'TENANT',
          entityId: tenantId,
          details: { updatedFields: Object.keys(dataToUpdate) },
        },
      });
    } catch {}

    this.logger.log(`Tenant ${tenant.slug} profile and merchant configuration updated.`);

    return {
      success: true,
      message: 'Clinic workspace profile and merchant credentials updated successfully.',
      tenant: updated,
    };
  }

  async generateTestKhqr(dto: SetupMerchantDto) {
    const paywayUrl = dto.paywayPaymentUrl?.trim();
    const bakongId = dto.bakongAccountId?.trim();
    const merchantName = dto.merchantName?.trim() || 'Clinic';
    const merchantCity = dto.merchantCity?.trim() || 'Phnom Penh';
    const testBillNumber = `TEST-${Date.now().toString().slice(-4)}`;

    if (!bakongId && !paywayUrl) {
      throw new BadRequestException('Merchant ABA PayWay Link or Bakong Account ID is required for KHQR generation test.');
    }

    // 1. If ABA PayWay Link is provided, generate a REAL live Dynamic KHQR from ABA production gateway
    if (paywayUrl) {
      if (!paywayUrl.startsWith('http://') && !paywayUrl.startsWith('https://')) {
        throw new BadRequestException('Invalid ABA PayWay URL format. Must start with https://link.payway.com.kh/...');
      }

      try {
        const direct = await this.paywayDirectService.createInvoice({
          amount: 1.0,
          currency: 'USD',
          checkoutUrl: paywayUrl,
        });

        const parsed = parseKhqr ? parseKhqr(direct.qrString) : null;
        const deeplinks = buildBankDeeplinks ? buildBankDeeplinks(direct.qrString) : {};
        if (deeplinks?.aba) {
          deeplinks.aba.paywayLink = paywayUrl;
        }

        const realMerchantName = parsed?.merchantName || merchantName;
        const realMerchantCity = (parsed?.merchantCity && parsed.merchantCity !== 'N/A') ? parsed.merchantCity : merchantCity;

        return {
          success: true,
          testMode: true,
          liveGateway: true,
          qrString: direct.qrString,
          tranId: direct.tranId,
          clientId: direct.clientId,
          md5: computeMd5 ? computeMd5(direct.qrString) : '',
          bakongId: parsed?.bakongId || 'ABA PayWay Gateway',
          merchantName: realMerchantName,
          merchantCity: realMerchantCity,
          amount: 1.0,
          currency: 'USD',
          billNumber: direct.tranId || testBillNumber,
          deeplinks,
          paywayPaymentUrl: paywayUrl,
          message: 'Dynamic test KHQR generated directly from ABA PayWay gateway. 100% ready to scan with ABA Mobile or Bakong.',
        };
      } catch (err: any) {
        this.logger.error(`Failed to generate real KHQR from ABA link ${paywayUrl}: ${err.message}`);
        throw new BadRequestException(
          `Unable to generate KHQR from ABA PayWay link (${err.message}). Please verify the link copied from ABA Mobile -> Services -> ABA Merchant.`
        );
      }
    }

    // 2. If Bakong ID is provided (without PayWay link)
    if (bakongId) {
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

        return {
          success: true,
          testMode: true,
          liveGateway: false,
          qrString: generated.qrString,
          md5: generated.md5,
          bakongId,
          merchantName,
          merchantCity,
          amount: 1.0,
          currency: 'USD',
          billNumber: testBillNumber,
          deeplinks,
          paywayPaymentUrl: null,
          message: 'Dynamic test KHQR generated for Bakong ID. Ready to scan and verify.',
        };
      }
    }

    throw new BadRequestException('Unable to generate KHQR. Please provide a valid ABA PayWay link or Bakong ID.');
  }
}
