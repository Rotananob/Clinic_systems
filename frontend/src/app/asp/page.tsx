'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  FileText,
  Clock,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MetricSummary {
  patientDays: number;
  totalDaysOfTherapy: number;
  totalLengthOfTherapy: number;
  dotPer1000PatientDays: number;
  lotPer1000PatientDays: number;
  agentDotBreakdown: Record<string, number>;
}

interface SaarData {
  observedDot: number;
  predictedDot: number;
  saarRatio: number;
  category: 'OPTIMAL' | 'BENCHMARK' | 'HIGH_CONSUMPTION' | 'CRITICAL_OVERUTILIZATION';
  clinicalInterpretationEn: string;
  clinicalInterpretationKm: string;
}

interface PctKinetics {
  baselinePct: number;
  currentPct: number;
  deltaPctPercent: number;
  recommendation: 'STRONG_CESSATION_RECOMMENDED' | 'CONSIDER_CESSATION' | 'CONTINUE_ANTIBIOTICS' | 'TREATMENT_FAILURE_OR_RESISTANCE_RISK';
  rationaleEn: string;
  rationaleKm: string;
}

interface StepDownResult {
  agentName: string;
  recommendedOralDrug: string;
  recommendedOralDose: string;
  bioavailabilityPercent: number;
  isCandidate: boolean;
  criteriaMet: {
    afebrileAtLeast24h: boolean;
    hemodynamicallyStable: boolean;
    wbcImproving: boolean;
    functionalGiTract: boolean;
    daysOnIvAtLeast48h: boolean;
  };
  clinicalRecommendationEn: string;
  clinicalRecommendationKm: string;
}

interface MismatchResult {
  isMismatch: boolean;
  pathogenName: string;
  antibioticName: string;
  mismatchType: string;
  warningEn: string;
  warningKm: string;
  recommendedAlternativeEn: string;
  recommendedAlternativeKm: string;
}

