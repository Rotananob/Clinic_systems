'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import {
  FlaskConical,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HeartCrack,
  Activity,
  Calculator,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';

interface BsaData {
  heightCm: number;
  weightKg: number;
  mostellerBsa: number;
  duboisBsa: number;
  haycockBsa: number;
  clinicalDosingBsa: number;
  isCappedAt2_0: boolean;
}

interface CalvertData {
  targetAuc: number;
  measuredGfr: number;
  cappedGfr: number;
  calculatedCarboplatinDoseMg: number;
  isGfrCapped: boolean;
  maximumRecommendedDoseMg: number;
  clinicalRationaleEn: string;
  clinicalRationaleKm: string;
}

interface AnthraData {
  currentLifetimeCumulativeDoseMgM2: number;
  lifetimeCeilingMgM2: number;
  percentOfLifetimeCeiling: number;
  proposedDoseMgM2: number;
  projectedCumulativeDoseMgM2: number;
  status: 'SAFE_RANGE' | 'CARDIOTOXICITY_WARNING' | 'HARD_CARDIOTOXICITY_BLOCK';
  actionEn: string;
  actionKm: string;
}

interface LabGateData {
  absoluteNeutrophilCount: number;
  platelets: number;
  totalBilirubinMgDl: number;
  astAltUlnRatio: number;
  crCl: number;
  overallStatus: 'PROCEED' | 'DOSE_REDUCTION_RECOMMENDED' | 'CHEMOTHERAPY_HOLD';
  violations: string[];
  recommendationEn: string;
  recommendationKm: string;
  doseAdjustmentFactor: number;
}

