'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus,
  Trash2,
  CreditCard,
  Building2,
  DollarSign,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  Send,
  FileCheck,
  Percent,
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';

interface InsurancePolicy {
  policyNumber: string;
  patientId: string;
  patientName: string;
  patientNationalId?: string;
  provider: string;
  providerDisplayName: string;
  planName: string;
  coveragePercentage: number;
  coPayFixedUsd: number;
  annualLimitUsd: number;
  remainingLimitUsd: number;
  validFrom: string;
  validUntil: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  eligibleCategories: string[];
}

interface SplitItem {
  id: string;
  category: string;
  description: string;
  unitPriceUsd: number;
  quantity: number;
  totalUsd: number;
  coveredAmountUsd: number;
  patientPortionUsd: number;
}

interface InsuranceClaim {
  id: string;
  claimNumber: string;
  policyNumber: string;
  patientId: string;
  patientName: string;
  provider: string;
  visitId: string;
  diagnosisCode: string;
  diagnosisDescription: string;
  totalClaimUsd: number;
  insurerCoveredUsd: number;
  patientOutOfPocketUsd: number;
  status: 'DRAFT' | 'PRE_AUTHORIZED' | 'SUBMITTED' | 'SETTLED' | 'REJECTED';
  preAuthCode?: string;
  submissionBatchId?: string;
  adjudicationNotes?: string;
  items: SplitItem[];
  createdAt: string;
}

