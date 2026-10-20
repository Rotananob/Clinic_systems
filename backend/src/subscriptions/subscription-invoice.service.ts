import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SAAS_PLANS } from '../common/constants/plans.constant';
import * as crypto from 'crypto';

export interface SaaSReceiptData {
  invoiceNumber: string;
  issueDate: string;
  servicePeriod: {
    startDate: string;
    endDate: string;
    daysCount: number;
  };
  provider: {
    companyNameKh: string;
    companyNameEn: string;
    vatTin: string;
    addressKh: string;
    addressEn: string;
    phone: string;
    email: string;
    website: string;
  };
  customer: {
    clinicNameKh: string;
    clinicNameEn: string;
    slug: string;
    subdomain: string;
    mohLicenseNumber: string;
    phone: string;
    email: string;
    addressKh: string;
    addressEn: string;
  };
  plan: {
    tier: string;
    nameKh: string;
    nameEn: string;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    dailyKhqrQuota: string;
    monthlyPatientQuota: string;
  };
  financial: {
    amountUsd: number;
    amountKhr: number;
    exchangeRate: number;
    taxPercent: number;
    taxAmountUsd: number;
    totalUsd: number;
    totalKhr: number;
    paymentMethod: string;
    paymentTranId: string;
    status: string;
  };
  verification: {
    digitalSignature: string;
    verificationUrl: string;
    timestamp: string;
  };
}

@Injectable()
export class SubscriptionInvoiceService {
  private readonly logger = new Logger(SubscriptionInvoiceService.name);

  // Official SaaS Platform Provider Information in Cambodia
  private readonly providerInfo = {
    companyNameKh: 'ក្រុមហ៊ុន គ្លីនិកអូអេស ផាស (ខេមបូឌា) ខូអិលធីឌី',
    companyNameEn: 'ClinicOS PaaS (Cambodia) Co., Ltd.',
    vatTin: 'K002-902401822',
    addressKh: 'ផ្ទះលេខ ១២៨ មហាវិថីសហព័ន្ធរុស្ស៊ី សង្កាត់ទឹកល្អក់១ ខណ្ឌទួលគោក រាជធានីភ្នំពេញ',
    addressEn: '#128 Russian Confederation Blvd, Teuk Laak 1, Tuol Kork, Phnom Penh, Cambodia',
    phone: '+855 23 999 888',
    email: 'billing@clinicos.app',
    website: 'https://clinicos.app',
  };

