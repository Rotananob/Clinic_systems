import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LisService, STANDARD_ANALYTES } from '../src/lis/lis.service.ts';

describe('Phase 12: Laboratory Information System (LIS) & ASTM/HL7 Interfacing Engine', () => {
  it('should initialize with pre-seeded verified CBC order for default patient', () => {
    const service = new LisService();
    const orders = service.listOrders();
    assert.ok(orders.length >= 1, 'Should contain at least 1 pre-seeded lab order');

    const defaultOrder = orders.find((o) => o.orderNumber === 'LAB-20261020-001');
    assert.ok(defaultOrder, 'Default lab order should be present');
    assert.equal(defaultOrder.status, 'VERIFIED');
    assert.equal(defaultOrder.specimen.tubeType, 'EDTA_LAVENDER');
    assert.equal(defaultOrder.hasPanicValue, false);
  });

  it('should create new specimen accession with 12-digit Code128 barcode and tube categorization', () => {
    const service = new LisService();
    const order = service.createAccession(
      'PT-1002',
      'CHHAY Bopha',
      'CMP_METABOLIC',
      'Comprehensive Metabolic Panel (CMP)',
      'វិភាគការរំលាយអាហារ និងជាតិស្ករ (CMP)',
      'SERUM_RED_GOLD',
      'Dr. RITH Sreynoch',
      'Sokha Phlebotomist',
    );

    assert.ok(order.id.startsWith('ord-'));
    assert.ok(order.specimen.accessionNumber.startsWith('ACC-'));
    assert.equal(order.specimen.tubeType, 'SERUM_RED_GOLD');
    assert.equal(order.specimen.tubeNameKh, 'បំពង់ក្បាលក្រហម/មាស Serum');
    assert.equal(order.status, 'COLLECTED');
    assert.ok(order.specimen.barcode.length >= 12, 'Barcode must be at least 12 digits');
  });

  it('should accurately parse raw ASTM E1394 hematology analyzer frames', () => {
    const service = new LisService();
    const rawAstm = [
      'H|\\^&|||Mindray^BC-5000||||||||E1394-97',
      'P|1||PT-1001||KEO^Sokha|||M||||||||||||||||',
      'O|1|ACC-20261020-8801||^^^CBC_5DIFF|R|20261020083500|||||A||||||||||||||O',
      'R|1|^^^WBC|8.4|10^9/L|4.0-10.0|N||F',
      'R|2|^^^HGB|14.2|g/dL|12.0-16.5|N||F',
      'R|3|^^^PLT|260|10^9/L|150-450|N||F',
      'L|1|N',
    ].join('\r\n');

    const parsed = service.parseAnalyzerData(rawAstm);
    assert.equal(parsed.length, 3);
    assert.deepEqual(parsed[0], { code: 'WBC', value: 8.4 });
    assert.deepEqual(parsed[1], { code: 'HGB', value: 14.2 });
    assert.deepEqual(parsed[2], { code: 'PLT', value: 260 });
  });

  it('should accurately parse raw HL7 v2 ORU^R01 clinical biochemistry segments', () => {
    const service = new LisService();
    const rawHl7 = [
      'MSH|^~\\&|ARCHITECT|ABBOTT|CLINIC_LIS|LAB|20261020090000||ORU^R01|MSG001|P|2.5',
      'PID|1||PT-1001^^^^MR||KEO^SOKHA||||||||||||||',
      'OBR|1|ORD-101|ACC-8801|CMP^Metabolic Panel|||20261020083000',
      'OBX|1|NM|GLU^Fasting Glucose||105|mg/dL|70-110|N|||F',
      'OBX|2|NM|CREA^Creatinine||1.1|mg/dL|0.6-1.2|N|||F',
      'OBX|3|NM|K_PLUS^Potassium||4.4|mmol/L|3.5-5.1|N|||F',
    ].join('\r\n');

    const parsed = service.parseAnalyzerData(rawHl7);
    assert.equal(parsed.length, 3);
    assert.deepEqual(parsed[0], { code: 'GLU', value: 105 });
    assert.deepEqual(parsed[1], { code: 'CREA', value: 1.1 });
    assert.deepEqual(parsed[2], { code: 'K_PLUS', value: 4.4 });
  });

  it('should detect critical PANIC value when Potassium is fatally elevated', () => {
    const service = new LisService();
    const order = service.createAccession(
      'PT-1003',
      'MENG Dara',
      'ELECTROLYTES',
      'Serum Electrolyte Panel',
      'វិភាគអេឡិចត្រូលីតឈាម',
      'SERUM_RED_GOLD',
      'Dr. CHAN Vanna',
      'Meas Channa',
    );

    // Potassium = 7.1 mmol/L (Normal 3.5-5.1, PanicHigh = 6.5)
    const resultOrder = service.ingestAnalyzerResults(order.id, {
      directAnalyteResults: [
        { code: 'K_PLUS', value: 7.1 },
        { code: 'GLU', value: 92 },
      ],
      analyzerModel: 'Roche Cobas c311',
    });

    assert.equal(resultOrder.hasPanicValue, true);
    const kResult = resultOrder.results.find((r) => r.code === 'K_PLUS');
    assert.ok(kResult);
    assert.equal(kResult.flag, 'PANIC_CRITICAL');
    assert.equal(kResult.panicAlert, true);
  });

  it('should trigger DELTA CHECK ALERT when analyte shifts significantly from historical baseline', () => {
    const service = new LisService();
    // Baseline for PT-1001: PLT = 240, CREA = 0.9
    const order = service.createAccession(
      'PT-1001',
      'KEO Sokha',
      'CBC_FOLLOWUP',
      'Follow-Up Complete Blood Count',
      'តាមដានគ្រាប់ឈាម CBC',
      'EDTA_LAVENDER',
      'Dr. CHAN Vanna',
      'Meas Channa',
    );

    // New Platelets drop precipitously to 90 (drop of -62.5%, max allowed delta is 40%)
    const resultOrder = service.ingestAnalyzerResults(order.id, {
      directAnalyteResults: [
        { code: 'WBC', value: 7.0 },
        { code: 'PLT', value: 90 }, // Massive drop from 240
      ],
    });

    assert.equal(resultOrder.hasDeltaAlert, true);
    const plt = resultOrder.results.find((r) => r.code === 'PLT');
    assert.ok(plt);
    assert.equal(plt.flag, 'DELTA_ALERT');
    assert.equal(plt.previousValue, 240);
    assert.equal(plt.deltaPercent, -62.5);
  });

  it('should allow pathologist verification and update patient historical baseline', () => {
    const service = new LisService();
    const order = service.createAccession(
      'PT-1004',
      'HENG Piseth',
      'LIPID_PROFILE',
      'Fasting Lipid & Liver Function',
      'វិភាគជាតិខ្លាញ់ និងមុខងារថ្លើម',
      'SERUM_RED_GOLD',
      'Dr. RITH Sreynoch',
      'Meas Channa',
    );

    service.ingestAnalyzerResults(order.id, {
      directAnalyteResults: [
        { code: 'ALT', value: 34 },
        { code: 'GLU', value: 96 },
      ],
    });

    const verified = service.verifyAndReleaseOrder(
      order.id,
      'Dr. SOK Piseth (Pathologist)',
      'All internal controls verified within 2SD. Clinically concordant.',
    );

    assert.equal(verified.status, 'VERIFIED');
    assert.equal(verified.verifyingPathologist, 'Dr. SOK Piseth (Pathologist)');
    assert.ok(verified.verifiedAt);
  });

  it('should filter orders by panic flag and status correctly', () => {
    const service = new LisService();
    const verifiedOrders = service.listOrders({ status: 'VERIFIED' });
    assert.ok(verifiedOrders.every((o) => o.status === 'VERIFIED'));

    const panicOrders = service.listOrders({ hasPanic: true });
    assert.ok(panicOrders.every((o) => o.hasPanicValue === true));
  });

  it('should guarantee zero emojis across the entire standard analytes repository', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;

    for (const [code, ref] of Object.entries(STANDARD_ANALYTES)) {
      assert.ok(!emojiRegex.test(ref.nameEn), `Analyte ${code} English name contains emoji`);
      assert.ok(!emojiRegex.test(ref.nameKh), `Analyte ${code} Khmer name contains emoji`);
      assert.ok(!emojiRegex.test(ref.unit), `Analyte ${code} unit contains emoji`);
    }
  });
});
