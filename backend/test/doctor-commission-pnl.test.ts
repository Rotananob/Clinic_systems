import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FinanceService } from '../src/finance/finance.service.ts';

describe('Phase 14: Doctor Commission & Real-Time Clinic P&L Financial Engine', () => {
  let financeService: FinanceService;

  beforeEach(() => {
    financeService = new FinanceService();
  });

  it('should verify exchange rate and base multi-currency conversion at 4100 KHR/USD', () => {
    const rate = financeService.getExchangeRate();
    assert.equal(rate, 4100);

    const testAmountUsd = 100.5;
    const testAmountKhr = testAmountUsd * rate;
    assert.equal(testAmountKhr, 412050);
  });

  it('should list all initial doctor commission rules', () => {
    const rules = financeService.getDoctorRules();
    assert.equal(rules.length >= 3, true);

    const drSeng = rules.find(r => r.doctorId === 'DOC-101');
    assert.notEqual(drSeng, undefined);
    assert.equal(drSeng?.doctorName, 'Dr. Seng Chanthou');
    assert.equal(drSeng?.consultationSplitPct, 70);
    assert.equal(drSeng?.procedureSplitPct, 60);
    assert.equal(drSeng?.labReferralPct, 10);
    assert.equal(drSeng?.fixedAllowanceMonthlyUsd, 300);
  });

  it('should accurately calculate doctor commission for consultation, procedures, and lab incentives', () => {
    // DOC-101 October 2026 activities:
    // Consultation: Keo Samnang ($25) + Vong Dara ($25) = $50. 70% commission = $35.00
    // Procedure: ECG ($15) + Minor Surgery ($50) = $65. 60% commission = $39.00
    // Lab order: CBC/Lipid ($20). 10% commission = $2.00
    // Fixed monthly allowance: $300.00
    // Total = $35 + $39 + $2 + $300 = $376.00
    const statement = financeService.calculateCommission('DOC-101', '2026-10');

    assert.equal(statement.doctorId, 'DOC-101');
    assert.equal(statement.period, '2026-10');
    assert.equal(statement.consultationFeeTotalUsd, 50.0);
    assert.equal(statement.consultationCommissionUsd, 35.0);
    assert.equal(statement.procedureFeeTotalUsd, 65.0);
    assert.equal(statement.procedureCommissionUsd, 39.0);
    assert.equal(statement.labFeeTotalUsd, 20.0);
    assert.equal(statement.labCommissionUsd, 2.0);
    assert.equal(statement.fixedAllowanceUsd, 300.0);
    assert.equal(statement.totalCommissionUsd, 376.0);
    assert.equal(statement.totalCommissionKhr, 376.0 * 4100);
    assert.equal(statement.status, 'DRAFT');
  });

  it('should handle state transitions: DRAFT -> APPROVED -> PAID with payment audit trail', () => {
    const statement = financeService.calculateCommission('DOC-101', '2026-10');
    const statementId = statement.statementId;

    // Approve
    const approved = financeService.approveCommissionStatement(statementId, 'Clinic Director Ly');
    assert.equal(approved.status, 'APPROVED');
    assert.equal(approved.approvedBy, 'Clinic Director Ly');
    assert.notEqual(approved.approvedAt, undefined);

    // Payout
    const paid = financeService.payoutCommissionStatement(
      statementId,
      'BAKONG_KHQR',
      'TXN-BK-20261021-9988'
    );
    assert.equal(paid.status, 'PAID');
    assert.equal(paid.paymentMethod, 'BAKONG_KHQR');
    assert.equal(paid.paymentRef, 'TXN-BK-20261021-9988');
    assert.notEqual(paid.paidAt, undefined);

    // Reject re-payout or re-approval of paid statement
    assert.throws(
      () => financeService.approveCommissionStatement(statementId, 'Another User'),
      /already paid/
    );
    assert.throws(
      () => financeService.payoutCommissionStatement(statementId, 'CASH', 'REF-123'),
      /already paid/
    );
  });

  it('should dynamically update doctor commission rules and reflect updated rates', () => {
    const updatedRule = financeService.updateDoctorRule('DOC-102', {
      consultationSplitPct: 75,
      procedureSplitPct: 55,
      fixedAllowanceMonthlyUsd: 350
    });

    assert.equal(updatedRule.consultationSplitPct, 75);
    assert.equal(updatedRule.procedureSplitPct, 55);
    assert.equal(updatedRule.fixedAllowanceMonthlyUsd, 350);

    const doc102Rule = financeService.getDoctorRuleById('DOC-102');
    assert.equal(doc102Rule?.consultationSplitPct, 75);
  });

  it('should record, list, filter, and delete expense entries in the clinic ledger', () => {
    const newExpense = financeService.recordExpense({
      category: 'MARKETING',
      description: 'Facebook Community Health Awareness Campaign',
      amountUsd: 120.0,
      paymentMethod: 'KHQR',
      approvedBy: 'Dr. Seng Chanthou'
    });

    assert.equal(newExpense.category, 'MARKETING');
    assert.equal(newExpense.amountUsd, 120.0);
    assert.equal(newExpense.amountKhr, 120.0 * 4100);
    assert.notEqual(newExpense.id, undefined);

    // Filter by category
    const marketingExpenses = financeService.getExpenses({ category: 'MARKETING' });
    assert.equal(marketingExpenses.some(e => e.id === newExpense.id), true);

    const rentExpenses = financeService.getExpenses({ category: 'RENT' });
    assert.equal(rentExpenses.every(e => e.category === 'RENT'), true);

    // Delete
    const deleted = financeService.deleteExpense(newExpense.id);
    assert.equal(deleted, true);

    const afterDelete = financeService.getExpenses({ category: 'MARKETING' });
    assert.equal(afterDelete.some(e => e.id === newExpense.id), false);
  });

  it('should compute real-time Clinic P&L statement with Revenue, COGS, Gross Profit, OPEX, and EBITDA', () => {
    const pnl = financeService.generatePnlReport('2026-10');

    // Revenue streams
    assert.equal(pnl.period, '2026-10');
    assert.equal(pnl.exchangeRate, 4100);
    assert.equal(pnl.revenue.pharmacyUsd, 3450.0);
    assert.equal(pnl.revenue.ipdUsd, 1250.0);
    assert.equal(pnl.revenue.totalRevenueUsd > 0, true);
    assert.equal(pnl.revenue.totalRevenueKhr, pnl.revenue.totalRevenueUsd * 4100);

    // COGS
    assert.equal(pnl.cogs.drugsWholesaleUsd, 1680.0);
    assert.equal(pnl.cogs.labReagentsUsd, 280.0);
    assert.equal(pnl.cogs.totalCogsUsd > 0, true);
    assert.equal(pnl.cogs.totalCogsKhr, pnl.cogs.totalCogsUsd * 4100);

    // Gross Profit
    const expectedGrossProfitUsd = Math.round((pnl.revenue.totalRevenueUsd - pnl.cogs.totalCogsUsd) * 100) / 100;
    assert.equal(pnl.grossProfit.amountUsd, expectedGrossProfitUsd);
    assert.equal(pnl.grossProfit.marginPct > 0, true);

    // OPEX
    assert.equal(pnl.opex.doctorCommissionsUsd > 0, true);
    assert.equal(pnl.opex.totalOpexUsd > 0, true);

    // Net Operating Income (EBITDA)
    const expectedEbitdaUsd = Math.round((pnl.grossProfit.amountUsd - pnl.opex.totalOpexUsd) * 100) / 100;
    assert.equal(pnl.netOperatingIncome.amountUsd, expectedEbitdaUsd);
    assert.equal(
      pnl.netOperatingIncome.marginPct,
      Math.round((pnl.netOperatingIncome.amountUsd / pnl.revenue.totalRevenueUsd) * 1000) / 10
    );
  });

  it('should guarantee zero emojis across financial models, rules, and generated statements', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;

    const rules = financeService.getDoctorRules();
    for (const rule of rules) {
      assert.equal(emojiRegex.test(rule.doctorName), false);
      assert.equal(emojiRegex.test(rule.specialty), false);
    }

    const expenses = financeService.getExpenses();
    for (const exp of expenses) {
      assert.equal(emojiRegex.test(exp.description), false);
      assert.equal(emojiRegex.test(exp.approvedBy), false);
    }

    const pnl = financeService.generatePnlReport('2026-10');
    const pnlJson = JSON.stringify(pnl);
    assert.equal(emojiRegex.test(pnlJson), false);
  });
});
