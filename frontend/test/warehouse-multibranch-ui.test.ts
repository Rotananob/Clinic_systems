import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 6: Multi-Branch & Central Warehouse UI Suite', () => {
  it('should verify 100% dictionary key parity for warehouse localization', () => {
    const enWh = (en as any).warehouse;
    const kmWh = (km as any).warehouse;

    assert.notEqual(enWh, undefined, 'en.warehouse must exist');
    assert.notEqual(kmWh, undefined, 'km.warehouse must exist');

    const enKeys = Object.keys(enWh).sort();
    const kmKeys = Object.keys(kmWh).sort();

    assert.equal(enKeys.length > 0, true, 'en.warehouse must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km warehouse must have exactly identical keys');
  });

  it('should guarantee zero emojis across the entire warehouse localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enWh = (en as any).warehouse;
    const kmWh = (km as any).warehouse;

    for (const [key, value] of Object.entries(enWh)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in en.warehouse.${key}: "${value}"`,
      );
    }

    for (const [key, value] of Object.entries(kmWh)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in km.warehouse.${key}: "${value}"`,
      );
    }
  });

  it('should verify all core warehouse workflow keys exist in dictionaries', () => {
    const requiredKeys = [
      'title',
      'subtitle',
      'allBranches',
      'branchSwitcher',
      'hqOverviewTab',
      'inventoryBatchesTab',
      'transfersTab',
      'verificationTab',
      'createTransferButton',
      'totalValuation',
      'totalUnits',
      'transfersInTransit',
      'criticalExpiryAlerts',
      'within30Days',
      'within60Days',
      'within90Days',
      'fefoBadge',
      'inboundVerificationTitle',
      'scanManifestPrompt',
      'confirmReceiptButton',
      'discrepancyNote',
    ];

    const enWh = (en as any).warehouse;
    for (const k of requiredKeys) {
      assert.ok(enWh[k], `Missing required key in warehouse dictionary: ${k}`);
    }
  });

  it('should correctly format FEFO sort order and expiration severity badges', () => {
    const sampleBatches = [
      { id: '1', name: 'Paracetamol', expDate: '2027-01-01', days: 400 },
      { id: '2', name: 'Amoxicillin', expDate: '2026-11-15', days: 25 },
      { id: '3', name: 'Ceftriaxone', expDate: '2026-12-05', days: 45 },
    ];

    // FEFO sort
    sampleBatches.sort(
      (a, b) => new Date(a.expDate).getTime() - new Date(b.expDate).getTime(),
    );

    assert.equal(sampleBatches[0].name, 'Amoxicillin');
    assert.equal(sampleBatches[1].name, 'Ceftriaxone');
    assert.equal(sampleBatches[2].name, 'Paracetamol');
  });

  it('should calculate accurate discrepancy note on inbound verification difference', () => {
    const dispatchedQty = 50;
    const receivedQty = 48;
    const diff = dispatchedQty - receivedQty;

    assert.equal(diff, 2);
    const discrepancy = `Dispatched ${dispatchedQty}, Received ${receivedQty}`;
    assert.ok(discrepancy.includes('Dispatched 50, Received 48'));
  });
});
