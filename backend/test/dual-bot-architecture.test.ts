import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Mirror of Platform Master Bot message generator for native strip-types unit testing
class PlatformMasterBotFormatter {
  formatNewClinicAlert(clinic: {
    slug: string;
    clinicNameKh: string;
    clinicNameEn: string;
    planTier: string;
    ownerPhone?: string;
    ownerEmail?: string;
  }): string {
    const lines = [
      `<b>[PLATFORM SYSTEM NOTICE: NEW CLINIC ONBOARDING]</b>`,
      `----------------------------------------`,
      `Tenant Slug: <code>${clinic.slug}</code>`,
      `Clinic Name (EN): <b>${clinic.clinicNameEn}</b>`,
      `Clinic Name (KH): <b>${clinic.clinicNameKh}</b>`,
      `Plan Tier: <code>${clinic.planTier}</code>`,
      `Contact Phone: ${clinic.ownerPhone || 'N/A'}`,
      `Admin Email: ${clinic.ownerEmail || 'N/A'}`,
      `----------------------------------------`,
      `Status: PENDING_INITIAL_CONFIGURATION`,
    ];
    return lines.join('\n');
  }

  formatSubscriptionPaymentAlert(sub: {
    clinicName: string;
    slug: string;
    planTier: string;
    amountUsd: number;
    invoiceNumber: string;
    paymentMethod: string;
    endDate: string;
  }): string {
    const lines = [
      `<b>[PLATFORM REVENUE: SUBSCRIPTION PAYMENT SETTLED]</b>`,
      `----------------------------------------`,
      `Clinic: <b>${sub.clinicName}</b> (<code>${sub.slug}</code>)`,
      `Subscribed Tier: <code>${sub.planTier}</code>`,
      `Amount Received: <b>$${sub.amountUsd.toFixed(2)} USD</b>`,
      `Settlement Channel: <code>${sub.paymentMethod}</code>`,
      `Invoice Ref: <code>${sub.invoiceNumber}</code>`,
      `Valid Until: <code>${sub.endDate}</code>`,
      `----------------------------------------`,
      `Account Status: ACTIVE`,
    ];
    return lines.join('\n');
  }

  formatSecurityAlert(event: {
    title: string;
    severity: string;
    message: string;
    ip?: string;
    path?: string;
  }): string {
    const lines = [
      `<b>[SECURITY HARDENING AUDIT: ${event.severity}]</b>`,
      `----------------------------------------`,
      `Incident: <b>${event.title}</b>`,
      `Message: ${event.message}`,
      `Origin IP: <code>${event.ip || 'INTERNAL'}</code>`,
      `Target Endpoint: <code>${event.path || 'SYSTEM'}</code>`,
      `----------------------------------------`,
      `Enforcement: REQUEST_TERMINATED_AND_LOGGED`,
    ];
    return lines.join('\n');
  }

  formatDailySummary(summary: {
    totalClinics: number;
    activeTenants: number;
    dailyRevenueUsd: number;
    totalKhqrToday: number;
  }): string {
    const lines = [
      `<b>[EXECUTIVE SUMMARY: DAILY SAAS PERFORMANCE]</b>`,
      `----------------------------------------`,
      `Active Clinics: <b>${summary.activeTenants}</b> / ${summary.totalClinics}`,
      `Today Revenue: <b>$${summary.dailyRevenueUsd.toFixed(2)} USD</b>`,
      `Total Dynamic KHQR Processed: <b>${summary.totalKhqrToday}</b>`,
      `----------------------------------------`,
    ];
    return lines.join('\n');
  }
}

describe('Dual-Bot Telegram Architecture & Master Platform Alert Test Suite', () => {
  const formatter = new PlatformMasterBotFormatter();

  test('should format new clinic registration alert with zero emojis and strict layout', () => {
    const message = formatter.formatNewClinicAlert({
      slug: 'angkor-clinic',
      clinicNameKh: 'គ្លីនិក អង្គរ',
      clinicNameEn: 'Angkor Medical Center',
      planTier: 'STARTER_5',
      ownerPhone: '012334455',
      ownerEmail: 'contact@angkor-clinic.com',
    });

    assert.ok(message.includes('[PLATFORM SYSTEM NOTICE: NEW CLINIC ONBOARDING]'));
    assert.ok(message.includes('angkor-clinic'));
    assert.ok(message.includes('STARTER_5'));
    assert.ok(message.includes('012334455'));

    // Check for zero emojis
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    assert.equal(emojiRegex.test(message), false);
  });

  test('should format subscription payment alert accurately with zero emojis', () => {
    const message = formatter.formatSubscriptionPaymentAlert({
      clinicName: 'Rotana Medical Center',
      slug: 'rotana',
      planTier: 'PRO_8',
      amountUsd: 8.0,
      invoiceNumber: 'INV-SUB-2026-001',
      paymentMethod: 'KHQR_DEEPLINK',
      endDate: '2026-11-20',
    });

    assert.ok(message.includes('[PLATFORM REVENUE: SUBSCRIPTION PAYMENT SETTLED]'));
    assert.ok(message.includes('$8.00 USD'));
    assert.ok(message.includes('INV-SUB-2026-001'));
    assert.ok(message.includes('KHQR_DEEPLINK'));

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    assert.equal(emojiRegex.test(message), false);
  });

  test('should format security hardening alert with high severity flag', () => {
    const message = formatter.formatSecurityAlert({
      title: 'CROSS_TENANT_ACCESS_ATTEMPT',
      severity: 'CRITICAL',
      message: 'Unauthorized attempt to query patient records of another clinic tenant',
      ip: '103.20.15.4',
      path: '/api/patients/31201',
    });

    assert.ok(message.includes('[SECURITY HARDENING AUDIT: CRITICAL]'));
    assert.ok(message.includes('CROSS_TENANT_ACCESS_ATTEMPT'));
    assert.ok(message.includes('103.20.15.4'));

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    assert.equal(emojiRegex.test(message), false);
  });

  test('should format daily executive summary with financial and transaction metrics', () => {
    const message = formatter.formatDailySummary({
      totalClinics: 25,
      activeTenants: 24,
      dailyRevenueUsd: 184.0,
      totalKhqrToday: 1420,
    });

    assert.ok(message.includes('[EXECUTIVE SUMMARY: DAILY SAAS PERFORMANCE]'));
    assert.ok(message.includes('<b>24</b> / 25'));
    assert.ok(message.includes('$184.00 USD'));
    assert.ok(message.includes('1420'));

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    assert.equal(emojiRegex.test(message), false);
  });
});