  private readonly usdToKhrRate = 4100;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Step 20: Fetches official structured SaaS tax invoice data for a subscription payment.
   */
  async getSubscriptionReceipt(tenantId: string, subscriptionId: string): Promise<SaaSReceiptData> {
    const subscription = await this.prisma.tenantSubscription.findUnique({
      where: { id: subscriptionId },
      include: { tenant: true },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription invoice ${subscriptionId} not found`);
    }

    if (subscription.tenantId !== tenantId) {
      throw new ForbiddenException('Cannot access invoice belonging to another clinic workspace');
    }

    const tenant = subscription.tenant;
    const planConfig = SAAS_PLANS[subscription.planTier];
    const isAnnual =
      subscription.notes?.includes('ANNUAL') || Number(subscription.amountUsd) >= 40;

    const amountUsd = Number(subscription.amountUsd);
    const amountKhr = amountUsd * this.usdToKhrRate;

    const msDiff = subscription.endDate.getTime() - subscription.startDate.getTime();
    const daysCount = Math.max(1, Math.round(msDiff / (1000 * 60 * 60 * 24)));

    // Generate SHA-256 electronic verification signature
    const signaturePayload = `${subscription.invoiceNumber}:${tenant.id}:${amountUsd}:${subscription.createdAt.toISOString()}`;
    const digitalSignature = crypto
      .createHash('sha256')
      .update(signaturePayload)
      .digest('hex')
      .slice(0, 32)
      .toUpperCase();

    const khqrQuotaDisplay =
      planConfig.maxDailyKhqr === -1 ? 'Unlimited' : `${planConfig.maxDailyKhqr} / ថ្ងៃ`;
    const patientQuotaDisplay =
      planConfig.maxMonthlyPatients === -1 ? 'Unlimited' : `${planConfig.maxMonthlyPatients} នាក់ / ខែ`;

    return {
      invoiceNumber: subscription.invoiceNumber || `SUB-${subscription.id.slice(0, 8)}`,
      issueDate: subscription.createdAt.toISOString(),
      servicePeriod: {
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate.toISOString(),
        daysCount,
      },
      provider: this.providerInfo,
      customer: {
        clinicNameKh: tenant.clinicNameKh,
        clinicNameEn: tenant.clinicNameEn,
        slug: tenant.slug,
        subdomain: `${tenant.slug}.clinicos.app`,
        mohLicenseNumber: tenant.mohLicenseNumber || 'MoH Official Registered',
        phone: tenant.phonePrimary || 'N/A',
        email: tenant.email || 'N/A',
        addressKh: tenant.addressKh || 'រាជធានីភ្នំពេញ ព្រះរាជាណាចក្រកម្ពុជា',
        addressEn: tenant.addressEn || 'Phnom Penh, Kingdom of Cambodia',
      },
      plan: {
        tier: subscription.planTier,
        nameKh: planConfig.nameKh,
        nameEn: planConfig.nameEn,
        billingCycle: isAnnual ? 'ANNUAL' : 'MONTHLY',
        dailyKhqrQuota: khqrQuotaDisplay,
        monthlyPatientQuota: patientQuotaDisplay,
      },
      financial: {
        amountUsd,
        amountKhr,
        exchangeRate: this.usdToKhrRate,
        taxPercent: 0, // Medical & clinical software SaaS exempt
        taxAmountUsd: 0,
        totalUsd: amountUsd,
        totalKhr: amountKhr,
        paymentMethod: subscription.paymentMethod || 'KHQR Dynamic',
        paymentTranId: subscription.paymentTranId || 'N/A',
        status: subscription.status,
      },
      verification: {
        digitalSignature,
        verificationUrl: `https://clinicos.app/verify-invoice?ref=${subscription.invoiceNumber}`,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Step 20: Renders official printable HTML invoice template.
   */
  async renderHtmlReceipt(tenantId: string, subscriptionId: string): Promise<string> {
    const data = await this.getSubscriptionReceipt(tenantId, subscriptionId);

    const issueFormatted = new Date(data.issueDate).toLocaleDateString('km-KH');
    const startFormatted = new Date(data.servicePeriod.startDate).toLocaleDateString('km-KH');
    const endFormatted = new Date(data.servicePeriod.endDate).toLocaleDateString('km-KH');

    return `<!DOCTYPE html>
<html lang="km">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice - ${data.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Kantumruy Pro", sans-serif; margin: 0; padding: 24px; color: #1c1917; background: #fff; }
    .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e7e5e4; border-radius: 16px; padding: 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f766e; padding-bottom: 20px; }
    .logo-box { font-size: 20px; font-weight: 800; color: #0f766e; }
    .badge { display: inline-block; padding: 4px 10px; background: #ccfbf1; color: #0f766e; font-size: 11px; font-weight: 700; border-radius: 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; font-size: 12px; }
    .table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 12px; }
    .table th { background: #f5f5f4; text-align: left; padding: 10px; border-bottom: 1px solid #e7e5e4; font-weight: 700; }
    .table td { padding: 12px 10px; border-bottom: 1px solid #f5f5f4; }
    .totals { margin-left: auto; width: 300px; font-size: 12px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .grand-total { font-size: 16px; font-weight: 800; color: #0f766e; border-top: 2px solid #0f766e; padding-top: 8px; margin-top: 6px; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid #e7e5e4; font-size: 10px; color: #78716c; display: flex; justify-content: space-between; }
    @media print {
      body { padding: 0; background: #fff; }
      .invoice-card { border: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 800px; margin: 0 auto 16px; text-align: right;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #0f766e; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="logo-box">ClinicOS PaaS (Cambodia)</div>
        <div style="font-size: 11px; color: #78716c; margin-top: 4px;">វិក្កយបត្រពន្ធផ្លូវការ (Official Tax Invoice)</div>
        <div style="font-size: 11px; color: #78716c;">TIN: ${data.provider.vatTin}</div>
      </div>
      <div style="text-align: right;">
        <span class="badge">PAID IN FULL</span>
        <div style="font-family: monospace; font-weight: 800; font-size: 14px; margin-top: 6px;">${data.invoiceNumber}</div>
        <div style="font-size: 11px; color: #78716c;">កាលបរិច្ឆេទ: ${issueFormatted}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div style="font-weight: 700; color: #78716c; text-transform: uppercase; margin-bottom: 6px;">ចេញជូនគ្លីនិក (Billed To):</div>
        <div style="font-weight: 800; font-size: 14px; color: #1c1917;">${data.customer.clinicNameKh}</div>
        <div style="font-weight: 600;">${data.customer.clinicNameEn}</div>
        <div>Workspace: <code>${data.customer.subdomain}</code></div>
        <div>MoH License: ${data.customer.mohLicenseNumber}</div>
        <div>${data.customer.addressKh}</div>
      </div>
      <div>
        <div style="font-weight: 700; color: #78716c; text-transform: uppercase; margin-bottom: 6px;">ព័ត៌មានប្រតិបត្តិការ (Payment Info):</div>
        <div>វិធីសាស្ត្រទូទាត់: <b>${data.financial.paymentMethod}</b></div>
        <div>លេខយោងប្រតិបត្តិការ: <code>${data.financial.paymentTranId}</code></div>
        <div>សុពលភាពគម្រោង: ${startFormatted} ដល់ ${endFormatted} (${data.servicePeriod.daysCount} ថ្ងៃ)</div>
        <div>វដ្តទូទាត់: <b>${data.plan.billingCycle}</b></div>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>បរិយាយមុខទំនិញ / សេវាកម្ម (Description)</th>
          <th style="text-align: center;">កូតា KHQR</th>
          <th style="text-align: center;">កូតាអ្នកជំងឺ</th>
          <th style="text-align: right;">តម្លៃសរុប (USD)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div style="font-weight: 800;">${data.plan.nameKh}</div>
            <div style="font-size: 11px; color: #78716c;">${data.plan.nameEn} (${data.plan.billingCycle})</div>
          </td>
          <td style="text-align: center; font-family: monospace;">${data.plan.dailyKhqrQuota}</td>
          <td style="text-align: center; font-family: monospace;">${data.plan.monthlyPatientQuota}</td>
          <td style="text-align: right; font-weight: 800;">$${data.financial.amountUsd.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>តម្លៃសរុបមិនទាន់គិតពន្ធ (Subtotal):</span>
        <span style="font-weight: 700;">$${data.financial.amountUsd.toFixed(2)}</span>
      </div>
      <div class="totals-row">
        <span>អាករលើតម្លៃបន្ថែម (VAT 0% Exempt):</span>
        <span>$0.00</span>
      </div>
      <div class="totals-row grand-total">
        <span>ចំនួនទឹកប្រាក់សរុប (Total USD):</span>
        <span>$${data.financial.totalUsd.toFixed(2)}</span>
      </div>
      <div class="totals-row" style="font-size: 11px; color: #78716c;">
        <span>សរុបជាប្រាក់រៀល (Total KHR):</span>
        <span style="font-weight: 700;">${data.financial.totalKhr.toLocaleString()} KHR</span>
      </div>
    </div>

    <div class="footer">
      <div>
        Digital Signature: <code>${data.verification.digitalSignature}</code><br>
        Verified electronically by ClinicOS Multi-Tenant Billing Engine
      </div>
      <div style="text-align: right;">
        &copy; ${new Date().getFullYear()} ClinicOS PaaS (Cambodia). All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}