export default function AspPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'SURVEILLANCE' | 'KINETICS' | 'STEP_DOWN' | 'MISMATCH' | 'ANTIBIOGRAM'>('SURVEILLANCE');

  // Surveillance state
  const [unitFilter, setUnitFilter] = useState<'ALL' | 'ICU' | 'GENERAL_WARD'>('ALL');
  const [patientDays, setPatientDays] = useState<number>(100);
  const [predictedDot, setPredictedDot] = useState<number>(60);
  const [observedDot, setObservedDot] = useState<number>(85);
  const [totalLot, setTotalLot] = useState<number>(52);

  // Procalcitonin calculator state
  const [baselinePct, setBaselinePct] = useState<number>(4.5);
  const [currentPct, setCurrentPct] = useState<number>(0.6);
  const [afebrileHours, setAfebrileHours] = useState<number>(36);
  const [mapVal, setMapVal] = useState<number>(76);
  const [pctResult, setPctResult] = useState<PctKinetics | null>(null);

  // Step-down validator state
  const [stepdownAgent, setStepdownAgent] = useState<string>('CIPROFLOXACIN_IV');
  const [daysOnIv, setDaysOnIv] = useState<number>(3);
  const [stepdownAfebrile, setStepdownAfebrile] = useState<number>(36);
  const [stepdownMap, setStepdownMap] = useState<number>(75);
  const [stepdownWbc, setStepdownWbc] = useState<number>(7200);
  const [gutFunctional, setGutFunctional] = useState<boolean>(true);
  const [stepdownResult, setStepdownResult] = useState<StepDownResult | null>(null);

  // Mismatch guard state
  const [selectedPathogen, setSelectedPathogen] = useState<string>('PSEUDOMONAS_AERUGINOSA');
  const [selectedAntibiotic, setSelectedAntibiotic] = useState<string>('CEFTRIAXONE');
  const [mismatchResult, setMismatchResult] = useState<MismatchResult | null>(null);

  // Initial calculations
  useEffect(() => {
    handleEvaluatePct();
    handleEvaluateStepDown();
    handleCheckMismatch();
  }, []);

  const handleEvaluatePct = () => {
    let delta = 0;
    if (baselinePct > 0) {
      delta = Math.round(((baselinePct - currentPct) / baselinePct) * 100 * 10) / 10;
    }

    const afebrile = afebrileHours >= 24;
    const stable = mapVal >= 65;

    let rec: PctKinetics['recommendation'] = 'CONTINUE_ANTIBIOTICS';
    let rationaleEn = '';
    let rationaleKm = '';

    if (currentPct < 0.25 || delta >= 80) {
      if (afebrile && stable) {
        rec = 'STRONG_CESSATION_RECOMMENDED';
        rationaleEn = 'Procalcitonin declined by at least 80% or reached under 0.25 mcg/L with hemodynamic stability and no fever for 24 hours. Discontinuation of empiric antibiotics is strongly advised.';
        rationaleKm = 'កម្រិត Procalcitonin បានធ្លាក់ចុះលើសពី ៨០ ភាគរយ ឬទាបជាង ០.២៥ mcg/L រួមជាមួយសម្ពាធឈាមថេរ និងគ្មានគ្រុនក្តៅលើស ២៤ ម៉ោង ផ្ដល់អនុសាសន៍យ៉ាងម៉ឺងម៉ាត់ឱ្យបញ្ឈប់ថ្នាំអង់ទីប៊ីយ៉ូទិក';
      } else {
        rec = 'CONSIDER_CESSATION';
        rationaleEn = 'Biochemical resolution evident with PCT drop over 80%, but patient still requires continuous hemodynamic or temperature monitoring prior to full antibiotic cessation.';
        rationaleKm = 'កម្រិត PCT ធ្លាក់ចុះលើស ៨០ ភាគរយល្អ ប៉ុន្តែអ្នកជំងឺនៅត្រូវការតាមដានសម្ពាធឈាម និងកម្តៅបន្ថែមមុននឹងបញ្ឈប់ថ្នាំទាំងស្រុង';
      }
    } else if (currentPct >= baselinePct) {
      rec = 'TREATMENT_FAILURE_OR_RESISTANCE_RISK';
      rationaleEn = 'Procalcitonin levels remain persistently elevated or have risen, indicating possible uncontrolled infectious focus, resistant pathogen, or therapeutic failure.';
      rationaleKm = 'កម្រិត Procalcitonin នៅតែខ្ពស់ឬបន្តកើនឡើង បង្ហាញពីលទ្ធភាពនៃការឆ្លងរោគមិនទាន់គ្រប់គ្រងបាន មេរោគស៊ាំថ្នាំ ឬការព្យាបាលមិនមានប្រសិទ្ធភាព';
    } else {
      rec = 'CONTINUE_ANTIBIOTICS';
      rationaleEn = 'Procalcitonin shows partial decline but has not yet met the 80% resolution threshold. Continue current antimicrobial regimen with reassessment in 24 to 48 hours.';
      rationaleKm = 'កម្រិត Procalcitonin ធ្លាក់ចុះបានខ្លះតែមិនទាន់ដល់កម្រិត ៨០ ភាគរយឡើយ គួរតែបន្តថ្នាំបច្ចុប្បន្ន និងវាយតម្លៃឡើងវិញក្នុងរយៈពេល ២៤ ទៅ ៤៨ ម៉ោង';
    }

    setPctResult({
      baselinePct,
      currentPct,
      deltaPctPercent: delta,
      recommendation: rec,
      rationaleEn,
      rationaleKm,
    });
  };

  const handleEvaluateStepDown = () => {
    const oralEquivalents: Record<string, { drug: string; dose: string; bioavail: number }> = {
      CIPROFLOXACIN_IV: { drug: 'Ciprofloxacin Tablets', dose: '750 mg PO q12h', bioavail: 80 },
      LEVOFLOXACIN_IV: { drug: 'Levofloxacin Tablets', dose: '750 mg PO q24h', bioavail: 99 },
      LINEZOLID_IV: { drug: 'Linezolid Tablets', dose: '600 mg PO q12h', bioavail: 100 },
      METRONIDAZOLE_IV: { drug: 'Metronidazole Tablets', dose: '500 mg PO q8h', bioavail: 100 },
      FLUCONAZOLE_IV: { drug: 'Fluconazole Tablets', dose: '400 mg PO q24h', bioavail: 95 },
    };

    const eq = oralEquivalents[stepdownAgent] || { drug: 'Standard oral switch', dose: 'Consult pharmacy', bioavail: 75 };

    const criteriaMet = {
      afebrileAtLeast24h: stepdownAfebrile >= 24,
      hemodynamicallyStable: stepdownMap >= 65,
      wbcImproving: stepdownWbc >= 4000 && stepdownWbc <= 12000,
      functionalGiTract: gutFunctional,
      daysOnIvAtLeast48h: daysOnIv >= 2,
    };

    const isCandidate = Object.values(criteriaMet).every(Boolean) && eq.bioavail >= 70;

    let clinicalRecommendationEn = '';
    let clinicalRecommendationKm = '';

    if (isCandidate) {
      clinicalRecommendationEn = `Eligible for IV-to-Oral step-down switch to ${eq.drug} ${eq.dose}. Reduces line-associated infection risks and hospital length of stay.`;
      clinicalRecommendationKm = `មានលក្ខខណ្ឌគ្រប់គ្រាន់សម្រាប់ប្តូរពីថ្នាំចាក់ទៅថ្នាំលេប ${eq.drug} កម្រិត ${eq.dose} ដែលជួយកាត់បន្ថយហានិភ័យឆ្លងរោគតាមសរសៃឈាម និងកាត់បន្ថយថ្ងៃសម្រាកពេទ្យ`;
    } else {
      clinicalRecommendationEn = 'Not currently eligible for oral step-down. Pending clinical stability criteria.';
      clinicalRecommendationKm = 'មិនទាន់អាចប្តូរទៅថ្នាំលេបបាននៅឡើយទេ ដោយសារនៅខ្វះលក្ខខណ្ឌគ្លីនិកដូចជា កម្តៅ ឬសម្ពាធឈាម ឬប្រព័ន្ធរំលាយអាហារមិនទាន់ដំណើរការល្អ';
    }

    setStepdownResult({
      agentName: stepdownAgent.replace('_', ' '),
      recommendedOralDrug: eq.drug,
      recommendedOralDose: eq.dose,
      bioavailabilityPercent: eq.bioavail,
      isCandidate,
      criteriaMet,
      clinicalRecommendationEn,
      clinicalRecommendationKm,
    });
  };

  const handleCheckMismatch = () => {
    const rules: Record<string, Record<string, { reasonEn: string; reasonKm: string; altEn: string; altKm: string }>> = {
      PSEUDOMONAS_AERUGINOSA: {
        CEFTRIAXONE: {
          reasonEn: 'Pseudomonas aeruginosa has intrinsic resistance to Ceftriaxone due to AmpC beta-lactamase.',
          reasonKm: 'មេរោគ Pseudomonas aeruginosa មានភាពស៊ាំពីធម្មជាតិទៅនឹងថ្នាំ Ceftriaxone ដោយសារអង់ស៊ីម AmpC beta-lactamase',
          altEn: 'Cefepime, Ceftazidime, Piperacillin-Tazobactam, or Meropenem',
          altKm: 'Cefepime, Ceftazidime, Piperacillin-Tazobactam ឬ Meropenem',
        },
      },
      ESCHERICHIA_COLI: {
        VANCOMYCIN: {
          reasonEn: 'Gram-negative bacilli possess an outer membrane impermeable to large glycopeptide molecules like Vancomycin.',
          reasonKm: 'មេរោគ Escherichia coli ជាប្រភេទ Gram អវិជ្ជមាន ដែលមានភ្នាសការពារមិនឱ្យថ្នាំ Vancomycin ជ្រាបចូលបាន',
          altEn: 'Ceftriaxone, Ciprofloxacin, or Meropenem',
          altKm: 'Ceftriaxone, Ciprofloxacin ឬ Meropenem',
        },
      },
      KLEBSIELLA_PNEUMONIAE: {
        AMPICILLIN: {
          reasonEn: 'Klebsiella species are intrinsically resistant to Ampicillin due to constitutive chromosomal SHV-1 beta-lactamase.',
          reasonKm: 'មេរោគ Klebsiella pneumoniae មានភាពស៊ាំពីកំណើតទៅនឹង Ampicillin ដោយសារអង់ស៊ីម SHV-1 លើក្រូម៉ូសូម',
          altEn: 'Ampicillin-Sulbactam, Ceftriaxone, or Ciprofloxacin',
          altKm: 'Ampicillin-Sulbactam, Ceftriaxone ឬ Ciprofloxacin',
        },
      },
      ENTEROCOCCUS_FAECALIS: {
        CEFAZOLIN: {
          reasonEn: 'Enterococci possess low-affinity penicillin-binding proteins refractory to Cefazolin and cephalosporins.',
          reasonKm: 'មេរោគ Enterococcus faecalis មិនឆ្លើយតបនឹងថ្នាំ Cefazolin និងក្រុម Cephalosporins ឡើយ',
          altEn: 'Ampicillin or Vancomycin',
          altKm: 'Ampicillin ឬ Vancomycin',
        },
      },
    };

    const match = rules[selectedPathogen]?.[selectedAntibiotic];
    if (match) {
      setMismatchResult({
        isMismatch: true,
        pathogenName: selectedPathogen.replace(/_/g, ' '),
        antibioticName: selectedAntibiotic.replace(/_/g, ' '),
        mismatchType: 'INTRINSIC_RESISTANCE',
        warningEn: match.reasonEn,
        warningKm: match.reasonKm,
        recommendedAlternativeEn: match.altEn,
        recommendedAlternativeKm: match.altKm,
      });
    } else {
      setMismatchResult({
        isMismatch: false,
        pathogenName: selectedPathogen.replace(/_/g, ' '),
        antibioticName: selectedAntibiotic.replace(/_/g, ' '),
        mismatchType: 'MATCH',
        warningEn: 'No intrinsic resistance mismatch detected.',
        warningKm: 'មិនមានភាពស៊ាំពីធម្មជាតិត្រូវបានរកឃើញទេ',
        recommendedAlternativeEn: 'Maintain current regimen based on susceptibility test results.',
        recommendedAlternativeKm: 'បន្តការព្យាបាលតាមលទ្ធផលធ្វើតេស្តមន្ទីរពិសោធន៍',
      });
    }
  };

  const saarRatio = Math.round((observedDot / Math.max(1, predictedDot)) * 100) / 100;
  const dotRate = Math.round((observedDot / Math.max(1, patientDays)) * 1000 * 10) / 10;
  const lotRate = Math.round((totalLot / Math.max(1, patientDays)) * 1000 * 10) / 10;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t.asp.title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">{t.asp.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('SURVEILLANCE')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'SURVEILLANCE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {locale === 'km' ? 'សូចនាករ DOT និង SAAR' : 'DOT & SAAR Metrics'}
          </button>
          <button
            onClick={() => setActiveTab('KINETICS')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'KINETICS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {locale === 'km' ? 'បញ្ឈប់ថ្នាំតាម PCT' : 'Procalcitonin Kinetics'}
          </button>
          <button
            onClick={() => setActiveTab('STEP_DOWN')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'STEP_DOWN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {locale === 'km' ? 'ប្តូរទៅថ្នាំលេប IV ទៅ PO' : 'IV-to-PO Step-Down'}
          </button>
          <button
            onClick={() => setActiveTab('MISMATCH')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'MISMATCH' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {locale === 'km' ? 'ទប់ស្កាត់ការស៊ាំថ្នាំ' : 'Resistance Guard'}
          </button>
          <button
            onClick={() => setActiveTab('ANTIBIOGRAM')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'ANTIBIOGRAM' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {locale === 'km' ? 'តារាង Antibiogram' : 'Antibiogram Matrix'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">{t.asp.observedDot}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{observedDot}</span>
            <span className="text-xs text-slate-400">days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative agent exposure</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">{t.asp.lengthOfTherapy}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-indigo-600">{totalLot}</span>
            <span className="text-xs text-slate-400">days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Calendar days on antibiotics</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">{t.asp.saarRatio}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold ${saarRatio > 1.3 ? 'text-rose-600' : saarRatio > 1.0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {saarRatio}
            </span>
            <span className="text-xs font-medium text-slate-500">vs benchmark</span>
          </div>
          <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded ${
            saarRatio > 1.3 ? 'bg-rose-100 text-rose-700' : saarRatio > 1.0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            {saarRatio > 1.3 ? 'Critical Overutilization' : saarRatio > 1.0 ? 'Elevated Consumption' : 'Optimal Concordance'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">{t.asp.dotRate}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{dotRate}</span>
            <span className="text-xs text-slate-400">/ 1k days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Normalized to {patientDays} pt-days</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">{t.asp.lotRate}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{lotRate}</span>
            <span className="text-xs text-slate-400">/ 1k days</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Net inpatient antibiotic density</p>
        </div>
      </div>

      {/* Tab 1: SURVEILLANCE */}
      {activeTab === 'SURVEILLANCE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {locale === 'km' ? 'ប៉ារ៉ាម៉ែត្រគ្លីនិកមន្ទីរពេទ្យ' : 'Surveillance Parameters'}
            </h2>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.unitFilter}</label>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value as any)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="ALL">{t.asp.unitAll}</option>
                <option value="ICU">{t.asp.unitIcu}</option>
                <option value="GENERAL_WARD">{t.asp.unitWard}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                {locale === 'km' ? 'ចំនួនថ្ងៃអ្នកជំងឺសរុប - Patient-Days' : 'Total Patient-Days'}
              </label>
              <input
                type="number"
                value={patientDays}
                onChange={(e) => setPatientDays(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.predictedDot}</label>
              <input
                type="number"
                value={predictedDot}
                onChange={(e) => setPredictedDot(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.observedDot}</label>
              <input
                type="number"
                value={observedDot}
                onChange={(e) => setObservedDot(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {locale === 'km' ? 'ការបកស្រាយសូចនាករ SAAR & CDC Benchmarks' : 'SAAR Interpretation & Benchmark Analysis'}
            </h2>
            <div className={`p-4 rounded-xl border ${
              saarRatio > 1.3 ? 'bg-rose-50 border-rose-200 text-rose-900' :
              saarRatio > 1.0 ? 'bg-amber-50 border-amber-200 text-amber-900' :
              'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {saarRatio > 1.0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                <span>
                  {locale === 'km'
                    ? (saarRatio > 1.3 ? 'ការព្រមានកម្រិតខ្ពស់ហួសកំណត់' : saarRatio > 1.0 ? 'ការប្រើប្រាស់កម្រិតខ្ពស់' : 'កម្រិតសមស្របតាមស្តង់ដារជាតិ')
                    : (saarRatio > 1.3 ? 'Critical Overutilization Alert' : saarRatio > 1.0 ? 'Elevated Consumption Advisory' : 'Optimal Benchmark Concordance')}
                </span>
              </div>
              <p className="text-xs mt-2 leading-relaxed">
                {locale === 'km'
                  ? 'ការគណនាសូចនាករ SAAR ជួយកំណត់អត្តសញ្ញាណការប្រើប្រាស់ថ្នាំផ្សះលើសកម្រិត ដើម្បីចៀសវាងការកើនឡើងនៃមេរោគស៊ាំថ្នាំ និងកាត់បន្ថយការចំណាយមិនចាំបាច់'
                  : 'SAAR metrics benchmark facility-specific antimicrobial consumption against risk-adjusted CDC predicted models. Elevated values require mandatory clinical audit and prospective de-escalation.'}
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                {locale === 'km' ? 'ចំណាត់ថ្នាក់កម្រិតថ្នាំផ្សះកំពូល' : 'Top Monitored Antimicrobials'}
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="font-medium text-slate-800">Meropenem IV</span>
                  <span className="font-bold text-slate-600">35 DOT</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="font-medium text-slate-800">Vancomycin IV</span>
                  <span className="font-bold text-slate-600">28 DOT</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="font-medium text-slate-800">Ceftriaxone IV</span>
                  <span className="font-bold text-slate-600">14 DOT</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-medium text-slate-800">Ciprofloxacin IV</span>
                  <span className="font-bold text-slate-600">8 DOT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: KINETICS */}
      {activeTab === 'KINETICS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{t.asp.pctKineticsTitle}</h2>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.baselinePct}</label>
              <input
                type="number"
                step="0.1"
                value={baselinePct}
                onChange={(e) => setBaselinePct(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.currentPct}</label>
              <input
                type="number"
                step="0.05"
                value={currentPct}
                onChange={(e) => setCurrentPct(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.afebrileHours}</label>
              <input
                type="number"
                value={afebrileHours}
                onChange={(e) => setAfebrileHours(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.meanArterialPressure}</label>
              <input
                type="number"
                value={mapVal}
                onChange={(e) => setMapVal(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <button
              onClick={handleEvaluatePct}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              {t.asp.evaluatePctBtn}
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {locale === 'km' ? 'លទ្ធផលវាយតម្លៃ និងអនុសាសន៍គ្លីនិក' : 'Kinetic Evaluation & Clinical Cessation Recommendation'}
            </h2>
            {pctResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">{t.asp.pctDropLabel}</span>
                    <span className="text-2xl font-bold text-emerald-600">{pctResult.deltaPctPercent}%</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Threshold: &ge; 80% decrease</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 block mb-1">
                      {locale === 'km' ? 'កម្រិតដាច់ខាតបច្ចុប្បន្ន' : 'Current Absolute Level'}
                    </span>
                    <span className="text-2xl font-bold text-slate-800">{pctResult.currentPct} mcg/L</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Threshold: &lt; 0.25 mcg/L</span>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border ${
                  pctResult.recommendation === 'STRONG_CESSATION_RECOMMENDED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : pctResult.recommendation === 'TREATMENT_FAILURE_OR_RESISTANCE_RISK'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {pctResult.recommendation === 'STRONG_CESSATION_RECOMMENDED' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                    <span>
                      {pctResult.recommendation === 'STRONG_CESSATION_RECOMMENDED'
                        ? (locale === 'km' ? 'អនុសាសន៍បញ្ឈប់ថ្នាំផ្សះជាបន្ទាន់' : 'Strong Cessation Recommended')
                        : pctResult.recommendation === 'CONSIDER_CESSATION'
                        ? (locale === 'km' ? 'ពិចារណាបញ្ឈប់ថ្នាំផ្សះ' : 'Consider Antibiotic Cessation')
                        : pctResult.recommendation === 'TREATMENT_FAILURE_OR_RESISTANCE_RISK'
                        ? (locale === 'km' ? 'ហានិភ័យនៃការព្យាបាលមិនឆ្លើយតប ឬមេរោគស៊ាំថ្នាំ' : 'Risk of Treatment Failure or Resistant Pathogen')
                        : (locale === 'km' ? 'បន្តការព្យាបាលតាមវេជ្ជបញ្ជា' : 'Continue Antimicrobial Therapy')}
                    </span>
                  </div>
                  <p className="text-xs mt-2 leading-relaxed">
                    {locale === 'km' ? pctResult.rationaleKm : pctResult.rationaleEn}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: STEP_DOWN */}
      {activeTab === 'STEP_DOWN' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{t.asp.ivToPoTitle}</h2>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.selectIvAgent}</label>
              <select
                value={stepdownAgent}
                onChange={(e) => setStepdownAgent(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                <option value="CIPROFLOXACIN_IV">Ciprofloxacin IV</option>
                <option value="LEVOFLOXACIN_IV">Levofloxacin IV</option>
                <option value="LINEZOLID_IV">Linezolid IV</option>
                <option value="METRONIDAZOLE_IV">Metronidazole IV</option>
                <option value="FLUCONAZOLE_IV">Fluconazole IV</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.daysOnIv}</label>
              <input
                type="number"
                value={daysOnIv}
                onChange={(e) => setDaysOnIv(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.afebrileHours}</label>
              <input
                type="number"
                value={stepdownAfebrile}
                onChange={(e) => setStepdownAfebrile(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.wbcCount}</label>
              <input
                type="number"
                value={stepdownWbc}
                onChange={(e) => setStepdownWbc(parseFloat(e.target.value) || 0)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="gutCheck"
                checked={gutFunctional}
                onChange={(e) => setGutFunctional(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="gutCheck" className="text-xs font-medium text-slate-700">
                {t.asp.functionalGi}
              </label>
            </div>
            <button
              onClick={handleEvaluateStepDown}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              {t.asp.evaluateStepdownBtn}
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {locale === 'km' ? 'ការផ្ទៀងផ្ទាត់លក្ខខណ្ឌប្តូរទៅថ្នាំលេប' : 'Oral Conversion Decision Engine'}
            </h2>
            {stepdownResult && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  stepdownResult.isCandidate ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-xs text-slate-500 block">
                      {locale === 'km' ? 'ជម្រើសថ្នាំលេបដែលត្រូវគ្នា' : 'Equivalent Oral Regimen'}
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      {stepdownResult.recommendedOralDrug} - {stepdownResult.recommendedOralDose}
                    </span>
                    <span className="text-xs text-emerald-600 block mt-0.5">
                      {stepdownResult.bioavailabilityPercent}% Bioavailability
                    </span>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                    stepdownResult.isCandidate ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {stepdownResult.isCandidate ? t.asp.oralCandidateBadge : t.asp.oralIneligibleBadge}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    {locale === 'km' ? 'បញ្ជីផ្ទៀងផ្ទាត់លក្ខខណ្ឌគ្លីនិកទាំង ៥' : 'Clinical Stability Criteria Checklist'}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {stepdownResult.criteriaMet.daysOnIvAtLeast48h ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span>{locale === 'km' ? 'បានចាក់ថ្នាំយ៉ាងតិច ៤៨ ម៉ោង' : 'IV therapy >= 48 hours'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stepdownResult.criteriaMet.afebrileAtLeast24h ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span>{locale === 'km' ? 'គ្មានគ្រុនក្តៅលើស ២៤ ម៉ោង' : 'Afebrile >= 24 hours'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stepdownResult.criteriaMet.hemodynamicallyStable ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span>{locale === 'km' ? 'សម្ពាធឈាមថេរ MAP >= 65' : 'MAP >= 65 mmHg stable'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stepdownResult.criteriaMet.wbcImproving ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span>{locale === 'km' ? 'គ្រាប់ឈាមសក្នុងកម្រិតធម្មតា' : 'WBC within normal limits'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {stepdownResult.criteriaMet.functionalGiTract ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                      <span>{locale === 'km' ? 'ប្រព័ន្ធរំលាយអាហារដំណើរការល្អ' : 'Functional GI absorption'}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                  {locale === 'km' ? stepdownResult.clinicalRecommendationKm : stepdownResult.clinicalRecommendationEn}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: MISMATCH */}
      {activeTab === 'MISMATCH' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{t.asp.mismatchTitle}</h2>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.selectPathogen}</label>
              <select
                value={selectedPathogen}
                onChange={(e) => setSelectedPathogen(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                <option value="PSEUDOMONAS_AERUGINOSA">Pseudomonas aeruginosa</option>
                <option value="ESCHERICHIA_COLI">Escherichia coli</option>
                <option value="KLEBSIELLA_PNEUMONIAE">Klebsiella pneumoniae</option>
                <option value="ENTEROCOCCUS_FAECALIS">Enterococcus faecalis</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">{t.asp.selectAntibiotic}</label>
              <select
                value={selectedAntibiotic}
                onChange={(e) => setSelectedAntibiotic(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              >
                <option value="CEFTRIAXONE">Ceftriaxone</option>
                <option value="VANCOMYCIN">Vancomycin</option>
                <option value="AMPICILLIN">Ampicillin</option>
                <option value="CEFAZOLIN">Cefazolin</option>
                <option value="MEROPENEM">Meropenem</option>
              </select>
            </div>
            <button
              onClick={handleCheckMismatch}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
            >
              {t.asp.checkMismatchBtn}
            </button>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {locale === 'km' ? 'លទ្ធផលនៃការផ្ទៀងផ្ទាត់ភាពត្រូវគ្នា' : 'EUCAST & CLSI Bug-Drug Validation'}
            </h2>
            {mismatchResult && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${
                  mismatchResult.isMismatch ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {mismatchResult.isMismatch ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    <span>{mismatchResult.isMismatch ? t.asp.mismatchDetected : t.asp.compatibilityVerified}</span>
                  </div>
                  <p className="text-xs mt-2 leading-relaxed">
                    {locale === 'km' ? mismatchResult.warningKm : mismatchResult.warningEn}
                  </p>
                </div>

                {mismatchResult.isMismatch && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-slate-700 block">
                      {locale === 'km' ? 'ជម្រើសថ្នាំព្យាបាលដែលបានណែនាំ' : 'Recommended Therapeutic Alternatives'}
                    </span>
                    <p className="text-xs text-indigo-600 font-semibold">
                      {locale === 'km' ? mismatchResult.recommendedAlternativeKm : mismatchResult.recommendedAlternativeEn}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: ANTIBIOGRAM */}
      {activeTab === 'ANTIBIOGRAM' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{t.asp.antibiogramTitle}</h2>
            <span className="text-xs text-slate-500 font-medium">CLSI M39-A4 Annual Surveillance</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">{t.asp.pathogenCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-center">{t.asp.isolatesCol}</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Meropenem</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Pip-Tazo</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Ceftriaxone</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Ciprofloxacin</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Vancomycin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">Pseudomonas aeruginosa</td>
                  <td className="py-2.5 px-3 text-center text-slate-600">142</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600 bg-emerald-50/50">85.9%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600 bg-emerald-50/50">83.1%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400 bg-slate-50">0.0% R</td>
                  <td className="py-2.5 px-3 text-center font-bold text-amber-600 bg-amber-50/50">69.0%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400 bg-slate-50">-</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">Escherichia coli ESBL+</td>
                  <td className="py-2.5 px-3 text-center text-slate-600">285</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600 bg-emerald-50/50">98.6%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600 bg-emerald-50/50">88.4%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-rose-600 bg-rose-50/50">4.2%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-rose-600 bg-rose-50/50">40.0%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400 bg-slate-50">-</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">Staphylococcus aureus MRSA</td>
                  <td className="py-2.5 px-3 text-center text-slate-600">96</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400 bg-slate-50">-</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400 bg-slate-50">-</td>
                  <td className="py-2.5 px-3 text-center font-bold text-rose-600 bg-rose-50/50">0.0%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-rose-600 bg-rose-50/50">12.5%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600 bg-emerald-50/50">100.0%</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">Klebsiella pneumoniae</td>
                  <td className="py-2.5 px-3 text-center text-slate-600">180</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600 bg-emerald-50/50">93.3%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600 bg-emerald-50/50">84.2%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-amber-600 bg-amber-50/50">70.0%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-amber-600 bg-amber-50/50">72.5%</td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-400 bg-slate-50">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
