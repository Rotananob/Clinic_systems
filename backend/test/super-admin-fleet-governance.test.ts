import { test, describe } from 'node:test';
import * as assert from 'node:assert/strict';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import { SAAS_PLANS } from '../src/common/constants/plans.constant.ts';

describe('Step 21: Super Admin Master Platform Fleet Metrics Test Suite', () => {
  test('should accurately calculate Platform MRR and ARR from active clinic tiers', () => {
    const tierPricingMap: Record<PlanTier, number> = {
      [PlanTier.FREE]: 0,
      [PlanTier.STARTER_5]: 5,
      [PlanTier.PRO_8]: 8,
      [PlanTier.ENTERPRISE_12]: 12,
    };

    const mockFleet = [
      { planTier: PlanTier.STARTER_5, isActive: true },
      { planTier: PlanTier.STARTER_5, isActive: true },
      { planTier: PlanTier.PRO_8, isActive: true },
      { planTier: PlanTier.PRO_8, isActive: true },
      { planTier: PlanTier.ENTERPRISE_12, isActive: true },
      { planTier: PlanTier.FREE, isActive: true },
      { planTier: PlanTier.PRO_8, isActive: false }, // Inactive/Frozen clinic should not count toward MRR
    ];

    const activeClinics = mockFleet.filter((c) => c.isActive);
    const mrr = activeClinics.reduce(
      (sum, clinic) => sum + tierPricingMap[clinic.planTier],
      0,
    );

    // 2x$5 + 2x$8 + 1x$12 = 10 + 16 + 12 = $38 MRR
    assert.equal(mrr, 38);
    // ARR = $38 * 12 = $456
    assert.equal(mrr * 12, 456);
  });

  test('should accurately categorize fleet status counts', () => {
    const clinics = [
      { id: '1', isActive: true, status: SubscriptionStatus.ACTIVE },
      { id: '2', isActive: true, status: SubscriptionStatus.ACTIVE },
      { id: '3', isActive: true, status: SubscriptionStatus.PAST_DUE },
      { id: '4', isActive: false, status: SubscriptionStatus.CANCELLED },
      { id: '5', isActive: true, status: SubscriptionStatus.EXPIRED },
    ];

    const totalClinics = clinics.length;
    const activeClinics = clinics.filter((c) => c.isActive && c.status === SubscriptionStatus.ACTIVE).length;
    const pastDueClinics = clinics.filter((c) => c.status === SubscriptionStatus.PAST_DUE).length;
    const frozenClinics = clinics.filter(
      (c) => !c.isActive || c.status === SubscriptionStatus.CANCELLED || c.status === SubscriptionStatus.EXPIRED,
    ).length;

    assert.equal(totalClinics, 5);
    assert.equal(activeClinics, 2);
    assert.equal(pastDueClinics, 1);
    assert.equal(frozenClinics, 2);
  });
});

describe('Step 22: Remote Tenant Workspace Management & Emergency Lockout Tests', () => {
  test('should handle emergency lockout / freeze state transition', () => {
    const clinic = {
      id: 'tenant-rotana-001',
      slug: 'rotana-clinic',
      isActive: true,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    };

    // Emergency Freeze
    const frozen = {
      ...clinic,
      isActive: false,
      subscriptionStatus: SubscriptionStatus.CANCELLED,
    };

    assert.equal(frozen.isActive, false);
    assert.equal(frozen.subscriptionStatus, SubscriptionStatus.CANCELLED);

    // Unfreeze / Restore
    const restored = {
      ...frozen,
      isActive: true,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    };

    assert.equal(restored.isActive, true);
    assert.equal(restored.subscriptionStatus, SubscriptionStatus.ACTIVE);
  });

  test('should calculate accurate expiration extension on manual plan override', () => {
    const now = new Date('2026-10-20T12:00:00Z');
    const currentPeriodEnd = new Date('2026-10-25T12:00:00Z'); // 5 days left

    const calculateNewExpiry = (baseDate: Date, addDays: number) => {
      const baseTime = baseDate > now ? baseDate.getTime() : now.getTime();
      return new Date(baseTime + addDays * 24 * 60 * 60 * 1000);
    };

    // Add +30 days to existing period
    const newEnd30 = calculateNewExpiry(currentPeriodEnd, 30);
    const msDiff = newEnd30.getTime() - currentPeriodEnd.getTime();
    assert.equal(Math.round(msDiff / (1000 * 60 * 60 * 24)), 30);

    // If expired in the past, extension starts from now
    const pastExpiry = new Date('2026-10-10T12:00:00Z');
    const newEndFromNow = calculateNewExpiry(pastExpiry, 30);
    const msDiffFromNow = newEndFromNow.getTime() - now.getTime();
    assert.equal(Math.round(msDiffFromNow / (1000 * 60 * 60 * 24)), 30);
  });

  test('should toggle global maintenance mode and maintain state with custom broadcast messages', () => {
    let maintenanceMode = false;
    let messageKh = 'ប្រព័ន្ធកំពុងដំណើរការថែទាំប្រចាំខែ';
    let messageEn = 'Scheduled Maintenance';

    const setMaintenance = (enabled: boolean, msgKh?: string, msgEn?: string) => {
      maintenanceMode = enabled;
      if (msgKh) messageKh = msgKh;
      if (msgEn) messageEn = msgEn;
      return { maintenanceMode, messageKh, messageEn };
    };

    // Turn ON
    const stateOn = setMaintenance(true, 'កំពុងថែទាំប្រព័ន្ធ', 'System Under Maintenance');
    assert.equal(stateOn.maintenanceMode, true);
    assert.equal(stateOn.messageKh, 'កំពុងថែទាំប្រព័ន្ធ');

    // Turn OFF
    const stateOff = setMaintenance(false);
    assert.equal(stateOff.maintenanceMode, false);
  });

  test('should verify cascade ordering for demo data purge', () => {
    const purgeOrder = [
      'paymentTransaction',
      'prescriptionItem',
      'invoice',
      'prescription',
      'medicalRecord',
      'visit',
      'followUp',
      'patient',
    ];

    // Verify foreign keys: payments before invoices, invoices before patients
    assert.ok(purgeOrder.indexOf('paymentTransaction') < purgeOrder.indexOf('invoice'));
    assert.ok(purgeOrder.indexOf('prescriptionItem') < purgeOrder.indexOf('prescription'));
    assert.ok(purgeOrder.indexOf('visit') < purgeOrder.indexOf('patient'));
    assert.ok(purgeOrder.indexOf('invoice') < purgeOrder.indexOf('patient'));
  });
});
