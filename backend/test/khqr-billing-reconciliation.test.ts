// Phase 10: Bakong KHQR Settlement Webhooks & Real-Time Billing State Reconciliation Test Suite
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { firstValueFrom, take, filter, timeout } from 'rxjs';
import { MobileSyncService } from '../src/mobile-sync/mobile-sync.service.ts';
import type {
  KhqrSettlementWebhookDto,
  PullDeltaRequestDto,
} from '../src/mobile-sync/mobile-sync.types.ts';

describe('Phase 10: Bakong KHQR Settlement & Real-Time Billing Reconciliation Test Suite', () => {
  let service: MobileSyncService;

  beforeEach(() => {
    service = new MobileSyncService();
  });

  describe('1. Webhook Ingestion & Invoice State Reconciliation', () => {
    it('should reconcile and transition pending invoice to PAID upon valid KHQR settlement webhook', async () => {
      // Baseline invoice INV-2026-001 is seeded with PENDING status
      const initialInvoice = service.getInvoice('INV-UUID-001');
      assert.ok(initialInvoice);
      assert.equal(initialInvoice.status, 'PENDING');
      assert.equal(initialInvoice.invoiceNumber, 'INV-2026-001');

      const webhookDto: KhqrSettlementWebhookDto = {
        tranId: 'TRX-BAKONG-20261104-001',
        hash: 'MD5-HASH-BAKONG-001',
        amount: 15.5,
        currency: 'USD',
        invoiceId: 'INV-UUID-001',
        invoiceNumber: 'INV-2026-001',
        status: 'SUCCESS',
        settledAt: '2026-11-04T01:10:00.000Z',
        bakongAccountId: 'rotana_clinic@aba',
        payerAccount: 'sreymom_chhay@acleda',
        tenantId: 'TENANT-ROTANA-01',
        deviceId: 'DEV-POS-CASHIER-01',
        cashierId: 'STAFF-CASHIER-01',
      };

      const res = await service.settleKhqrTransaction(webhookDto);

      assert.equal(res.success, true);
      assert.equal(res.idempotent, false);
      assert.equal(res.tranId, 'TRX-BAKONG-20261104-001');
      assert.equal(res.invoiceId, 'INV-UUID-001');
      assert.equal(res.invoiceNumber, 'INV-2026-001');
      assert.equal(res.invoiceStatus, 'PAID');
      assert.equal(res.payableAmount, 15.5);
      assert.equal(res.currency, 'USD');
      assert.ok(res.serverMonotonicSequence > 1000);
      assert.ok(res.serverVectorClock.SERVER >= 1);

      // Verify updated in-memory store
      const updatedInvoice = service.getInvoice('INV-UUID-001');
      assert.ok(updatedInvoice);
      assert.equal(updatedInvoice.status, 'PAID');
      assert.equal(updatedInvoice.paidAt, '2026-11-04T01:10:00.000Z');
      assert.equal(updatedInvoice.tranId, 'TRX-BAKONG-20261104-001');
      assert.equal(updatedInvoice.cashierId, 'STAFF-CASHIER-01');
      assert.ok(updatedInvoice.monotonicVersion! > 1000);
      assert.ok(updatedInvoice.vectorClock!.SERVER >= 2);
    });

    it('should handle Khmer Riel (KHR) currency settlement with integer amount', async () => {
      // Baseline invoice INV-2026-002 is seeded with UNPAID status for 60,000 KHR
      const initialInvoice = service.getInvoice('INV-UUID-002');
      assert.ok(initialInvoice);
      assert.equal(initialInvoice.status, 'UNPAID');
      assert.equal(initialInvoice.currency, 'KHR');
      assert.equal(initialInvoice.payableAmount, 60000);

      const webhookDto: KhqrSettlementWebhookDto = {
        tranId: 'TRX-BAKONG-KHR-002',
        hash: 'MD5-KHR-002',
        amount: 60000,
        currency: 'KHR',
        invoiceId: 'INV-UUID-002',
        invoiceNumber: 'INV-2026-002',
        status: 'SETTLED',
        settledAt: '2026-11-04T01:15:00.000Z',
        bakongAccountId: 'rotana_clinic@aba',
        payerAccount: 'channary_lim@wing',
      };

      const res = await service.settleKhqrTransaction(webhookDto);

      assert.equal(res.success, true);
      assert.equal(res.invoiceStatus, 'PAID');
      assert.equal(res.currency, 'KHR');
      assert.equal(res.payableAmount, 60000);

      const updated = service.getInvoice('INV-UUID-002');
      assert.ok(updated);
      assert.equal(updated.status, 'PAID');
      assert.equal(updated.currency, 'KHR');
    });

    it('should auto-create settled invoice for walk-in or external POS transactions', async () => {
      const webhookDto: KhqrSettlementWebhookDto = {
        tranId: 'TRX-WALKIN-EXTERNAL-009',
        hash: 'MD5-WALKIN-009',
        amount: 32.0,
        currency: 'USD',
        invoiceId: 'INV-EXTERNAL-009',
        invoiceNumber: 'INV-EXT-009',
        status: 'SUCCESS',
        metadata: {
          patientNameEn: 'Vanna Meas',
          patientNameKh: 'វណ្ណា មាស',
        },
      };

      const res = await service.settleKhqrTransaction(webhookDto);

      assert.equal(res.success, true);
      assert.equal(res.invoiceStatus, 'PAID');

      const created = service.getInvoice('INV-EXTERNAL-009');
      assert.ok(created);
      assert.equal(created.invoiceNumber, 'INV-EXT-009');
      assert.equal(created.patientNameEn, 'Vanna Meas');
      assert.equal(created.status, 'PAID');
    });
  });

  describe('2. Webhook Idempotency & Duplicate Settlement Prevention', () => {
    it('should return idempotent success without duplicate processing when identical tranId is received', async () => {
      const webhookDto: KhqrSettlementWebhookDto = {
        tranId: 'TRX-IDEMPOTENT-001',
        hash: 'MD5-IDEMPOTENT-001',
        amount: 25.0,
        currency: 'USD',
        invoiceId: 'INV-UUID-001',
        invoiceNumber: 'INV-2026-001',
        status: 'SUCCESS',
      };

      // First call: newly settled
      const firstRes = await service.settleKhqrTransaction(webhookDto);
      assert.equal(firstRes.success, true);
      assert.equal(firstRes.idempotent, false);
      const firstMonotonic = firstRes.serverMonotonicSequence;
      const initialQueueSize = service.getPendingPushNotifications().length;

      // Second call: duplicate webhook with same tranId
      const secondRes = await service.settleKhqrTransaction(webhookDto);
      assert.equal(secondRes.success, true);
      assert.equal(secondRes.idempotent, true);
      assert.equal(secondRes.tranId, 'TRX-IDEMPOTENT-001');
      assert.equal(secondRes.serverMonotonicSequence, firstMonotonic);

      // Third call: duplicate using hash match
      const thirdRes = await service.settleKhqrTransaction({
        ...webhookDto,
        tranId: 'TRX-IDEMPOTENT-001-ALT',
        hash: 'MD5-IDEMPOTENT-001',
      });
      assert.equal(thirdRes.success, true);
      assert.equal(thirdRes.idempotent, true);

      // Verify no duplicate push notifications were enqueued
      const finalQueueSize = service.getPendingPushNotifications().length;
      assert.equal(finalQueueSize, initialQueueSize);
    });
  });

  describe('3. Webhook Payload Validation & Error Handling', () => {
    it('should reject webhook when tranId is missing or empty', async () => {
      await assert.rejects(
        async () => {
          await service.settleKhqrTransaction({
            tranId: '',
            hash: 'MD5-TEST',
            amount: 10.0,
            currency: 'USD',
            invoiceId: 'INV-TEST',
            status: 'SUCCESS',
          });
        },
        { name: 'BadRequestException' }
      );
    });

    it('should reject webhook when invoice identifier is completely missing', async () => {
      await assert.rejects(
        async () => {
          await service.settleKhqrTransaction({
            tranId: 'TRX-TEST',
            hash: 'MD5-TEST',
            amount: 10.0,
            currency: 'USD',
            invoiceId: '',
            invoiceNumber: '',
            status: 'SUCCESS',
          });
        },
        { name: 'BadRequestException' }
      );
    });

    it('should reject webhook when amount is zero or negative', async () => {
      await assert.rejects(
        async () => {
          await service.settleKhqrTransaction({
            tranId: 'TRX-TEST',
            hash: 'MD5-TEST',
            amount: 0,
            currency: 'USD',
            invoiceId: 'INV-TEST',
            status: 'SUCCESS',
          });
        },
        { name: 'BadRequestException' }
      );

      await assert.rejects(
        async () => {
          await service.settleKhqrTransaction({
            tranId: 'TRX-TEST',
            hash: 'MD5-TEST',
            amount: -15.5,
            currency: 'USD',
            invoiceId: 'INV-TEST',
            status: 'SUCCESS',
          });
        },
        { name: 'BadRequestException' }
      );
    });

    it('should reject webhook when currency is neither USD nor KHR', async () => {
      await assert.rejects(
        async () => {
          await service.settleKhqrTransaction({
            tranId: 'TRX-TEST',
            hash: 'MD5-TEST',
            amount: 10.0,
            currency: 'EUR' as any,
            invoiceId: 'INV-TEST',
            status: 'SUCCESS',
          });
        },
        { name: 'BadRequestException' }
      );
    });
  });

  describe('4. Real-Time Telemetry SSE Stream Reconciliation Event', () => {
    it('should stream KHQR_PAYMENT_SETTLED event to subscribed mobile billing clients', async () => {
      // Connect to telemetry stream for BILLING department
      const stream$ = service.getTelemetryStream({
        department: 'BILLING',
        deviceId: 'DEV-POS-TABLET-02',
      });

      // Prepare promise for the settled event
      const eventPromise = firstValueFrom(
        stream$.pipe(
          filter((msg) => {
            const data = JSON.parse(msg.data);
            return data.eventType === 'KHQR_PAYMENT_SETTLED';
          }),
          timeout(2000)
        )
      );

      // Trigger KHQR settlement
      await service.settleKhqrTransaction({
        tranId: 'TRX-SSE-BROADCAST-01',
        hash: 'MD5-SSE-01',
        amount: 22.5,
        currency: 'USD',
        invoiceId: 'INV-UUID-001',
        invoiceNumber: 'INV-2026-001',
        status: 'SUCCESS',
        bakongAccountId: 'rotana_clinic@aba',
        payerAccount: 'vip_patient@wing',
      });

      const msgEvent = await eventPromise;
      assert.ok(msgEvent);
      assert.equal(msgEvent.type, 'KHQR_PAYMENT_SETTLED');

      const parsed = JSON.parse(msgEvent.data);
      assert.equal(parsed.eventType, 'KHQR_PAYMENT_SETTLED');
      assert.equal(parsed.department, 'BILLING');
      assert.equal(parsed.data.tranId, 'TRX-SSE-BROADCAST-01');
      assert.equal(parsed.data.invoiceId, 'INV-UUID-001');
      assert.equal(parsed.data.invoiceNumber, 'INV-2026-001');
      assert.equal(parsed.data.amount, 22.5);
      assert.equal(parsed.data.currency, 'USD');
      assert.equal(parsed.data.isSettled, true);
      assert.ok(parsed.data.notificationMessageKh.includes('ការទូទាត់ប្រាក់បានជោគជ័យ'));
      assert.ok(parsed.data.notificationMessageEn.includes('KHQR Payment Settled'));
    });
  });

  describe('5. Mobile Device Push Notification Dispatch & Acknowledgement', () => {
    it('should enqueue push notification with bilingual alert text and allow client acknowledgement', async () => {
      const webhookDto: KhqrSettlementWebhookDto = {
        tranId: 'TRX-PUSH-QUEUE-01',
        hash: 'MD5-PUSH-01',
        amount: 40.0,
        currency: 'USD',
        invoiceId: 'INV-UUID-001',
        invoiceNumber: 'INV-2026-001',
        status: 'SUCCESS',
        deviceId: 'DEV-TABLET-CASHIER-99',
      };

      const res = await service.settleKhqrTransaction(webhookDto);
      assert.ok(res.pushNotification);

      const notif = res.pushNotification;
      assert.equal(notif.notificationId, 'PUSH-KHQR-TRX-PUSH-QUEUE-01');
      assert.equal(notif.targetDeviceId, 'DEV-TABLET-CASHIER-99');
      assert.equal(notif.category, 'BILLING');
      assert.equal(notif.priority, 'HIGH');
      assert.equal(notif.status, 'QUEUED');
      assert.equal(notif.title, 'KHQR Payment Received');
      assert.equal(notif.titleKh, 'ទទួលបានការទូទាត់ប្រាក់ KHQR');
      assert.ok(notif.body.includes('Invoice INV-2026-001 settled'));
      assert.ok(notif.bodyKh.includes('វិក្កយបត្រ INV-2026-001 បានទូទាត់រួចរាល់'));

      // Device retrieves pending notifications
      const pending = service.getPendingPushNotifications('DEV-TABLET-CASHIER-99');
      assert.ok(pending.length >= 1);
      const target = pending.find((p) => p.notificationId === 'PUSH-KHQR-TRX-PUSH-QUEUE-01');
      assert.ok(target);
      assert.equal(target.status, 'QUEUED');

      // Device acknowledges receipt
      const ackSuccess = service.acknowledgePushNotification('PUSH-KHQR-TRX-PUSH-QUEUE-01');
      assert.equal(ackSuccess, true);
      assert.equal(target.status, 'DELIVERED');
    });
  });

  describe('6. Delta Sync Integration with Invoices', () => {
    it('should include updated invoices in delta sync response when includeInvoices flag is active', async () => {
      // Settle invoice to update timestamp and monotonic counter
      await service.settleKhqrTransaction({
        tranId: 'TRX-DELTA-SYNC-01',
        hash: 'MD5-DELTA-01',
        amount: 15.5,
        currency: 'USD',
        invoiceId: 'INV-UUID-001',
        invoiceNumber: 'INV-2026-001',
        status: 'SUCCESS',
      });

      const delta = await service.pullDelta({
        sinceTimestamp: 0,
        includeInvoices: true,
      });

      assert.ok(delta.invoices);
      assert.ok(delta.invoices.length >= 3);
      assert.equal(delta.counts.invoices, delta.invoices.length);

      const settledInv = delta.invoices.find((i) => i.id === 'INV-UUID-001');
      assert.ok(settledInv);
      assert.equal(settledInv.status, 'PAID');
      assert.equal(settledInv.tranId, 'TRX-DELTA-SYNC-01');
      assert.ok(settledInv.monotonicVersion! > 1000);
    });
  });

  describe('7. Strict Healthcare Platform Compliance', () => {
    it('should strictly guarantee zero emojis and zero parentheses in Khmer text across all billing reconciliation payloads', async () => {
      const res = await service.settleKhqrTransaction({
        tranId: 'TRX-COMPLIANCE-01',
        hash: 'MD5-COMPLIANCE-01',
        amount: 50.0,
        currency: 'USD',
        invoiceId: 'INV-UUID-001',
        invoiceNumber: 'INV-2026-001',
        status: 'SUCCESS',
      });

      const emojiRegex =
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      const khmerWithParensRegex = /[\u1780-\u17FF][^()]*[()]/;

      // 1. Check SSE Broadcast Event
      const broadcastJson = JSON.stringify(res.broadcastEvent);
      assert.equal(emojiRegex.test(broadcastJson), false, 'Broadcast event must not contain emojis');
      assert.equal(khmerWithParensRegex.test(broadcastJson), false, 'Khmer text must not have parentheses');

      // 2. Check Push Notification
      const pushJson = JSON.stringify(res.pushNotification);
      assert.equal(emojiRegex.test(pushJson), false, 'Push notification must not contain emojis');
      assert.equal(khmerWithParensRegex.test(pushJson), false, 'Khmer text must not have parentheses');

      // 3. Check All Seeded Invoices
      const allInvoices = service.getInvoices();
      for (const inv of allInvoices) {
        const invJson = JSON.stringify(inv);
        assert.equal(emojiRegex.test(invJson), false, `Invoice ${inv.invoiceNumber} has no emojis`);
        assert.equal(khmerWithParensRegex.test(invJson), false, `Invoice ${inv.invoiceNumber} has no Khmer parentheses`);
      }
    });
  });
});
