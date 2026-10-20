import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignageService, STATION_NAMES } from '../src/signage/signage.service.ts';

describe('Phase 11: Smart Clinic Queueing & Digital Signage Engine', () => {
  const signageService = new SignageService();
  const tenantId = 'test-clinic-tenant';

  it('should initialize with pre-seeded multi-station queue tickets', () => {
    const board = signageService.getLiveQueueBoard(tenantId);
    assert.ok(board.callingTickets.length >= 2, 'Should have calling tickets');
    assert.ok(board.waitingTickets.length >= 2, 'Should have waiting tickets');
    assert.ok(board.announcements.length >= 1, 'Should have broadcast announcements');
  });

  it('should order waiting tickets prioritizing urgent and elderly before normal FIFO', () => {
    const board = signageService.getLiveQueueBoard(tenantId);
    const waiting = board.waitingTickets;

    // First in waiting should be elderly (HENG Piseth)
    assert.equal(waiting[0].priority, 'ELDERLY_PREGNANT');
    assert.equal(waiting[0].patientName, 'HENG Piseth');
  });

  it('should call ticket and format deterministic bilingual speech text in Khmer and English', () => {
    const called = signageService.callTicket('tkt-002', 'ROOM_2', 'Dr. RITH Sreynoch');

    assert.equal(called.status, 'CALLING');
    assert.equal(called.station, 'ROOM_2');
    assert.equal(called.stationDisplayNameKh, 'បន្ទប់ពិគ្រោះលេខ ២');
    assert.equal(called.stationDisplayNameEn, 'Consultation Room 2');
    assert.equal(called.speechTextKh, 'សូមអញ្ជើញ អ្នកជំងឺលេខ A-102 ចូលទៅកាន់ បន្ទប់ពិគ្រោះលេខ ២');
    assert.equal(called.speechTextEn, 'Calling ticket A-102 to Consultation Room 2');
    assert.ok(called.calledAt);
  });

  it('should complete ticket and archive from active calling queue', () => {
    const completed = signageService.completeTicket('tkt-001');
    assert.equal(completed.status, 'COMPLETED');

    const board = signageService.getLiveQueueBoard(tenantId);
    assert.ok(!board.callingTickets.some((t) => t.id === 'tkt-001'));
    assert.ok(board.recentCompleted.some((t) => t.id === 'tkt-001'));
  });

  it('should issue new self-service kiosk tickets with department prefixes', () => {
    const labTicket = signageService.issueKioskTicket('SOK Mean', 'LABORATORY', 'NORMAL', tenantId);
    assert.ok(labTicket.ticketNumber.startsWith('L-'));
    assert.equal(labTicket.department, 'LABORATORY');
    assert.equal(labTicket.status, 'WAITING');

    const pharmaTicket = signageService.issueKioskTicket('OUK Bopha', 'PHARMACY', 'NORMAL', tenantId);
    assert.ok(pharmaTicket.ticketNumber.startsWith('P-'));
    assert.equal(pharmaTicket.department, 'PHARMACY');

    const usTicket = signageService.issueKioskTicket('LONG Chan', 'IMAGING', 'NORMAL', tenantId);
    assert.ok(usTicket.ticketNumber.startsWith('U-'));
    assert.equal(usTicket.department, 'IMAGING');
  });

  it('should guarantee zero emojis across entire signage service, station names, and announcements', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [st, names] of Object.entries(STATION_NAMES)) {
      assert.ok(!emojiRegex.test(names.kh), `Station KH has emoji: ${names.kh}`);
      assert.ok(!emojiRegex.test(names.en), `Station EN has emoji: ${names.en}`);
    }

    const board = signageService.getLiveQueueBoard(tenantId);
    for (const t of [...board.callingTickets, ...board.waitingTickets]) {
      assert.ok(!emojiRegex.test(t.patientName), `Patient name has emoji: ${t.patientName}`);
      assert.ok(!emojiRegex.test(t.speechTextKh), `Speech KH has emoji: ${t.speechTextKh}`);
      assert.ok(!emojiRegex.test(t.speechTextEn), `Speech EN has emoji: ${t.speechTextEn}`);
    }

    for (const ann of board.announcements) {
      assert.ok(!emojiRegex.test(ann.titleKh), `Ann title KH has emoji: ${ann.titleKh}`);
      assert.ok(!emojiRegex.test(ann.contentKh), `Ann content KH has emoji: ${ann.contentKh}`);
    }
  });
});