export default function ChemoOncologyPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'BSA_CALVERT' | 'ANTHRACYCLINE' | 'LAB_GATE' | 'REGIMENS'>('BSA_CALVERT');

  // BSA & Calvert State
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [capBsa, setCapBsa] = useState<boolean>(true);
  const [targetAuc, setTargetAuc] = useState<number>(5.0);
  const [measuredGfr, setMeasuredGfr] = useState<number>(85);

  const [bsaResult, setBsaResult] = useState<BsaData | null>(null);
  const [calvertResult, setCalvertResult] = useState<CalvertData | null>(null);

  // Anthracycline State
  const [cumulativeAnthra, setCumulativeAnthra] = useState<number>(250);
  const [proposedAnthra, setProposedAnthra] = useState<number>(50);
  const [selectedAgent, setSelectedAgent] = useState<string>('DOXORUBICIN');
  const [anthraResult, setAnthraResult] = useState<AnthraData | null>(null);

  // Lab Safety Gate State
  const [wbc, setWbc] = useState<number>(4500);
  const [neutrophilsPct, setNeutrophilsPct] = useState<number>(55);
  const [bandsPct, setBandsPct] = useState<number>(3);
  const [platelets, setPlatelets] = useState<number>(165000);
  const [bilirubin, setBilirubin] = useState<number>(0.9);
  const [crClVal, setCrClVal] = useState<number>(80);
  const [labResult, setLabResult] = useState<LabGateData | null>(null);

  useEffect(() => {
    runBsaAndCalvert();
    runAnthraCalculation();
    runLabGateCalculation();
  }, [heightCm, weightKg, capBsa, targetAuc, measuredGfr, cumulativeAnthra, proposedAnthra, selectedAgent, wbc, neutrophilsPct, bandsPct, platelets, bilirubin, crClVal]);

  const runBsaAndCalvert = () => {
    const validH = Math.max(10, heightCm);
    const validW = Math.max(1, weightKg);

    const mostellerRaw = Math.sqrt((validH * validW) / 3600);
    const mosteller = Math.round(mostellerRaw * 100) / 100;
    const dubois = Math.round(0.007184 * Math.pow(validH, 0.725) * Math.pow(validW, 0.425) * 100) / 100;
    const haycock = Math.round(0.024265 * Math.pow(validH, 0.3964) * Math.pow(validW, 0.5378) * 100) / 100;

    let clinicalBsa = mosteller;
    let isCapped = false;
    if (capBsa && clinicalBsa > 2.0) {
      clinicalBsa = 2.0;
      isCapped = true;
    }

    setBsaResult({
      heightCm: validH,
      weightKg: validW,
      mostellerBsa: mosteller,
      duboisBsa: dubois,
      haycockBsa: haycock,
      clinicalDosingBsa: clinicalBsa,
      isCappedAt2_0: isCapped,
    });

    const GFR_CAP = 125;
    const isGfrCapped = measuredGfr > GFR_CAP;
    const cappedGfr = isGfrCapped ? GFR_CAP : measuredGfr;
    const dose = Math.round(targetAuc * (cappedGfr + 25));
    const maxDose = Math.round(targetAuc * (GFR_CAP + 25));

    setCalvertResult({
      targetAuc,
      measuredGfr,
      cappedGfr,
      calculatedCarboplatinDoseMg: dose,
      isGfrCapped,
      maximumRecommendedDoseMg: maxDose,
      clinicalRationaleEn: isGfrCapped
        ? `Measured GFR of ${measuredGfr} mL/min was clamped at ASCO ceiling of 125 mL/min to prevent toxic myelosuppression.`
        : `Carboplatin Calvert dose calculated at ${dose} mg based on GFR ${cappedGfr} mL/min and Target AUC ${targetAuc}.`,
      clinicalRationaleKm: isGfrCapped
        ? `កម្រិត GFR ត្រូវបានកែតម្រូវមកត្រឹម ១២៥ mL/min តាមស្តង់ដារ ASCO ដើម្បីការពារការធ្លាក់ចុះផ្លាកែតធ្ងន់ធ្ងរ`
        : `កម្រិតថ្នាំ Carboplatin ចំនួន ${dose} mg ត្រូវបានគណនាយ៉ាងត្រឹមត្រូវតាម Target AUC ${targetAuc} និងកម្រិតតម្រងនោម GFR ${cappedGfr} mL/min`,
    });
  };

  const runAnthraCalculation = () => {
    const factors: Record<string, number> = {
      DOXORUBICIN: 1.0,
      DAUNORUBICIN: 0.5,
      EPIRUBICIN: 0.6,
      IDARUBICIN: 5.0,
    };
    const factor = factors[selectedAgent] || 1.0;
    const newEquiv = proposedAnthra * factor;
    const projected = Math.round((cumulativeAnthra + newEquiv) * 10) / 10;
    const ceiling = 450;
    const pct = Math.round((projected / ceiling) * 100 * 10) / 10;

    let status: AnthraData['status'] = 'SAFE_RANGE';
    let actionEn = '';
    let actionKm = '';

    if (projected >= ceiling) {
      status = 'HARD_CARDIOTOXICITY_BLOCK';
      actionEn = `Lifetime ceiling of ${ceiling} mg/m2 reached (${projected} mg/m2). Dispensing blocked due to extreme irreversible cardiomyopathy risk.`;
      actionKm = `កម្រិតប្រមូលផ្តុំអតិបរមាពេញមួយជីវិតនៃថ្នាំ Anthracycline ${ceiling} mg/m2 ត្រូវបានឆ្លងកាត់ ប្រព័ន្ធបានចាក់សោសុវត្ថិភាពមិនឱ្យបញ្ចេញថ្នាំឡើយ`;
    } else if (projected >= ceiling * 0.8) {
      status = 'CARDIOTOXICITY_WARNING';
      actionEn = `Approaching lifetime ceiling (${pct}% of limit). Mandatory echocardiogram LVEF > 50% and dexrazoxane cardioprotectant recommended.`;
      actionKm = `កម្រិតថ្នាំគីមី Anthracycline កំពុងខិតជិតដល់កម្រិតគ្រោះថ្នាក់អតិបរមា ${pct} ភាគរយ តម្រូវឱ្យធ្វើតេស្តអេកូបេះដូង LVEF លើស ៥០ ភាគរយ`;
    } else {
      status = 'SAFE_RANGE';
      actionEn = `Cumulative exposure within safe therapeutic window (${pct}% of lifetime limit).`;
      actionKm = `កម្រិតថ្នាំគីមី Anthracycline សរុបស្ថិតក្នុងដែនកំណត់សុវត្ថិភាពធម្មតា ${pct} ភាគរយ`;
    }

    setAnthraResult({
      currentLifetimeCumulativeDoseMgM2: cumulativeAnthra,
      lifetimeCeilingMgM2: ceiling,
      percentOfLifetimeCeiling: pct,
      proposedDoseMgM2: proposedAnthra,
      projectedCumulativeDoseMgM2: projected,
      status,
      actionEn,
      actionKm,
    });
  };

  const runLabGateCalculation = () => {
    const anc = Math.round(wbc * ((neutrophilsPct + bandsPct) / 100));
    const violations: string[] = [];
    let factor = 1.0;

    if (anc < 1500) {
      violations.push(`ANC ${anc}/uL is below 1,500/uL`);
    }
    if (platelets < 100000) {
      violations.push(`Platelets ${platelets}/uL below 100,000/uL`);
    }

    if (violations.length > 0) {
      setLabResult({
        absoluteNeutrophilCount: anc,
        platelets,
        totalBilirubinMgDl: bilirubin,
        astAltUlnRatio: 1.0,
        crCl: crClVal,
        overallStatus: 'CHEMOTHERAPY_HOLD',
        violations,
        recommendationEn: `CHEMOTHERAPY HOLD. Hematologic toxicity detected: ${violations.join(', ')}.`,
        recommendationKm: `ផ្អាកការផ្តល់ថ្នាំគីមីបណ្តោះអាសន្ន ដោយសារគ្រាប់ឈាមស ឬផ្លាកែតធ្លាក់ចុះទាបជាងកម្រិតសុវត្ថិភាព`,
        doseAdjustmentFactor: 0.0,
      });
      return;
    }

    if (bilirubin > 1.8) {
      factor = 0.50;
      violations.push(`Elevated bilirubin ${bilirubin} mg/dL indicates hepatic impairment`);
      setLabResult({
        absoluteNeutrophilCount: anc,
        platelets,
        totalBilirubinMgDl: bilirubin,
        astAltUlnRatio: 1.0,
        crCl: crClVal,
        overallStatus: 'DOSE_REDUCTION_RECOMMENDED',
        violations,
        recommendationEn: 'DOSE REDUCTION RECOMMENDED. Administer 50% of nominal protocol dose due to hepatic impairment.',
        recommendationKm: 'ណែនាំឱ្យបន្ថយកម្រិតថ្នាំគីមីមកត្រឹម ៥០ ភាគរយ ដោយសារមុខងារថ្លើមមានការចុះខ្សោយ',
        doseAdjustmentFactor: factor,
      });
      return;
    }

    if (crClVal < 50) {
      factor = 0.75;
      violations.push(`CrCl ${crClVal} mL/min indicates renal impairment`);
      setLabResult({
        absoluteNeutrophilCount: anc,
        platelets,
        totalBilirubinMgDl: bilirubin,
        astAltUlnRatio: 1.0,
        crCl: crClVal,
        overallStatus: 'DOSE_REDUCTION_RECOMMENDED',
        violations,
        recommendationEn: 'DOSE REDUCTION RECOMMENDED. Administer 75% of nominal dose due to renal clearance impairment.',
        recommendationKm: 'ណែនាំឱ្យបន្ថយកម្រិតថ្នាំគីមីមកត្រឹម ៧៥ ភាគរយ ដោយសារកម្រិតបន្សុទ្ធតម្រងនោម CrCl ទាបជាង ៥០ mL/min',
        doseAdjustmentFactor: factor,
      });
      return;
    }

    setLabResult({
      absoluteNeutrophilCount: anc,
      platelets,
      totalBilirubinMgDl: bilirubin,
      astAltUlnRatio: 1.0,
      crCl: crClVal,
      overallStatus: 'PROCEED',
      violations: [],
      recommendationEn: 'All hematologic, hepatic, and renal laboratory parameters meet full ASCO/NCCN thresholds. Proceed with full protocol dose.',
      recommendationKm: 'លទ្ធផលតេស្តឈាម មុខងារថ្លើម និងតម្រងនោម ឆ្លើយតបតាមស្តង់ដារសុវត្ថិភាពពេញលេញ អាចបន្តផ្តល់ថ្នាំគីមីតាមកម្រិតស្តង់ដារបាន',
      doseAdjustmentFactor: 1.0,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t.chemo.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{t.chemo.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('BSA_CALVERT')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'BSA_CALVERT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.chemo.tabBsaCalvert}
          </button>
          <button
            onClick={() => setActiveTab('ANTHRACYCLINE')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'ANTHRACYCLINE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.chemo.tabAnthra}
          </button>
          <button
            onClick={() => setActiveTab('LAB_GATE')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'LAB_GATE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.chemo.tabLabGate}
          </button>
          <button
            onClick={() => setActiveTab('REGIMENS')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'REGIMENS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.chemo.tabRegimens}
          </button>
        </div>
      </div>

      {/* Tab 1: BSA & Calvert Calculator */}
      {activeTab === 'BSA_CALVERT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* BSA Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {locale === 'km' ? 'ការគណនាផ្ទៃក្រឡារាងកាយ BSA' : 'Body Surface Area (BSA) Calculator'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.heightCm}</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.weightKg}</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="capCheck"
                checked={capBsa}
                onChange={(e) => setCapBsa(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="capCheck" className="text-xs font-medium text-slate-700">
                {t.chemo.capBsa2_0}
              </label>
            </div>

            {bsaResult && (
              <div className="space-y-3 pt-2">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-indigo-800 block">{t.chemo.clinicalDosingBsa}</span>
                    <span className="text-2xl font-bold text-indigo-900">{bsaResult.clinicalDosingBsa} m&sup2;</span>
                  </div>
                  {bsaResult.isCappedAt2_0 && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded">
                      Capped at 2.0 m&sup2;
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">{t.chemo.mostellerBsa}</span>
                    <span className="font-bold text-slate-800">{bsaResult.mostellerBsa} m&sup2;</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">{t.chemo.duboisBsa}</span>
                    <span className="font-bold text-slate-800">{bsaResult.duboisBsa} m&sup2;</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">{t.chemo.haycockBsa}</span>
                    <span className="font-bold text-slate-800">{bsaResult.haycockBsa} m&sup2;</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calvert Carboplatin Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {locale === 'km' ? 'កម្រិត Carboplatin តាមរូបមន្ត Calvert' : 'Carboplatin Calvert Dosing'}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.targetAuc}</label>
                <input
                  type="number"
                  step="0.5"
                  value={targetAuc}
                  onChange={(e) => setTargetAuc(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.measuredGfr}</label>
                <input
                  type="number"
                  value={measuredGfr}
                  onChange={(e) => setMeasuredGfr(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {t.chemo.gfrCapNotice}
            </p>

            {calvertResult && (
              <div className="space-y-3 pt-2">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-emerald-800 block">{t.chemo.carboplatinDose}</span>
                    <span className="text-2xl font-bold text-emerald-900">
                      {calvertResult.calculatedCarboplatinDoseMg} mg
                    </span>
                  </div>
                  {calvertResult.isGfrCapped && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded">
                      GFR Capped at 125 mL/min
                    </span>
                  )}
                </div>

                <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 leading-relaxed">
                  {locale === 'km' ? calvertResult.clinicalRationaleKm : calvertResult.clinicalRationaleEn}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Anthracycline Cardiotoxicity */}
      {activeTab === 'ANTHRACYCLINE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{t.chemo.tabAnthra}</h2>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.selectAnthracycline}</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                <option value="DOXORUBICIN">Doxorubicin (Adriamycin)</option>
                <option value="EPIRUBICIN">Epirubicin</option>
                <option value="DAUNORUBICIN">Daunorubicin</option>
                <option value="IDARUBICIN">Idarubicin</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.cumulativeDoxorubicin}</label>
              <input
                type="number"
                value={cumulativeAnthra}
                onChange={(e) => setCumulativeAnthra(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.proposedCycleDose}</label>
              <input
                type="number"
                value={proposedAnthra}
                onChange={(e) => setProposedAnthra(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
              {t.chemo.lifetimeCeiling}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {locale === 'km' ? 'ការវិភាគកម្រិតពុលបេះដូង និងដែនកំណត់សុវត្ថិភាព' : 'Cardiotoxicity Exposure Assessment'}
            </h2>
            {anthraResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">{t.chemo.projectedTotal}</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {anthraResult.projectedCumulativeDoseMgM2} mg/m&sup2;
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Ceiling: 450 mg/m&sup2;</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">{t.chemo.percentCeiling}</span>
                    <span className={`text-2xl font-bold ${
                      anthraResult.status === 'HARD_CARDIOTOXICITY_BLOCK'
                        ? 'text-rose-600'
                        : anthraResult.status === 'CARDIOTOXICITY_WARNING'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}>
                      {anthraResult.percentOfLifetimeCeiling}%
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Critical limit: 100%</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${
                  anthraResult.status === 'HARD_CARDIOTOXICITY_BLOCK'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : anthraResult.status === 'CARDIOTOXICITY_WARNING'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {anthraResult.status === 'HARD_CARDIOTOXICITY_BLOCK' ? (
                      <HeartCrack className="w-5 h-5 text-rose-600" />
                    ) : anthraResult.status === 'CARDIOTOXICITY_WARNING' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    <span>
                      {anthraResult.status === 'HARD_CARDIOTOXICITY_BLOCK'
                        ? t.chemo.statusBlock
                        : anthraResult.status === 'CARDIOTOXICITY_WARNING'
                        ? t.chemo.statusWarning
                        : t.chemo.statusSafe}
                    </span>
                  </div>
                  <p className="text-xs mt-2 leading-relaxed">
                    {locale === 'km' ? anthraResult.actionKm : anthraResult.actionEn}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Lab Safety Gate */}
      {activeTab === 'LAB_GATE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{t.chemo.tabLabGate}</h2>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.wbcCount}</label>
              <input
                type="number"
                value={wbc}
                onChange={(e) => setWbc(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.neutrophilsPct}</label>
                <input
                  type="number"
                  value={neutrophilsPct}
                  onChange={(e) => setNeutrophilsPct(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.bandsPct}</label>
                <input
                  type="number"
                  value={bandsPct}
                  onChange={(e) => setBandsPct(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.plateletCount}</label>
              <input
                type="number"
                value={platelets}
                onChange={(e) => setPlatelets(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.totalBilirubin}</label>
              <input
                type="number"
                step="0.1"
                value={bilirubin}
                onChange={(e) => setBilirubin(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.chemo.creatinineClearance}</label>
              <input
                type="number"
                value={crClVal}
                onChange={(e) => setCrClVal(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {locale === 'km' ? 'លទ្ធផលផ្ទៀងផ្ទាត់សុវត្ថិភាព ASCO & NCCN' : 'ASCO & NCCN Gate Verification'}
            </h2>
            {labResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">{t.chemo.computedAnc}</span>
                    <span className={`text-2xl font-bold ${labResult.absoluteNeutrophilCount < 1500 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {labResult.absoluteNeutrophilCount} /uL
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Threshold: &ge; 1,500 /uL</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">{t.chemo.plateletCount}</span>
                    <span className={`text-2xl font-bold ${labResult.platelets < 100000 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {labResult.platelets} /uL
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Threshold: &ge; 100,000 /uL</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${
                  labResult.overallStatus === 'CHEMOTHERAPY_HOLD'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : labResult.overallStatus === 'DOSE_REDUCTION_RECOMMENDED'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {labResult.overallStatus === 'CHEMOTHERAPY_HOLD' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    ) : labResult.overallStatus === 'DOSE_REDUCTION_RECOMMENDED' ? (
                      <Info className="w-5 h-5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    <span>
                      {labResult.overallStatus === 'CHEMOTHERAPY_HOLD'
                        ? t.chemo.gateHold
                        : labResult.overallStatus === 'DOSE_REDUCTION_RECOMMENDED'
                        ? t.chemo.gateReduction
                        : t.chemo.gateProceed}
                    </span>
                  </div>
                  <p className="text-xs mt-2 leading-relaxed">
                    {locale === 'km' ? labResult.recommendationKm : labResult.recommendationEn}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Master Regimens */}
      {activeTab === 'REGIMENS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Colorectal Cancer</span>
            <h3 className="text-base font-bold text-slate-900">mFOLFOX6</h3>
            <p className="text-xs text-slate-500">Oxaliplatin, Leucovorin, 5-FU Bolus + 46h Continuous Infusion</p>
            <div className="border-t border-slate-100 pt-2 text-xs space-y-1 text-slate-600">
              <div>&bull; Oxaliplatin 85 mg/m&sup2; Day 1</div>
              <div>&bull; Leucovorin 400 mg/m&sup2; Day 1</div>
              <div>&bull; 5-FU 400 mg/m&sup2; Bolus + 2400 mg/m&sup2; 46h infusion</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Lymphoma (DLBCL)</span>
            <h3 className="text-base font-bold text-slate-900">R-CHOP</h3>
            <p className="text-xs text-slate-500">Rituximab, Cyclophosphamide, Doxorubicin, Vincristine, Prednisone</p>
            <div className="border-t border-slate-100 pt-2 text-xs space-y-1 text-slate-600">
              <div>&bull; Rituximab 375 mg/m&sup2; Day 1</div>
              <div>&bull; Cyclophosphamide 750 mg/m&sup2; Day 1</div>
              <div>&bull; Doxorubicin 50 mg/m&sup2; Day 1 (Cardiotoxicity check)</div>
              <div>&bull; Vincristine 1.4 mg/m&sup2; (Hard Capped at 2.0 mg)</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Lung & Ovarian Cancer</span>
            <h3 className="text-base font-bold text-slate-900">Carboplatin + Paclitaxel</h3>
            <p className="text-xs text-slate-500">Paclitaxel 175 mg/m&sup2; + Carboplatin AUC 5-6 (Calvert Dosing)</p>
            <div className="border-t border-slate-100 pt-2 text-xs space-y-1 text-slate-600">
              <div>&bull; Paclitaxel 175 mg/m&sup2; IV over 3 hours</div>
              <div>&bull; Carboplatin Target AUC 5-6 (GFR Capped at 125 mL/min)</div>
              <div>&bull; Pre-medication: Dexamethasone + Diphenhydramine</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