export default function InsuranceSettlementPage() {
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';
  const ins = t.insurance;

  const [activeTab, setActiveTab] = useState<'VERIFY' | 'SPLIT_POS' | 'LEDGER' | 'NSSF_EXPORT'>('VERIFY');

  // Policy Verification States
  const [policyInput, setPolicyInput] = useState<string>('NSSF-KH-904812');
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [verifiedPolicy, setVerifiedPolicy] = useState<InsurancePolicy | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  // Split-Invoice Builder States
  const [builderPolicy, setBuilderPolicy] = useState<string>('FORTE-MED-77102');
  const [invoiceItems, setInvoiceItems] = useState<Array<{ category: string; description: string; unitPriceUsd: number; quantity: number }>>([
    { category: 'CONSULTATION', description: 'Physician Specialist Consultation', unitPriceUsd: 25, quantity: 1 },
    { category: 'IMAGING', description: 'Chest Digital Radiography PA View', unitPriceUsd: 25, quantity: 1 },
    { category: 'PHARMACY', description: 'Prescription Antimicrobial Regimen', unitPriceUsd: 35, quantity: 1 },
  ]);
  const [splitResult, setSplitResult] = useState<any | null>(null);
  const [submittingClaim, setSubmittingClaim] = useState<boolean>(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState<string | null>(null);

  // Claims Ledger States
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [claimsFilterProvider, setClaimsFilterProvider] = useState<string>('ALL');
  const [claimsFilterStatus, setClaimsFilterStatus] = useState<string>('ALL');
  const [claimsSearch, setClaimsSearch] = useState<string>('');
  const [loadingClaims, setLoadingClaims] = useState<boolean>(false);

  // Settlement Modal States
  const [settleClaimTarget, setSettleClaimTarget] = useState<InsuranceClaim | null>(null);
  const [settlementRefInput, setSettlementRefInput] = useState<string>('');
  const [settledAmountInput, setSettledAmountInput] = useState<number>(0);
  const [settling, setSettling] = useState<boolean>(false);

  // NSSF Batch Export States
  const [nssfBatch, setNssfBatch] = useState<any | null>(null);

  useEffect(() => {
    handleVerifyPolicy('NSSF-KH-904812');
    handleRecalculateSplit('FORTE-MED-77102', invoiceItems);
    fetchClaims();
    fetchNssfBatch();
  }, []);

  const handleVerifyPolicy = async (num: string) => {
    try {
      setVerifying(true);
      setVerificationError(null);
      const res = await api.insurance.verifyPolicy(num);
      if (res && res.valid && res.policy) {
        setVerifiedPolicy(res.policy);
      } else {
        setVerifiedPolicy(null);
        setVerificationError(res?.message || ins.invalidPolicySeal);
      }
    } catch (err: any) {
      setVerifiedPolicy(null);
      setVerificationError(err?.message || ins.invalidPolicySeal);
    } finally {
      setVerifying(false);
    }
  };

  const handleRecalculateSplit = async (
    polNum: string,
    items: Array<{ category: string; description: string; unitPriceUsd: number; quantity: number }>,
  ) => {
    try {
      const res = await api.insurance.calculateSplitInvoice({
        policyNumber: polNum,
        items,
      });
      if (res) {
        setSplitResult(res);
      }
    } catch (err) {
      console.error('Failed to calculate split invoice:', err);
    }
  };

  const handleAddItem = () => {
    const updated = [
      ...invoiceItems,
      { category: 'PHARMACY', description: 'Additional Prescribed Medication', unitPriceUsd: 15, quantity: 1 },
    ];
    setInvoiceItems(updated);
    handleRecalculateSplit(builderPolicy, updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updated);
    handleRecalculateSplit(builderPolicy, updated);
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...invoiceItems];
    updated[index] = { ...updated[index], [field]: val };
    setInvoiceItems(updated);
    handleRecalculateSplit(builderPolicy, updated);
  };

  const handleSubmitClaim = async () => {
    try {
      setSubmittingClaim(true);
      const res = await api.insurance.submitClaim({
        policyNumber: builderPolicy,
        patientId: 'PT-1002',
        patientName: 'CHHAY Bopha',
        visitId: 'vis-' + Date.now(),
        diagnosisCode: 'DA00',
        diagnosisDescription: 'Acute enteritis with mild dehydration',
        items: invoiceItems,
      });

      if (res) {
        setClaimSuccessMsg(`${ins.claimSubmittedSuccess} (${res.claimNumber} - Pre-Auth: ${res.preAuthCode})`);
        fetchClaims();
        fetchNssfBatch();
        setTimeout(() => setClaimSuccessMsg(null), 6000);
      }
    } catch (err: any) {
      console.error('Failed to submit claim:', err);
    } finally {
      setSubmittingClaim(false);
    }
  };

  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      const res = await api.insurance.getClaims({
        provider: claimsFilterProvider,
        status: claimsFilterStatus,
        search: claimsSearch,
      });
      if (res && Array.isArray(res)) {
        setClaims(res);
      }
    } catch (err) {
      console.error('Failed to load claims:', err);
    } finally {
      setLoadingClaims(false);
    }
  };

  const handleConfirmSettle = async () => {
    if (!settleClaimTarget || !settlementRefInput.trim()) return;
    try {
      setSettling(true);
      const res = await api.insurance.settleClaim(settleClaimTarget.claimNumber, {
        settlementRef: settlementRefInput.trim(),
        settledAmountUsd: settledAmountInput || settleClaimTarget.insurerCoveredUsd,
      });
      if (res) {
        setSettleClaimTarget(null);
        fetchClaims();
      }
    } catch (err) {
      console.error('Failed to settle claim:', err);
    } finally {
      setSettling(false);
    }
  };

  const fetchNssfBatch = async () => {
    try {
      const res = await api.insurance.exportNssfBatch();
      if (res) {
        setNssfBatch(res);
      }
    } catch (err) {
      console.error('Failed to fetch NSSF batch:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-12">
      {/* Top Header */}
      <header className="bg-slate-800/90 border-b border-slate-700/80 px-6 py-4 sticky top-0 z-30 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {ins.title}
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                  MoH / NSSF Primary Care Tariff
                </span>
              </h1>
              <p className="text-xs text-slate-400">{ins.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 font-mono">
              {ins.nssfFacilityCode}
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300">
              USD / KHR Rate: 4,100
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-700/60">
          <button
            onClick={() => setActiveTab('VERIFY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'VERIFY'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{ins.verifyPolicyTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('SPLIT_POS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'SPLIT_POS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{ins.splitInvoiceTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'LEDGER'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{ins.claimsLedgerTab}</span>
          </button>

          <button
            onClick={() => setActiveTab('NSSF_EXPORT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'NSSF_EXPORT'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{ins.nssfExportTab}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Tab 1: Live Policy Verification */}
        {activeTab === 'VERIFY' && (
          <div className="space-y-6">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {ins.verifyPolicyTab}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-8">
                  <label className="block text-slate-300 text-xs font-semibold mb-1">
                    {ins.policyNumber}
                  </label>
                  <input
                    type="text"
                    value={policyInput}
                    onChange={(e) => setPolicyInput(e.target.value)}
                    placeholder={ins.policyNumberPlaceholder}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="md:col-span-4">
                  <button
                    onClick={() => handleVerifyPolicy(policyInput)}
                    disabled={verifying || !policyInput.trim()}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>{verifying ? t.common.loading : ins.verifyButton}</span>
                  </button>
                </div>
              </div>

              {/* Demo quick selector */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span>{isKh ? 'សាកល្បងលេខប័ណ្ណគំរូ:' : 'Try verified demo policies:'}</span>
                <button
                  onClick={() => {
                    setPolicyInput('NSSF-KH-904812');
                    handleVerifyPolicy('NSSF-KH-904812');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-200 font-mono"
                >
                  NSSF-KH-904812 (NSSF 100%)
                </button>
                <button
                  onClick={() => {
                    setPolicyInput('FORTE-MED-77102');
                    handleVerifyPolicy('FORTE-MED-77102');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-200 font-mono"
                >
                  FORTE-MED-77102 (Forte 80%)
                </button>
                <button
                  onClick={() => {
                    setPolicyInput('SNET-CAM-33491');
                    handleVerifyPolicy('SNET-CAM-33491');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-200 font-mono"
                >
                  SNET-CAM-33491 (SafetyNet 85%)
                </button>
              </div>
            </div>

            {/* Verification Result Card */}
            {verifiedPolicy && (
              <div className="bg-slate-800/80 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                        {ins.validPolicySeal}
                      </span>
                      <h3 className="text-base font-bold text-white font-mono">
                        {verifiedPolicy.policyNumber}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-xs">
                      {verifiedPolicy.coveragePercentage}% {ins.coveragePercentage}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-semibold text-xs">
                      Co-Pay: ${verifiedPolicy.coPayFixedUsd} USD
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 space-y-1">
                    <span className="text-slate-400">{ins.patient}</span>
                    <div className="font-bold text-white text-sm">{verifiedPolicy.patientName}</div>
                    <div className="text-slate-500 font-mono">{verifiedPolicy.patientId} • ID: {verifiedPolicy.patientNationalId || 'N/A'}</div>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 space-y-1">
                    <span className="text-slate-400">{ins.planName}</span>
                    <div className="font-bold text-white text-sm">{verifiedPolicy.planName}</div>
                    <div className="text-emerald-400 font-medium">{verifiedPolicy.providerDisplayName}</div>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 space-y-1">
                    <span className="text-slate-400">{ins.remainingLimit}</span>
                    <div className="font-bold text-emerald-400 text-sm font-mono">
                      ${verifiedPolicy.remainingLimitUsd.toFixed(2)} / ${verifiedPolicy.annualLimitUsd.toFixed(2)} USD
                    </div>
                    <div className="text-slate-500">{ins.policyValidity}: {verifiedPolicy.validUntil}</div>
                  </div>
                </div>

                {/* Eligible Categories */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">{ins.eligibleBenefits}:</h4>
                  <div className="flex flex-wrap gap-2">
                    {verifiedPolicy.eligibleCategories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-600"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {verificationError && (
              <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Split-Invoice Calculation & POS */}
        {activeTab === 'SPLIT_POS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Items Builder (7 cols) */}
            <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    {ins.invoiceBuilderTitle}
                  </h2>
                  <p className="text-xs text-slate-400">{ins.invoiceBuilderSubtitle}</p>
                </div>

                <select
                  value={builderPolicy}
                  onChange={(e) => {
                    setBuilderPolicy(e.target.value);
                    handleRecalculateSplit(e.target.value, invoiceItems);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                >
                  <option value="FORTE-MED-77102">FORTE-MED-77102 (Forte 80%)</option>
                  <option value="NSSF-KH-904812">NSSF-KH-904812 (NSSF 100%)</option>
                  <option value="SNET-CAM-33491">SNET-CAM-33491 (SafetyNet 85%)</option>
                  <option value="AIA-VIP-88401">AIA-VIP-88401 (AIA 90%)</option>
                </select>
              </div>

              {/* Items Table */}
              <div className="space-y-3 pt-2">
                {invoiceItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900/70 border border-slate-700/60 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs"
                  >
                    <div className="md:col-span-3">
                      <select
                        value={item.category}
                        onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px]"
                      >
                        <option value="CONSULTATION">CONSULTATION</option>
                        <option value="PHARMACY">PHARMACY</option>
                        <option value="LABORATORY">LABORATORY</option>
                        <option value="IMAGING">IMAGING</option>
                        <option value="PROCEDURE">PROCEDURE</option>
                      </select>
                    </div>

                    <div className="md:col-span-5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <input
                        type="number"
                        value={item.unitPriceUsd}
                        onChange={(e) => handleItemChange(idx, 'unitPriceUsd', Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-[11px] font-mono"
                      />
                    </div>

                    <div className="md:col-span-1 text-center font-bold text-white font-mono">
                      ${(item.unitPriceUsd * item.quantity).toFixed(2)}
                    </div>

                    <div className="md:col-span-1 text-right">
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddItem}
                className="w-full py-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600/60 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{ins.addItemButton}</span>
              </button>
            </div>

            {/* Right Column: Split Settlement Summary (5 cols) */}
            <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-400" />
                {isKh ? 'លទ្ធផលបំបែកការទូទាត់' : 'Split-Invoice Calculation'}
              </h3>

              {splitResult ? (
                <div className="space-y-4 text-xs">
                  {/* Gross Invoice */}
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-700/60 flex items-center justify-between">
                    <span className="text-slate-400">{ins.summaryTotalInvoice}</span>
                    <span className="font-bold text-base text-white font-mono">
                      ${splitResult.totalInvoiceUsd.toFixed(2)} USD
                    </span>
                  </div>

                  {/* Insurer Direct Payment */}
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-emerald-300 font-semibold block">{ins.summaryInsurerPayable}</span>
                      <span className="text-[10px] text-emerald-400/80">Direct Electronic Claim</span>
                    </div>
                    <span className="font-bold text-lg text-emerald-300 font-mono">
                      ${splitResult.insurerPayableUsd.toFixed(2)} USD
                    </span>
                  </div>

                  {/* Patient Out-of-Pocket Payment (KHQR) */}
                  <div className="p-3 bg-blue-950/60 border border-blue-500/40 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-blue-300 font-semibold block">{ins.summaryPatientPayable}</span>
                      <span className="text-[10px] text-blue-400/80">Payable via Dynamic KHQR</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-blue-300 font-mono">
                        ${splitResult.patientPayableUsd.toFixed(2)} USD
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ≈ {(splitResult.patientPayableUsd * 4100).toLocaleString()} KHR
                      </div>
                    </div>
                  </div>

                  {splitResult.coPayAppliedUsd > 0 && (
                    <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                      <span>{ins.summaryCoPayApplied}:</span>
                      <span className="font-mono text-slate-200">${splitResult.coPayAppliedUsd.toFixed(2)} USD</span>
                    </div>
                  )}

                  {/* Submit Claim Action */}
                  {claimSuccessMsg && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{claimSuccessMsg}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitClaim}
                    disabled={submittingClaim || splitResult.totalInvoiceUsd === 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submittingClaim ? ins.submittingClaim : ins.submitClaimButton}</span>
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">{t.common.loading}</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Claims Adjudication Ledger */}
        {activeTab === 'LEDGER' && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <select
                  value={claimsFilterProvider}
                  onChange={(e) => {
                    setClaimsFilterProvider(e.target.value);
                    fetchClaims();
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="ALL">{ins.providerAll}</option>
                  <option value="NSSF_CAMBODIA">NSSF Cambodia</option>
                  <option value="FORTE_INSURANCE">Forte Insurance</option>
                  <option value="SAFETYNET">SafetyNet</option>
                  <option value="AIA_CAMBODIA">AIA Cambodia</option>
                </select>

                <select
                  value={claimsFilterStatus}
                  onChange={(e) => {
                    setClaimsFilterStatus(e.target.value);
                    fetchClaims();
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="ALL">{ins.claimStatus}: All</option>
                  <option value="SUBMITTED">{ins.claimStatusSubmitted}</option>
                  <option value="PRE_AUTHORIZED">{ins.claimStatusPreAuth}</option>
                  <option value="SETTLED">{ins.claimStatusSettled}</option>
                  <option value="REJECTED">{ins.claimStatusRejected}</option>
                </select>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isKh ? 'ស្វែងរកសំណង...' : 'Search claim #, patient...'}
                  value={claimsSearch}
                  onChange={(e) => setClaimsSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchClaims()}
                  className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white w-56 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Claims Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">{ins.claimNumber}</th>
                    <th className="py-3 px-4">{ins.patient}</th>
                    <th className="py-3 px-4">{ins.diagnosisCode}</th>
                    <th className="py-3 px-4">{ins.summaryTotalInvoice}</th>
                    <th className="py-3 px-4">{ins.summaryInsurerPayable}</th>
                    <th className="py-3 px-4">{ins.claimStatus}</th>
                    <th className="py-3 px-4 text-right">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        {isKh ? 'គ្មានទិន្នន័យសំណង' : 'No claims found.'}
                      </td>
                    </tr>
                  ) : (
                    claims.map((c) => (
                      <tr key={c.claimNumber} className="hover:bg-slate-750 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {c.claimNumber}
                          <div className="text-[10px] text-slate-500 font-sans">{c.provider}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{c.patientName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{c.policyNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-cyan-400">{c.diagnosisCode}</span>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.diagnosisDescription}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          ${c.totalClaimUsd.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          ${c.insurerCoveredUsd.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'SETTLED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : c.status === 'PRE_AUTHORIZED'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {c.status !== 'SETTLED' ? (
                            <button
                              onClick={() => {
                                setSettleClaimTarget(c);
                                setSettlementRefInput(`EFT-${Date.now().toString().slice(-6)}`);
                                setSettledAmountInput(c.insurerCoveredUsd);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                            >
                              {ins.markSettledButton}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: MoH NSSF Batch Export */}
        {activeTab === 'NSSF_EXPORT' && nssfBatch && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  {ins.nssfBatchExportTitle}
                </h2>
                <p className="text-xs text-slate-400">{ins.nssfFacilityCode}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Downloaded MoH NSSF JSON Payload')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{ins.nssfDownloadJson}</span>
                </button>
                <button
                  onClick={() => alert('Downloaded MoH Audit CSV')}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{ins.nssfDownloadCsv}</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50 space-y-1">
                <span className="text-slate-400">{ins.nssfTotalClaims}</span>
                <div className="text-2xl font-bold text-white font-mono">{nssfBatch.totalClaims}</div>
                <div className="text-[10px] text-slate-500 font-mono">Batch: {nssfBatch.batchNumber}</div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50 space-y-1">
                <span className="text-slate-400">{ins.nssfTotalAmountUsd}</span>
                <div className="text-2xl font-bold text-emerald-400 font-mono">${nssfBatch.totalAmountUsd.toFixed(2)} USD</div>
                <div className="text-[10px] text-slate-500">Authorized primary care tariff</div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/50 space-y-1">
                <span className="text-slate-400">{ins.nssfTotalAmountKhr}</span>
                <div className="text-2xl font-bold text-cyan-400 font-mono">{nssfBatch.totalAmountKhr.toLocaleString()} KHR</div>
                <div className="text-[10px] text-slate-500">Official NBC conversion (4,100 KHR / USD)</div>
              </div>
            </div>

            {/* Batch items list */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">{ins.claimNumber}</th>
                    <th className="py-2.5 px-3">{ins.patient}</th>
                    <th className="py-2.5 px-3">{ins.nationalId}</th>
                    <th className="py-2.5 px-3">{ins.diagnosisCode}</th>
                    <th className="py-2.5 px-3 text-right">Reimbursement (USD)</th>
                    <th className="py-2.5 px-3 text-right">Reimbursement (KHR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {nssfBatch.claims.map((item: any) => (
                    <tr key={item.claimNumber} className="hover:bg-slate-750 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">{item.claimNumber}</td>
                      <td className="py-2.5 px-3 text-white">{item.patientName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{item.patientNationalId}</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400">{item.diagnosisIcd11}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400 text-right">${item.reimbursementUsd.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-400 text-right">{item.reimbursementKhr.toLocaleString()} KHR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Settlement Modal */}
      {settleClaimTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {ins.settleModalTitle}
              </h3>
              <button
                onClick={() => setSettleClaimTarget(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">{ins.claimNumber}:</span>
                <span className="font-mono text-white font-bold">{settleClaimTarget.claimNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{ins.patient}:</span>
                <span className="text-white font-semibold">{settleClaimTarget.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{ins.summaryInsurerPayable}:</span>
                <span className="font-mono text-emerald-400 font-bold">${settleClaimTarget.insurerCoveredUsd.toFixed(2)} USD</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {ins.settlementReference}
              </label>
              <input
                type="text"
                value={settlementRefInput}
                onChange={(e) => setSettlementRefInput(e.target.value)}
                placeholder="e.g. EFT-2026-904821"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {ins.settledAmountUsd}
              </label>
              <input
                type="number"
                value={settledAmountInput}
                onChange={(e) => setSettledAmountInput(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                onClick={() => setSettleClaimTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmSettle}
                disabled={settling || !settlementRefInput.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold"
              >
                {settling ? t.common.loading : ins.markSettledButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
