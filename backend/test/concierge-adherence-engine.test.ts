import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConciergeService, RED_FLAG_CLINICAL_KEYWORDS } from '../src/concierge/concierge.service.ts';

describe('Phase 10: Clinical Care Concierge & Adherence Engine', () => {
  const conciergeService = new ConciergeService();
  const tenantId = 'test-clinic-tenant';

  it('should initialize with pre-seeded active and escalated care threads', () => {
    const threads = conciergeService.getThreads(tenantId);
    assert.ok(threads.length >= 2, 'Should have at least 2 default care threads');

    const activeThread = threads.find((t) => t.status === 'ACTIVE');
    assert.ok(activeThread, 'Should have active thread');
    assert.equal(activeThread?.patientName, 'KEO Sokha');

    const redFlagThread = threads.find((t) => t.status === 'ESCALATED_RED_FLAG');
    assert.ok(redFlagThread, 'Should have escalated red flag thread');
    assert.equal(redFlagThread?.patientName, 'CHHAY Bopha');
  });

  it('should trigger automated post-consultation care protocol with localized messages', () => {
    const newThread = conciergeService.triggerProtocol(
      'PT-9001',
      'VON Samnang',
      '+85512334455',
      'vis-9001',
      'Dr. CHAN Vanna',
      'Acute bronchitis',
      'POST_CONSULTATION_DAY1',
      'TELEGRAM',
      tenantId,
    );

    assert.ok(newThread.id.startsWith('thread-'));
    assert.equal(newThread.activeProtocol, 'POST_CONSULTATION_DAY1');
    assert.equal(newThread.channel, 'TELEGRAM');
    assert.equal(newThread.adherenceScore, 100);
    assert.ok(newThread.messages[0].content.includes('ជម្រាបសួរ VON Samnang'));
  });

  it('should process regular patient response without triggering red-flag alarm', () => {
    const res = conciergeService.processInboundMessage(
      'thread-001',
      'KEO Sokha',
      'ស្ថានភាពសុខភាពខ្ញុំបានធូរច្រើនហើយ មិនមានបញ្ហាអ្វីទេ។',
    );

    assert.equal(res.isRedFlag, false);
    assert.equal(res.detectedSymptoms.length, 0);
    assert.equal(res.thread.status, 'ACTIVE');
  });

  it('should detect Khmer red-flag keywords and immediately escalate thread to red flag', () => {
    // "ពិបាកដកដង្ហើម" (shortness of breath / dyspnea)
    const res = conciergeService.processInboundMessage(
      'thread-001',
      'KEO Sokha',
      'លោកគ្រូពេទ្យ ខ្ញុំមានអារម្មណ៍ថា ពិបាកដកដង្ហើម ខ្លាំងណាស់។',
    );

    assert.equal(res.isRedFlag, true);
    assert.ok(res.detectedSymptoms.some((s) => s.includes('Dyspnea')));
    assert.equal(res.thread.status, 'ESCALATED_RED_FLAG');
    assert.ok(res.alert, 'Must generate RedFlagAlert');
    assert.equal(res.alert?.severity, 'CRITICAL');
  });

  it('should detect English clinical red-flags and generate high-priority alert', () => {
    const thread = conciergeService.triggerProtocol(
      'PT-9002',
      'John Doe',
      '+85599887766',
      'vis-9002',
      'Dr. TEP Somally',
      'Post cardiac evaluation',
      'CHRONIC_HYPERTENSION_WEEKLY',
      'WHATSAPP',
      tenantId,
    );

    const res = conciergeService.processInboundMessage(
      thread.id,
      'John Doe',
      'Doctor, I have developed severe chest pain radiating to my left arm.',
    );

    assert.equal(res.isRedFlag, true);
    assert.ok(res.detectedSymptoms.some((s) => s.includes('Coronary')));
    assert.equal(res.alert?.severity, 'CRITICAL');
  });

  it('should append doctor replies to care communication thread', () => {
    const updated = conciergeService.sendDoctorReply(
      'thread-001',
      'Dr. CHAN Vanna',
      'សូមលោកពូអញ្ជើញមកកាន់បន្ទប់សង្គ្រោះបន្ទាន់នៃគ្លីនិកជាបន្ទាន់។ ក្រុមគ្រូពេទ្យត្រៀមរង់ចាំពិនិត្យ។',
    );

    const lastMsg = updated.messages[updated.messages.length - 1];
    assert.equal(lastMsg.sender, 'DOCTOR');
    assert.equal(lastMsg.senderName, 'Dr. CHAN Vanna');
  });

  it('should record dose adherence confirmation and recalculate percentage accurately', () => {
    // thread-001 currently has 4 doses total, 4 confirmed (100%)
    // Let's record a missed dose (confirmed: false) -> 4 / 5 = 80%
    const updated = conciergeService.recordDoseConfirmation('thread-001', false);
    assert.equal(updated.adherenceDosesTotal, 5);
    assert.equal(updated.adherenceDosesConfirmed, 4);
    assert.equal(updated.adherenceScore, 80);

    // Record next dose confirmed -> 5 / 6 = 83%
    const updated2 = conciergeService.recordDoseConfirmation('thread-001', true);
    assert.equal(updated2.adherenceDosesTotal, 6);
    assert.equal(updated2.adherenceDosesConfirmed, 5);
    assert.equal(updated2.adherenceScore, 83);
  });

  it('should acknowledge and clear red-flag alert by attending doctor', () => {
    const pendingAlerts = conciergeService.getPendingRedFlags(tenantId);
    assert.ok(pendingAlerts.length >= 1, 'Should have pending red-flag alerts');

    const targetAlert = pendingAlerts[0];
    const ack = conciergeService.acknowledgeRedFlag(targetAlert.id, 'Dr. CHAN Vanna');

    assert.equal(ack.acknowledged, true);
    assert.equal(ack.acknowledgedBy, 'Dr. CHAN Vanna');
    assert.ok(ack.acknowledgedAt);
  });

  it('should guarantee zero emojis across all concierge protocols, messages, and triggers', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const kw of RED_FLAG_CLINICAL_KEYWORDS) {
      assert.ok(!emojiRegex.test(kw.keyword), `Keyword has emoji: ${kw.keyword}`);
      assert.ok(!emojiRegex.test(kw.symptom), `Symptom has emoji: ${kw.symptom}`);
    }

    const threads = conciergeService.getThreads(tenantId);
    for (const thread of threads) {
      assert.ok(!emojiRegex.test(thread.patientName), `Patient has emoji: ${thread.patientName}`);
      assert.ok(!emojiRegex.test(thread.diagnosis), `Diagnosis has emoji: ${thread.diagnosis}`);
      for (const msg of thread.messages) {
        assert.ok(!emojiRegex.test(msg.content), `Message has emoji: ${msg.content}`);
      }
    }
  });
});
