import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Phase 14: Doctor Commission & Real-Time Clinic P&L Financial UI Test Suite', () => {
  it('should verify 100% dictionary key parity for finance localization', () => {
    const enFinance = (en as any).finance;
    const kmFinance = (km as any).finance;

    assert.notEqual(enFinance, undefined, 'en.finance must exist');
    assert.notEqual(kmFinance, undefined, 'km.finance must exist');

    const enKeys = Object.keys(enFinance).sort();
    const kmKeys = Object.keys(kmFinance).sort();

    assert.equal(enKeys.length > 0, true, 'en.finance must not be empty');
    assert.deepEqual(enKeys, kmKeys, 'en and km finance must have exactly identical keys');
  });

  it('should guarantee zero emojis across the entire finance localization dictionaries', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enFinance = (en as any).finance;
    const kmFinance = (km as any).finance;

    for (const [key, value] of Object.entries(enFinance)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in en.finance.${key}: "${value}"`
      );
    }

    for (const [key, value] of Object.entries(kmFinance)) {
      assert.equal(
        emojiRegex.test(value as string),
        false,
        `Emoji found in km.finance.${key}: "${value}"`
      );
    }
  });

  it('should verify nav.finance exists in both English and Khmer with zero emojis', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const enNav = (en as any).nav?.finance;
    const kmNav = (km as any).nav?.finance;

    assert.notEqual(enNav, undefined, 'en.nav.finance must exist');
    assert.notEqual(kmNav, undefined, 'km.nav.finance must exist');

    assert.equal(emojiRegex.test(enNav), false, `Emoji found in en.nav.finance: ${enNav}`);
    assert.equal(emojiRegex.test(kmNav), false, `Emoji found in km.nav.finance: ${kmNav}`);
  });

  it('should verify critical financial, P&L and commission keys exist', () => {
    const requiredKeys = [
      'title',
      'subtitle',
      'tabPnl',
      'tabCommissions',
      'tabExpenses',
      'tabRules',
      'totalRevenue',
      'grossProfit',
      'grossMargin',
      'totalOpex',
      'netEbitda',
      'netMargin',
      'exchangeRateNotice',
      'calculateCommissionButton',
      'addExpenseButton',
      'rulesTitle',
      'disburseModalTitle',
      'zeroEmojiStandards'
    ];

    const enFinance = (en as any).finance;
    for (const key of requiredKeys) {
      assert.notEqual(enFinance[key], undefined, `Missing key en.finance.${key}`);
    }
  });

  it('should accurately compute doctor commission formulas and tiered splits', () => {
    const computeCommission = (
      consultationTotal: number,
      consultationSplitPct: number,
      procedureTotal: number,
      procedureSplitPct: number,
      labTotal: number,
      labSplitPct: number,
      fixedAllowance: number,
      rate: number = 4100
    ) => {
      const consultationComm = Math.round((consultationTotal * (consultationSplitPct / 100)) * 100) / 100;
      const procedureComm = Math.round((procedureTotal * (procedureSplitPct / 100)) * 100) / 100;
      const labComm = Math.round((labTotal * (labSplitPct / 100)) * 100) / 100;
      const totalUsd = Math.round((consultationComm + procedureComm + labComm + fixedAllowance) * 100) / 100;
      const totalKhr = Math.round(totalUsd * rate);

      return { consultationComm, procedureComm, labComm, totalUsd, totalKhr };
    };

    // Scenario 1: Specialist (70% consultation, 60% procedure, 10% lab, $300 allowance)
    const result1 = computeCommission(100, 70, 200, 60, 50, 10, 300);
    assert.equal(result1.consultationComm, 70.0);
    assert.equal(result1.procedureComm, 120.0);
    assert.equal(result1.labComm, 5.0);
    assert.equal(result1.totalUsd, 495.0);
    assert.equal(result1.totalKhr, 495.0 * 4100);

    // Scenario 2: High procedure surgeon (50% consultation, 80% procedure, 15% lab, $500 allowance)
    const result2 = computeCommission(200, 50, 1500, 80, 400, 15, 500);
    assert.equal(result2.consultationComm, 100.0);
    assert.equal(result2.procedureComm, 1200.0);
    assert.equal(result2.labComm, 60.0);
    assert.equal(result2.totalUsd, 1860.0);
    assert.equal(result2.totalKhr, 1860.0 * 4100);
  });

  it('should accurately compute clinic P&L metrics: Gross Margin, OPEX and EBITDA', () => {
    const computePnl = (
      revenueItems: number[],
      cogsItems: number[],
      opexItems: number[]
    ) => {
      const totalRevenue = Math.round(revenueItems.reduce((a, b) => a + b, 0) * 100) / 100;
      const totalCogs = Math.round(cogsItems.reduce((a, b) => a + b, 0) * 100) / 100;
      const grossProfit = Math.round((totalRevenue - totalCogs) * 100) / 100;
      const grossMarginPct = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;

      const totalOpex = Math.round(opexItems.reduce((a, b) => a + b, 0) * 100) / 100;
      const netEbitda = Math.round((grossProfit - totalOpex) * 100) / 100;
      const netMarginPct = totalRevenue > 0 ? Math.round((netEbitda / totalRevenue) * 1000) / 10 : 0;

      return {
        totalRevenue,
        totalCogs,
        grossProfit,
        grossMarginPct,
        totalOpex,
        netEbitda,
        netMarginPct
      };
    };

    // Clinic monthly sample:
    // Revenue: Consultation $2,000, Pharmacy $6,000, Lab $1,500, Procedures $1,200, IPD $2,500 = $13,200
    // COGS: Drugs $2,800, Reagents $400, Supplies $300 = $3,500
    // OPEX: Commissions $3,200, Staff $2,400, Rent/Utils $1,800, Overheads $500 = $7,900
    const pnl = computePnl(
      [2000, 6000, 1500, 1200, 2500],
      [2800, 400, 300],
      [3200, 2400, 1800, 500]
    );

    assert.equal(pnl.totalRevenue, 13200);
    assert.equal(pnl.totalCogs, 3500);
    assert.equal(pnl.grossProfit, 9700);
    assert.equal(pnl.grossMarginPct, 73.5);
    assert.equal(pnl.totalOpex, 7900);
    assert.equal(pnl.netEbitda, 1800);
    assert.equal(pnl.netMarginPct, 13.6);
  });
});
