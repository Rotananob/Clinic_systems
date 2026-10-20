'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Download,
  Printer,
  ChevronRight,
  Filter,
  CreditCard,
  Building,
  Activity,
  Layers,
  ArrowUpRight,
  X,
  Sliders,
  FileText
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';

export default function FinancePage() {
  const { t, locale } = useTranslation();
  const f = t.finance || ({} as any);
  const isKh = locale === 'km';

  // State
  const [activeTab, setActiveTab] = useState<'pnl' | 'commissions' | 'expenses' | 'rules'>('pnl');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-10');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Financial Data
  const [pnlData, setPnlData] = useState<any>(null);
  const [summaryMetrics, setSummaryMetrics] = useState<any>(null);
  const [commissionStatements, setCommissionStatements] = useState<any[]>([]);
  const [doctorRules, setDoctorRules] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseFilterCategory, setExpenseFilterCategory] = useState<string>('ALL');

  // Modals
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [showEditRuleModal, setShowEditRuleModal] = useState(false);

  // Active items for modals
  const [selectedStatement, setSelectedStatement] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);

  // Form states
  const [newExpense, setNewExpense] = useState({
    category: 'SUPPLIES',
    description: '',
    amountUsd: '',
    receiptRef: '',
    paymentMethod: 'KHQR',
    approvedBy: 'Dr. Seng Chanthou'
  });

  const [disburseData, setDisburseData] = useState({
    paymentMethod: 'BAKONG_KHQR',
    paymentRef: ''
  });

  const [ruleFormData, setRuleFormData] = useState({
    consultationSplitPct: 70,
    procedureSplitPct: 50,
    labReferralPct: 10,
    fixedAllowanceMonthlyUsd: 0,
    bankAccountBakong: ''
  });

  const exchangeRate = 4100;

  // Formatting helpers
  const formatMoney = (usd: number, khrOverride?: number) => {
    if (currency === 'KHR') {
      const khr = khrOverride !== undefined ? khrOverride : Math.round(usd * exchangeRate);
      return `${khr.toLocaleString()} KHR`;
    }
    return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Data
  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const [pnlRes, sumRes, commRes, rulesRes, expRes] = await Promise.all([
        api.finance.getPnlReport(selectedPeriod),
        api.finance.getSummary(),
        api.finance.getCommissionStatements({ period: selectedPeriod }),
        api.finance.getDoctorRules(),
        api.finance.getExpenses()
      ]);

      if (pnlRes?.success && pnlRes.data) setPnlData(pnlRes.data);
      if (sumRes?.success && sumRes.data) setSummaryMetrics(sumRes.data);
      const commList = (commRes as any)?.data || (Array.isArray(commRes) ? commRes : []);
      if (Array.isArray(commList)) setCommissionStatements(commList);
      const rulesList = (rulesRes as any)?.data || (Array.isArray(rulesRes) ? rulesRes : []);
      if (Array.isArray(rulesList)) setDoctorRules(rulesList);
      const expList = (expRes as any)?.data || (Array.isArray(expRes) ? expRes : []);
      if (Array.isArray(expList)) setExpenses(expList);
    } catch {
      // Fallback state if backend is booting
      setPnlData({
        period: selectedPeriod,
        exchangeRate: 4100,
        revenue: {
          consultationUsd: 50.0,
          pharmacyUsd: 3450.0,
          labUsd: 20.0,
          proceduresUsd: 65.0,
          ipdUsd: 1250.0,
          totalRevenueUsd: 4835.0,
          totalRevenueKhr: 4835.0 * 4100
        },
        cogs: {
          drugsWholesaleUsd: 1680.0,
          labReagentsUsd: 280.0,
          consumablesUsd: 172.5,
          totalCogsUsd: 2132.5,
          totalCogsKhr: 2132.5 * 4100
        },
        grossProfit: {
          amountUsd: 2702.5,
          amountKhr: 2702.5 * 4100,
          marginPct: 55.9
        },
        opex: {
          doctorCommissionsUsd: 376.0,
          staffSalariesUsd: 1200.0,
          rentUtilitiesUsd: 1880.0,
          clinicOverheadsUsd: 420.0,
          totalOpexUsd: 3876.0,
          totalOpexKhr: 3876.0 * 4100
        },
        netOperatingIncome: {
          amountUsd: -1173.5,
          amountKhr: -1173.5 * 4100,
          marginPct: -24.3
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [selectedPeriod]);

  // Handlers
  const handleCalculateAllCommissions = async () => {
    setLoading(true);
    try {
      for (const rule of doctorRules) {
        await api.finance.calculateCommission(rule.doctorId, selectedPeriod);
      }
      showToast(f.statementApprovedToast || 'Commission statements generated');
      await loadFinancialData();
    } catch {
      showToast('Error calculating commissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStatement = async (statementId: string) => {
    try {
      const res = await api.finance.approveCommission(statementId, 'Clinic Director Ly');
      if (res?.success) {
        showToast(f.statementApprovedToast || 'Statement approved');
        await loadFinancialData();
      }
    } catch {
      showToast('Error approving statement');
    }
  };

  const handleOpenDisburse = (stmt: any) => {
    setSelectedStatement(stmt);
    setDisburseData({
      paymentMethod: 'BAKONG_KHQR',
      paymentRef: `TXN-BK-${Date.now().toString().slice(-8)}`
    });
    setShowDisburseModal(true);
  };

  const handleConfirmDisburse = async () => {
    if (!selectedStatement) return;
    try {
      const res = await api.finance.payoutCommission(selectedStatement.statementId, {
        paymentMethod: disburseData.paymentMethod,
        paymentRef: disburseData.paymentRef
      });
      if (res?.success) {
        showToast(f.statementPaidToast || 'Commission payout disbursed');
        setShowDisburseModal(false);
        await loadFinancialData();
      }
    } catch {
      showToast('Error recording payout');
    }
  };

  const handleOpenSlip = (stmt: any) => {
    setSelectedStatement(stmt);
    setShowSlipModal(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amountUsd || !newExpense.description) return;
    try {
      const res = await api.finance.createExpense({
        category: newExpense.category as any,
        description: newExpense.description,
        amountUsd: parseFloat(newExpense.amountUsd),
        receiptRef: newExpense.receiptRef || undefined,
        paymentMethod: newExpense.paymentMethod as any,
        approvedBy: newExpense.approvedBy
      });
      if (res?.success) {
        showToast(f.expenseSuccessToast || 'Expense recorded successfully');
        setShowAddExpenseModal(false);
        setNewExpense({
          category: 'SUPPLIES',
          description: '',
          amountUsd: '',
          receiptRef: '',
          paymentMethod: 'KHQR',
          approvedBy: 'Dr. Seng Chanthou'
        });
        await loadFinancialData();
      }
    } catch {
      showToast('Error recording expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const res = await api.finance.deleteExpense(id);
      if (res?.success) {
        showToast(f.expenseDeletedToast || 'Expense record deleted');
        await loadFinancialData();
      }
    } catch {
      showToast('Error deleting expense');
    }
  };

  const handleOpenEditRule = (rule: any) => {
    setSelectedRule(rule);
    setRuleFormData({
      consultationSplitPct: rule.consultationSplitPct,
      procedureSplitPct: rule.procedureSplitPct,
      labReferralPct: rule.labReferralPct,
      fixedAllowanceMonthlyUsd: rule.fixedAllowanceMonthlyUsd,
      bankAccountBakong: rule.bankAccountBakong || ''
    });
    setShowEditRuleModal(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRule) return;
    try {
      const res = await api.finance.updateDoctorRule(selectedRule.doctorId, ruleFormData);
      if (res?.success) {
        showToast(f.ruleSavedToast || 'Commission rule updated');
        setShowEditRuleModal(false);
        await loadFinancialData();
      }
    } catch {
      showToast('Error updating rule');
    }
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    if (expenseFilterCategory === 'ALL') return expenses;
    return expenses.filter(e => e.category === expenseFilterCategory);
  }, [expenses, expenseFilterCategory]);

  // Export CSV simulation
  const handleExportCsv = () => {
    const csvRows = [
      ['Statement ID', 'Doctor', 'Specialty', 'Period', 'Consultation USD', 'Procedure USD', 'Lab USD', 'Total USD', 'Status']
    ];
    for (const stmt of commissionStatements) {
      csvRows.push([
        stmt.statementId,
        stmt.doctorName,
        stmt.specialty,
        stmt.period,
        stmt.consultationCommissionUsd,
        stmt.procedureCommissionUsd,
        stmt.labCommissionUsd,
        stmt.totalCommissionUsd,
        stmt.status
      ]);
    }
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `commission_report_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 select-none font-sans text-stone-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl border border-stone-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
            <TrendingUp className="w-4 h-4" />
            <span>Phase 14 Enterprise Financial Suite</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            {f.title || 'Doctor Commission & Clinic P&L Financial Engine'}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {f.subtitle || 'Real-time EBITDA analytics, multi-currency ledger (USD/KHR), expense tracking, and automated doctor payouts'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector */}
          <div className="flex items-center bg-stone-100 rounded-lg p-1 border border-stone-200">
            {['2026-10', '2026-09', '2026-08'].map(p => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedPeriod === p ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center bg-stone-100 rounded-lg p-1 border border-stone-200">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                currency === 'USD' ? 'bg-white text-teal-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setCurrency('KHR')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                currency === 'KHR' ? 'bg-white text-teal-800 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              KHR (៛)
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{f.addExpenseButton || 'Record Expense'}</span>
          </button>

          <button
            onClick={handleCalculateAllCommissions}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-2xs"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{f.calculateCommissionButton || 'Calculate Commission'}</span>
          </button>
        </div>
      </div>

      {/* Official Exchange Rate Notice */}
      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-700" />
          <span className="font-semibold">{f.exchangeRateNotice || 'Official Rate: 1 USD = 4,100 KHR'}</span>
        </div>
        <span className="text-[11px] text-amber-800 font-mono">National Bank of Cambodia Standard Multi-Currency</span>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>{f.totalRevenue || 'Total Revenue'}</span>
            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-md">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-stone-900 mt-2">
            {pnlData ? formatMoney(pnlData.revenue.totalRevenueUsd, pnlData.revenue.totalRevenueKhr) : '...'}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 font-mono">
            {currency === 'USD' ? `~ ${(pnlData?.revenue.totalRevenueKhr || 0).toLocaleString()} KHR` : `$${pnlData?.revenue.totalRevenueUsd || 0}`}
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>{f.grossProfit || 'Gross Profit'}</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-md">
              {pnlData?.grossProfit.marginPct || 0}%
            </span>
          </div>
          <div className="text-xl font-black text-emerald-800 mt-2">
            {pnlData ? formatMoney(pnlData.grossProfit.amountUsd, pnlData.grossProfit.amountKhr) : '...'}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {f.grossMargin || 'Gross Margin'}: {pnlData?.grossProfit.marginPct || 0}%
          </div>
        </div>

        {/* Total OPEX */}
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>{f.totalOpex || 'Operating Expenses (OPEX)'}</span>
            <span className="p-1.5 bg-rose-50 text-rose-700 rounded-md">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl font-black text-stone-800 mt-2">
            {pnlData ? formatMoney(pnlData.opex.totalOpexUsd, pnlData.opex.totalOpexKhr) : '...'}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Commissions + Salaries + Overheads
          </div>
        </div>

        {/* Net Operating Income EBITDA */}
        <div className={`bg-white rounded-xl p-4 border shadow-2xs ${
          (pnlData?.netOperatingIncome.amountUsd || 0) >= 0 ? 'border-emerald-200' : 'border-stone-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>{f.netEbitda || 'Net Operating Income (EBITDA)'}</span>
            <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${
              (pnlData?.netOperatingIncome.amountUsd || 0) >= 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-800'
            }`}>
              {pnlData?.netOperatingIncome.marginPct || 0}%
            </span>
          </div>
          <div className={`text-xl font-black mt-2 ${
            (pnlData?.netOperatingIncome.amountUsd || 0) >= 0 ? 'text-emerald-700' : 'text-stone-800'
          }`}>
            {pnlData ? formatMoney(pnlData.netOperatingIncome.amountUsd, pnlData.netOperatingIncome.amountKhr) : '...'}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {f.netMargin || 'Net Margin'}: {pnlData?.netOperatingIncome.marginPct || 0}%
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 flex gap-6 text-xs font-bold">
        {[
          { key: 'pnl', label: f.tabPnl || 'P&L Income Statement', icon: TrendingUp },
          { key: 'commissions', label: f.tabCommissions || 'Doctor Commissions', icon: Users },
          { key: 'expenses', label: f.tabExpenses || 'Expense Ledger', icon: Receipt },
          { key: 'rules', label: f.tabRules || 'Commission Rules', icon: Sliders }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 py-3 border-b-2 font-bold transition-all ${
                isActive
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: P&L INCOME STATEMENT */}
      {activeTab === 'pnl' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Streams */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <span>{f.revenueBreakdown || 'Revenue Streams Breakdown'}</span>
              </h2>
              <span className="text-xs font-bold text-teal-800">
                {pnlData ? formatMoney(pnlData.revenue.totalRevenueUsd, pnlData.revenue.totalRevenueKhr) : '...'}
              </span>
            </div>
            <div className="divide-y divide-stone-100 text-xs mt-3">
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.consultationRevenue || 'Consultation Fees'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.revenue.consultationUsd || 0)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.pharmacyRevenue || 'Pharmacy Sales'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.revenue.pharmacyUsd || 0)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.labRevenue || 'Laboratory Diagnostics'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.revenue.labUsd || 0)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.procedureRevenue || 'Procedures & Surgeries'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.revenue.proceduresUsd || 0)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.ipdRevenue || 'Inpatient Bed Charges'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.revenue.ipdUsd || 0)}</span>
              </div>
            </div>
          </div>

          {/* Cost of Goods Sold (COGS) */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                <span>{f.cogsBreakdown || 'Cost of Goods Sold (COGS)'}</span>
              </h2>
              <span className="text-xs font-bold text-amber-800">
                {pnlData ? formatMoney(pnlData.cogs.totalCogsUsd, pnlData.cogs.totalCogsKhr) : '...'}
              </span>
            </div>
            <div className="divide-y divide-stone-100 text-xs mt-3">
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.drugsWholesale || 'Wholesale Drug Costs'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.cogs.drugsWholesaleUsd || 0)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.labReagents || 'Lab Reagents & Consumables'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.cogs.labReagentsUsd || 0)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.medicalConsumables || 'Medical Supplies & Dressings'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.cogs.consumablesUsd || 0)}</span>
              </div>
              <div className="py-3 bg-stone-50 rounded-lg px-3 mt-4 flex justify-between font-bold text-stone-900">
                <span>{f.grossProfit || 'Gross Profit'}</span>
                <span className="text-emerald-700">{pnlData ? formatMoney(pnlData.grossProfit.amountUsd, pnlData.grossProfit.amountKhr) : '...'}</span>
              </div>
            </div>
          </div>

          {/* Operating Expenses (OPEX) */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span>{f.opexBreakdown || 'Operating Expenses Breakdown'}</span>
              </h2>
              <span className="text-xs font-bold text-rose-800">
                {pnlData ? formatMoney(pnlData.opex.totalOpexUsd, pnlData.opex.totalOpexKhr) : '...'}
              </span>
            </div>
            <div className="divide-y divide-stone-100 text-xs mt-3">
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.doctorCommissions || 'Doctor Commissions & Incentives'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.opex.doctorCommissionsUsd || 0)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.staffSalaries || 'Clinical & Support Staff Payroll'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.opex.staffSalariesUsd || 0)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.rentUtilities || 'Facility Rent & Utilities'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.opex.rentUtilitiesUsd || 0)}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-stone-600">{f.clinicOverheads || 'Admin, Maintenance & Marketing'}</span>
                <span className="font-bold text-stone-900">{formatMoney(pnlData?.opex.clinicOverheadsUsd || 0)}</span>
              </div>
              <div className="py-3 bg-teal-50 border border-teal-200 rounded-lg px-3 mt-4 flex justify-between font-bold text-teal-900">
                <span>{f.netEbitda || 'Net Operating Income (EBITDA)'}</span>
                <span>{pnlData ? formatMoney(pnlData.netOperatingIncome.amountUsd, pnlData.netOperatingIncome.amountKhr) : '...'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCTOR COMMISSIONS */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="text-xs font-bold text-stone-700">
              {f.periodFilter || 'Billing Period'}: <span className="font-mono text-teal-800">{selectedPeriod}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{f.exportCsvButton || 'Export CSV'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="p-3.5">{f.statementId || 'Statement ID'}</th>
                    <th className="p-3.5">{f.physicianName || 'Physician Name'}</th>
                    <th className="p-3.5">{f.specialty || 'Specialty'}</th>
                    <th className="p-3.5 text-center">{f.patientVolume || 'Patients'}</th>
                    <th className="p-3.5 text-right">{f.consultationShare || 'Consultation'}</th>
                    <th className="p-3.5 text-right">{f.procedureShare || 'Procedures'}</th>
                    <th className="p-3.5 text-right">{f.labIncentive || 'Lab'}</th>
                    <th className="p-3.5 text-right">{f.fixedAllowance || 'Allowance'}</th>
                    <th className="p-3.5 text-right">{f.totalAccrued || 'Total Accrued'}</th>
                    <th className="p-3.5 text-center">{f.payoutStatus || 'Status'}</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {commissionStatements.map((stmt) => (
                    <tr key={stmt.statementId} className="hover:bg-stone-50 transition-colors">
                      <td className="p-3.5 font-mono font-semibold text-stone-800">{stmt.statementId}</td>
                      <td className="p-3.5 font-bold text-stone-900">{stmt.doctorName}</td>
                      <td className="p-3.5 text-stone-600">{stmt.specialty}</td>
                      <td className="p-3.5 text-center font-mono">{stmt.totalPatients}</td>
                      <td className="p-3.5 text-right font-mono text-stone-700">{formatMoney(stmt.consultationCommissionUsd)}</td>
                      <td className="p-3.5 text-right font-mono text-stone-700">{formatMoney(stmt.procedureCommissionUsd)}</td>
                      <td className="p-3.5 text-right font-mono text-stone-700">{formatMoney(stmt.labCommissionUsd)}</td>
                      <td className="p-3.5 text-right font-mono text-stone-700">{formatMoney(stmt.fixedAllowanceUsd)}</td>
                      <td className="p-3.5 text-right font-mono font-black text-teal-800">
                        {formatMoney(stmt.totalCommissionUsd, stmt.totalCommissionKhr)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          stmt.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : stmt.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {stmt.status === 'PAID' ? (f.statusPaid || 'Paid') : stmt.status === 'APPROVED' ? (f.statusApproved || 'Approved') : (f.statusDraft || 'Draft')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenSlip(stmt)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-all"
                            title="View Slip"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {stmt.status === 'DRAFT' && (
                            <button
                              onClick={() => handleApproveStatement(stmt.statementId)}
                              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-md text-[11px] transition-all"
                            >
                              {f.approveButton || 'Approve'}
                            </button>
                          )}

                          {stmt.status === 'APPROVED' && (
                            <button
                              onClick={() => handleOpenDisburse(stmt)}
                              className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-md text-[11px] transition-all"
                            >
                              {f.payoutButton || 'Disburse'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {commissionStatements.length === 0 && (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-stone-400">
                        No commission statements for this period. Click &apos;Calculate Commission&apos; above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSE LEDGER */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-400" />
              <select
                value={expenseFilterCategory}
                onChange={(e) => setExpenseFilterCategory(e.target.value)}
                className="text-xs font-bold bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-stone-800"
              >
                <option value="ALL">{f.allCategories || 'All Categories'}</option>
                <option value="RENT">{f.categoryRent || 'Facility Rent'}</option>
                <option value="UTILITIES">{f.categoryUtilities || 'EDC Electricity & Water'}</option>
                <option value="SALARIES">{f.categorySalaries || 'Staff Payroll'}</option>
                <option value="SUPPLIES">{f.categorySupplies || 'Medical Supplies'}</option>
                <option value="MAINTENANCE">{f.categoryMaintenance || 'Equipment Maintenance'}</option>
                <option value="MARKETING">{f.categoryMarketing || 'Marketing & Software'}</option>
                <option value="OTHER">{f.categoryOther || 'Other Miscellaneous'}</option>
              </select>
            </div>
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{f.addExpenseButton || 'Record Expense'}</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">{f.categoryFilter || 'Category'}</th>
                    <th className="p-3.5">{f.expenseDescription || 'Description'}</th>
                    <th className="p-3.5">{f.receiptRef || 'Receipt Ref'}</th>
                    <th className="p-3.5">{f.paymentMethod || 'Method'}</th>
                    <th className="p-3.5">{f.approvedBy || 'Approved By'}</th>
                    <th className="p-3.5 text-right">{f.expenseAmount || 'Amount'}</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-3.5 font-mono text-stone-500">{exp.id}</td>
                      <td className="p-3.5 font-mono text-stone-700">{exp.date}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-stone-900">{exp.description}</td>
                      <td className="p-3.5 font-mono text-stone-600">{exp.receiptRef}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 text-[10px] font-bold font-mono">
                          {exp.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-600">{exp.approvedBy}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-stone-900">
                        {formatMoney(exp.amountUsd, exp.amountKhr)}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-stone-400">
                        No expense records match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMMISSION RULES */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs">
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-teal-700" />
              <span>{f.rulesTitle || 'Doctor Commission Split Structure'}</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {doctorRules.map((rule) => (
                <div key={rule.doctorId} className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-stone-900">{rule.doctorName}</div>
                      <div className="text-xs text-stone-500">{rule.specialty}</div>
                      <div className="text-[10px] font-mono text-teal-800 mt-0.5">{rule.doctorId}</div>
                    </div>
                    <button
                      onClick={() => handleOpenEditRule(rule)}
                      className="px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-50 border border-teal-200 rounded-md transition-all"
                    >
                      {f.editRule || 'Edit'}
                    </button>
                  </div>

                  <div className="border-t border-stone-200 pt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-600">{f.consultationSplit || 'Consultation Split %'}:</span>
                      <span className="font-mono font-bold text-stone-900">{rule.consultationSplitPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">{f.procedureSplit || 'Procedure Split %'}:</span>
                      <span className="font-mono font-bold text-stone-900">{rule.procedureSplitPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">{f.labSplit || 'Lab Referral %'}:</span>
                      <span className="font-mono font-bold text-stone-900">{rule.labReferralPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">{f.fixedAllowance || 'Monthly Fixed Allowance'}:</span>
                      <span className="font-mono font-bold text-teal-800">${rule.fixedAllowanceMonthlyUsd}</span>
                    </div>
                    {rule.bankAccountBakong && (
                      <div className="flex justify-between">
                        <span className="text-stone-600">{f.bakongAccount || 'Bakong Account ID'}:</span>
                        <span className="font-mono text-stone-700 text-[11px]">{rule.bankAccountBakong}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Record Expense */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-700" />
                <span>{f.addExpenseButton || 'Record Expense'}</span>
              </h3>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateExpense} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">{f.categoryFilter || 'Category'}</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900"
                >
                  <option value="RENT">{f.categoryRent || 'Facility Rent'}</option>
                  <option value="UTILITIES">{f.categoryUtilities || 'EDC Electricity & Water'}</option>
                  <option value="SALARIES">{f.categorySalaries || 'Staff Payroll'}</option>
                  <option value="SUPPLIES">{f.categorySupplies || 'Medical Supplies'}</option>
                  <option value="MAINTENANCE">{f.categoryMaintenance || 'Equipment Maintenance'}</option>
                  <option value="MARKETING">{f.categoryMarketing || 'Marketing & Software'}</option>
                  <option value="OTHER">{f.categoryOther || 'Other Miscellaneous'}</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">{f.expenseDescription || 'Description'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ultrasonic Gel, ECG Thermal Paper"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">{f.expenseAmount || 'Amount (USD)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newExpense.amountUsd}
                    onChange={(e) => setNewExpense({ ...newExpense, amountUsd: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Equivalent (KHR)</label>
                  <div className="bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-stone-700 font-mono font-bold">
                    {newExpense.amountUsd ? (parseFloat(newExpense.amountUsd) * 4100).toLocaleString() : '0'} ៛
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">{f.receiptRef || 'Receipt / Ref'}</label>
                  <input
                    type="text"
                    placeholder="RCP-1049"
                    value={newExpense.receiptRef}
                    onChange={(e) => setNewExpense({ ...newExpense, receiptRef: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">{f.paymentMethod || 'Method'}</label>
                  <select
                    value={newExpense.paymentMethod}
                    onChange={(e) => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900"
                  >
                    <option value="KHQR">{f.methodKhqr || 'Bakong KHQR'}</option>
                    <option value="CASH">{f.methodCash || 'Cash Drawer'}</option>
                    <option value="BANK_TRANSFER">{f.methodTransfer || 'Bank Wire Transfer'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">{f.approvedBy || 'Approved By'}</label>
                <input
                  type="text"
                  required
                  value={newExpense.approvedBy}
                  onChange={(e) => setNewExpense({ ...newExpense, approvedBy: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 font-bold hover:bg-stone-50"
                >
                  {f.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-stone-900 text-white font-bold hover:bg-black"
                >
                  {f.saveExpense || 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Disburse Commission Payout */}
      {showDisburseModal && selectedStatement && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-700" />
                <span>{f.disburseModalTitle || 'Disburse Commission Payout'}</span>
              </h3>
              <button
                onClick={() => setShowDisburseModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3.5 text-xs">
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1">
                <div className="font-bold text-stone-900">{selectedStatement.doctorName}</div>
                <div className="text-stone-500 font-mono text-[11px]">{selectedStatement.statementId}</div>
                <div className="text-sm font-black text-teal-800 mt-2">
                  {formatMoney(selectedStatement.totalCommissionUsd, selectedStatement.totalCommissionKhr)}
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">{f.selectDisburseMethod || 'Disbursement Channel'}</label>
                <select
                  value={disburseData.paymentMethod}
                  onChange={(e) => setDisburseData({ ...disburseData, paymentMethod: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900"
                >
                  <option value="BAKONG_KHQR">Bakong KHQR Direct Transfer</option>
                  <option value="ABA_PAYROLL">ABA PayWay Corporate Payroll</option>
                  <option value="CASH">Clinic Cash Drawer</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={disburseData.paymentRef}
                  onChange={(e) => setDisburseData({ ...disburseData, paymentRef: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowDisburseModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 font-bold hover:bg-stone-50"
                >
                  {f.cancel || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDisburse}
                  className="px-4 py-1.5 rounded-lg bg-teal-700 text-white font-bold hover:bg-teal-800"
                >
                  {f.confirmDisburse || 'Confirm & Mark Paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Itemized Commission Slip */}
      {showSlipModal && selectedStatement && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>{f.viewSlipButton || 'Itemized Commission Slip'}</span>
              </h3>
              <button
                onClick={() => setShowSlipModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs font-sans">
              <div className="border-b border-stone-200 pb-3 text-center">
                <div className="font-black text-sm uppercase tracking-wider text-stone-900">Dr. Seng Clinic & Healthcare</div>
                <div className="text-[11px] text-stone-500">Official Physician Commission Statement</div>
                <div className="font-mono text-[10px] text-stone-400 mt-1">{selectedStatement.statementId}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-stone-400">Physician:</span>{' '}
                  <span className="font-bold text-stone-900">{selectedStatement.doctorName}</span>
                </div>
                <div>
                  <span className="text-stone-400">Specialty:</span>{' '}
                  <span className="font-bold text-stone-900">{selectedStatement.specialty}</span>
                </div>
                <div>
                  <span className="text-stone-400">Period:</span>{' '}
                  <span className="font-mono font-bold text-stone-900">{selectedStatement.period}</span>
                </div>
                <div>
                  <span className="text-stone-400">Status:</span>{' '}
                  <span className="font-bold text-teal-800">{selectedStatement.status}</span>
                </div>
              </div>

              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                    <tr>
                      <th className="p-2">Service Category</th>
                      <th className="p-2 text-right">Charges</th>
                      <th className="p-2 text-right">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    <tr>
                      <td className="p-2 font-medium">Consultation Visits ({selectedStatement.totalPatients} patients)</td>
                      <td className="p-2 text-right font-mono">${selectedStatement.consultationFeeTotalUsd}</td>
                      <td className="p-2 text-right font-mono font-bold text-teal-800">${selectedStatement.consultationCommissionUsd}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Procedures & Surgical Fees</td>
                      <td className="p-2 text-right font-mono">${selectedStatement.procedureFeeTotalUsd}</td>
                      <td className="p-2 text-right font-mono font-bold text-teal-800">${selectedStatement.procedureCommissionUsd}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Laboratory Referral Incentive</td>
                      <td className="p-2 text-right font-mono">${selectedStatement.labFeeTotalUsd}</td>
                      <td className="p-2 text-right font-mono font-bold text-teal-800">${selectedStatement.labCommissionUsd}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Monthly Guaranteed Allowance</td>
                      <td className="p-2 text-right font-mono">-</td>
                      <td className="p-2 text-right font-mono font-bold text-teal-800">${selectedStatement.fixedAllowanceUsd}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-stone-50 border-t border-stone-200 font-bold">
                    <tr>
                      <td className="p-2.5 text-stone-900 font-black">Net Total Payout</td>
                      <td className="p-2.5 text-right font-mono">${selectedStatement.totalChargesUsd}</td>
                      <td className="p-2.5 text-right font-mono text-sm font-black text-teal-800">
                        ${selectedStatement.totalCommissionUsd}
                        <div className="text-[10px] text-stone-500 font-normal">
                          {selectedStatement.totalCommissionKhr.toLocaleString()} KHR
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedStatement.paidAt && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-[11px] text-emerald-900 space-y-0.5">
                  <div className="font-bold">Payment Settled</div>
                  <div>Method: {selectedStatement.paymentMethod}</div>
                  <div className="font-mono">Ref: {selectedStatement.paymentRef}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowSlipModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-stone-900 text-white font-bold hover:bg-black"
                >
                  {f.close || 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Commission Rule */}
      {showEditRuleModal && selectedRule && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-700" />
                <span>{f.editRule || 'Edit Commission Rule'}</span>
              </h3>
              <button
                onClick={() => setShowEditRuleModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveRule} className="p-4 space-y-3.5 text-xs">
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <div className="font-bold text-stone-900">{selectedRule.doctorName}</div>
                <div className="text-stone-500">{selectedRule.specialty}</div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Consultation %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={ruleFormData.consultationSplitPct}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, consultationSplitPct: parseInt(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Procedure %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={ruleFormData.procedureSplitPct}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, procedureSplitPct: parseInt(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">Lab %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={ruleFormData.labReferralPct}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, labReferralPct: parseInt(e.target.value) || 0 })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Monthly Fixed Allowance (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={ruleFormData.fixedAllowanceMonthlyUsd}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, fixedAllowanceMonthlyUsd: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Bakong Account ID</label>
                <input
                  type="text"
                  placeholder="doctor_name@bk"
                  value={ruleFormData.bankAccountBakong}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, bankAccountBakong: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowEditRuleModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 font-bold hover:bg-stone-50"
                >
                  {f.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-700 text-white font-bold hover:bg-teal-800"
                >
                  {f.saveRule || 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
