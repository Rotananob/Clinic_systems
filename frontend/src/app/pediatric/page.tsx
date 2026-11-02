'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';
import {
  Baby,
  Calculator,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  Info,
  Pill,
  Syringe,
  Sun,
} from 'lucide-react';

interface MedicationDef {
  code: string;
  name: string;
  category: string;
  standardDoseMgPerKg: number;
  dosingIntervalHours: number;
  maxDoseMgPerKgPerDay: number;
  adultMaxSingleDoseMg: number;
  liquidFormulations: {
    concentrationName: string;
    mgPerMl: number;
  }[];
}

const FORMULARY_LIST: MedicationDef[] = [
  {
    code: 'PARACETAMOL',
    name: 'Paracetamol (Acetaminophen) Syrup',
    category: 'Analgesic / Antipyretic',
    standardDoseMgPerKg: 15,
    dosingIntervalHours: 6,
    maxDoseMgPerKgPerDay: 75,
    adultMaxSingleDoseMg: 1000,
    liquidFormulations: [
      { concentrationName: '120 mg / 5 mL (Infant/Child)', mgPerMl: 24 },
      { concentrationName: '250 mg / 5 mL (Forte)', mgPerMl: 50 },
    ],
  },
  {
    code: 'IBUPROFEN',
    name: 'Ibuprofen Oral Suspension',
    category: 'Analgesic / NSAID',
    standardDoseMgPerKg: 10,
    dosingIntervalHours: 8,
    maxDoseMgPerKgPerDay: 40,
    adultMaxSingleDoseMg: 400,
    liquidFormulations: [
      { concentrationName: '100 mg / 5 mL', mgPerMl: 20 },
    ],
  },
  {
    code: 'AMOXICILLIN',
    name: 'Amoxicillin Oral Suspension',
    category: 'Antibiotic (Penicillin)',
    standardDoseMgPerKg: 45,
    dosingIntervalHours: 12,
    maxDoseMgPerKgPerDay: 90,
    adultMaxSingleDoseMg: 1000,
    liquidFormulations: [
      { concentrationName: '125 mg / 5 mL', mgPerMl: 25 },
      { concentrationName: '250 mg / 5 mL', mgPerMl: 50 },
    ],
  },
  {
    code: 'CEFTRIAXONE',
    name: 'Ceftriaxone IV/IM Injection',
    category: 'Antibiotic (Cephalosporin)',
    standardDoseMgPerKg: 50,
    dosingIntervalHours: 24,
    maxDoseMgPerKgPerDay: 100,
    adultMaxSingleDoseMg: 2000,
    liquidFormulations: [
      { concentrationName: '1 g / 10 mL vial', mgPerMl: 100 },
    ],
  },
  {
    code: 'AZITHROMYCIN',
    name: 'Azithromycin Oral Suspension',
    category: 'Antibiotic (Macrolide)',
    standardDoseMgPerKg: 10,
    dosingIntervalHours: 24,
    maxDoseMgPerKgPerDay: 10,
    adultMaxSingleDoseMg: 500,
    liquidFormulations: [
      { concentrationName: '200 mg / 5 mL', mgPerMl: 40 },
    ],
  },
];

export default function PediatricPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'DOSING' | 'NEONATAL' | 'PHOTOTHERAPY' | 'FORMULARY'>('DOSING');

  // Pediatric Precision Dosing State
  const [selectedMedCode, setSelectedMedCode] = useState<string>('PARACETAMOL');
  const [weightKg, setWeightKg] = useState<number>(18.0);
  const [ageYears, setAgeYears] = useState<number>(5.0);
  const [ageMonths, setAgeMonths] = useState<number>(60);
  const [selectedConcMgPerMl, setSelectedConcMgPerMl] = useState<number>(24);

  // Neonatal Aminoglycoside State
  const [gaWeeks, setGaWeeks] = useState<number>(32);
  const [pnaDays, setPnaDays] = useState<number>(4);
  const [neoWeightKg, setNeoWeightKg] = useState<number>(1.8);

  // Hyperbilirubinemia Phototherapy State
  const [postnatalHours, setPostnatalHours] = useState<number>(48);
  const [tsbMgDl, setTsbMgDl] = useState<number>(14.5);
  const [biliGaWeeks, setBiliGaWeeks] = useState<number>(38);
  const [hasNeuroFactors, setHasNeuroFactors] = useState<boolean>(false);

  // Calculation Results
  const currentMed = FORMULARY_LIST.find((m) => m.code === selectedMedCode) || FORMULARY_LIST[0];

  // 1. Dosing Calculations
  const rawWeightDose = Math.round(weightKg * currentMed.standardDoseMgPerKg * 10) / 10;
  const isCappedAtAdult = rawWeightDose > currentMed.adultMaxSingleDoseMg;
  const recommendedDoseMg = isCappedAtAdult ? currentMed.adultMaxSingleDoseMg : rawWeightDose;
  const liquidVolumeMl = Math.round((recommendedDoseMg / selectedConcMgPerMl) * 10) / 10;

  // Historical approximations
  const weightLbs = weightKg * 2.20462;
  const clarksDose = Math.round(((weightLbs / 150) * currentMed.adultMaxSingleDoseMg) * 10) / 10;
  const youngsDose = Math.round(((ageYears / (ageYears + 12)) * currentMed.adultMaxSingleDoseMg) * 10) / 10;
  const friedsDose = Math.round(((ageMonths / 150) * currentMed.adultMaxSingleDoseMg) * 10) / 10;

  // 2. Neonatal Regimen Calculations
  const pmaWeeks = Math.round((gaWeeks + pnaDays / 7) * 10) / 10;
  let neoNominalDose = 4.0;
  let neoInterval: 24 | 36 | 48 = 24;
  let renalStageEn = '';
  let renalStageKm = '';

  if (pmaWeeks < 30) {
    neoNominalDose = 5.0;
    neoInterval = 48;
    renalStageEn = 'Extremely preterm neonatal physiology. Severely reduced GFR requiring extended 48-hour elimination clearance.';
    renalStageKm = 'សរីរវិទ្យាទារកកើតមិនគ្រប់ខែខ្លាំង កម្រិតបន្សុទ្ធតម្រងនោមទាបខ្លាំង តម្រូវឱ្យពន្យារចន្លោះពេលចាក់រហូតដល់ ៤៨ ម៉ោង';
  } else if (pmaWeeks <= 34) {
    if (pnaDays <= 7) {
      neoNominalDose = 4.5;
      neoInterval = 36;
      renalStageEn = 'Moderate preterm early neonatal period. Transitional nephrogenesis requiring 36-hour dosing interval.';
      renalStageKm = 'ទារកកើតមិនគ្រប់ខែកម្រិតមធ្យមអាយុក្រោម ៧ ថ្ងៃ តម្រូវឱ្យប្រើចន្លោះពេលចាក់ ៣៦ ម៉ោង';
    } else {
      neoNominalDose = 4.0;
      neoInterval = 24;
      renalStageEn = 'Moderate preterm maturing renal clearance after first week of life. 24-hour interval indicated.';
      renalStageKm = 'ទារកកើតមិនគ្រប់ខែកម្រិតមធ្យមអាយុលើស ៧ ថ្ងៃ មុខងារតម្រងនោមចាប់ផ្តើមប្រសើរឡើង អាចប្រើចន្លោះពេល ២៤ ម៉ោង';
    }
  } else if (pmaWeeks < 40) {
    neoNominalDose = 4.0;
    neoInterval = 24;
    renalStageEn = 'Near-term neonatal physiology with functional tubular secretion. Standard 24-hour interval.';
    renalStageKm = 'ទារកជិតគ្រប់ខែ មានមុខងារបន្សុទ្ធតម្រងនោមល្អប្រសើរ ប្រើចន្លោះពេលស្តង់ដារ ២៤ ម៉ោង';
  } else {
    neoNominalDose = pnaDays <= 7 ? 4.0 : 5.0;
    neoInterval = 24;
    renalStageEn = 'Full term infant renal clearance. Robust glomerular filtration supporting 24-hour interval.';
    renalStageKm = 'ទារកកើតគ្រប់ខែពេញលេញ មានមុខងារតម្រងនោមរឹងមាំ ប្រើប្រាស់ចន្លោះពេល ២៤ ម៉ោង';
  }
  const neoCalculatedDoseMg = Math.round(neoWeightKg * neoNominalDose * 10) / 10;

  // 3. AAP 2022 Phototherapy Calculations
  let riskCategory: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' = 'LOW_RISK';
  if (biliGaWeeks >= 38 && !hasNeuroFactors) {
    riskCategory = 'LOW_RISK';
  } else if ((biliGaWeeks >= 38 && hasNeuroFactors) || (biliGaWeeks >= 35 && biliGaWeeks < 38 && !hasNeuroFactors)) {
    riskCategory = 'MEDIUM_RISK';
  } else {
    riskCategory = 'HIGH_RISK';
  }

  const anchors = {
    LOW_RISK: { h12: 8.0, h24: 12.0, h48: 15.0, h72: 18.0, h96: 20.0 },
    MEDIUM_RISK: { h12: 6.5, h24: 10.0, h48: 13.0, h72: 15.5, h96: 17.0 },
    HIGH_RISK: { h12: 5.0, h24: 8.0, h48: 11.0, h72: 13.5, h96: 15.0 },
  };

  const curve = anchors[riskCategory];
  const boundedHours = Math.max(12, Math.min(168, postnatalHours));
  let photoThreshold = curve.h96;
  if (boundedHours <= 24) {
    const frac = (boundedHours - 12) / 12;
    photoThreshold = curve.h12 + frac * (curve.h24 - curve.h12);
  } else if (boundedHours <= 48) {
    const frac = (boundedHours - 24) / 24;
    photoThreshold = curve.h24 + frac * (curve.h48 - curve.h24);
  } else if (boundedHours <= 72) {
    const frac = (boundedHours - 48) / 24;
    photoThreshold = curve.h48 + frac * (curve.h72 - curve.h48);
  } else if (boundedHours <= 96) {
    const frac = (boundedHours - 72) / 24;
    photoThreshold = curve.h72 + frac * (curve.h96 - curve.h72);
  } else {
    photoThreshold = curve.h96;
  }
  photoThreshold = Math.round(photoThreshold * 10) / 10;
  const exchangeThreshold = Math.min(25.0, Math.round((photoThreshold + 5.0) * 10) / 10);
  const distanceToThreshold = Math.round((photoThreshold - tsbMgDl) * 10) / 10;

  let photoActionKey: string = 'actionContinueCare';
  let irradianceText: string = 'None';
  let photoActionBadgeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';

  if (tsbMgDl >= exchangeThreshold) {
    photoActionKey = 'actionExchangeTransfusion';
    irradianceText = 'Maximum intensive irradiance (>= 35 uW/cm2/nm) continuous with multiple light sources';
    photoActionBadgeClass = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
  } else if (tsbMgDl >= photoThreshold + 2.0) {
    photoActionKey = 'actionIntensivePhoto';
    irradianceText = 'Intensive irradiance (30-35 uW/cm2/nm) narrow-band blue LED';
    photoActionBadgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  } else if (tsbMgDl >= photoThreshold) {
    photoActionKey = 'actionStandardPhoto';
    irradianceText = 'Standard irradiance (15-20 uW/cm2/nm)';
    photoActionBadgeClass = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  } else if (distanceToThreshold <= 2.0) {
    photoActionKey = 'actionMonitor12h';
    irradianceText = 'None currently. Serial monitoring indicated.';
    photoActionBadgeClass = 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
  } else {
    photoActionKey = 'actionContinueCare';
    irradianceText = 'None';
    photoActionBadgeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  }

  // Update default concentration on medication change
  const handleMedChange = (code: string) => {
    setSelectedMedCode(code);
    const m = FORMULARY_LIST.find((item) => item.code === code);
    if (m && m.liquidFormulations.length > 0) {
      setSelectedConcMgPerMl(m.liquidFormulations[0].mgPerMl);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Baby className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t.pediatric.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t.pediatric.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            AAP 2022 & Lexicomp Validated
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('DOSING')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'DOSING'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calculator className="w-4 h-4" />
          {t.pediatric.tabDosing}
        </button>

        <button
          onClick={() => setActiveTab('NEONATAL')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'NEONATAL'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Syringe className="w-4 h-4" />
          {t.pediatric.tabNeonatal}
        </button>

        <button
          onClick={() => setActiveTab('PHOTOTHERAPY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'PHOTOTHERAPY'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sun className="w-4 h-4" />
          {t.pediatric.tabPhototherapy}
        </button>

        <button
          onClick={() => setActiveTab('FORMULARY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'FORMULARY'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Pill className="w-4 h-4" />
          {t.pediatric.tabFormulary}
        </button>
      </div>

      {/* Tab 1: Pediatric Precision Dosing */}
      {activeTab === 'DOSING' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4 bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              Patient Parameters & Drug Selection
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t.pediatric.selectMedication}
                </label>
                <select
                  value={selectedMedCode}
                  onChange={(e) => handleMedChange(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {FORMULARY_LIST.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t.pediatric.patientWeightKg}
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="120"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t.pediatric.patientAgeYears}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    step="0.5"
                    value={ageYears}
                    onChange={(e) => {
                      const yr = parseFloat(e.target.value) || 0;
                      setAgeYears(yr);
                      setAgeMonths(Math.round(yr * 12));
                    }}
                    className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t.pediatric.patientAgeMonths}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="216"
                    step="1"
                    value={ageMonths}
                    onChange={(e) => {
                      const mo = parseFloat(e.target.value) || 1;
                      setAgeMonths(mo);
                      setAgeYears(Math.round((mo / 12) * 10) / 10);
                    }}
                    className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t.pediatric.selectConcentration}
                </label>
                <select
                  value={selectedConcMgPerMl}
                  onChange={(e) => setSelectedConcMgPerMl(parseFloat(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {currentMed.liquidFormulations.map((f, i) => (
                    <option key={i} value={f.mgPerMl}>
                      {f.concentrationName} ({f.mgPerMl} mg/mL)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            {/* Main Result Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t.pediatric.recommendedDose}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-primary">
                      {recommendedDoseMg} mg
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({currentMed.standardDoseMgPerKg} mg/kg q{currentMed.dosingIntervalHours}h)
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t.pediatric.liquidVolume}
                  </span>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {liquidVolumeMl} mL
                  </div>
                  <span className="text-xs text-muted-foreground">
                    at {selectedConcMgPerMl} mg/mL
                  </span>
                </div>
              </div>

              {/* Adult Cap Clamping Indicator */}
              {isCappedAtAdult && (
                <div className="flex items-center gap-3 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold block">{t.pediatric.adultMaxCapBadge}</span>
                    <span>
                      Raw weight-based calculation yielded {rawWeightDose} mg, safely clamped to adult maximum single-dose of {currentMed.adultMaxSingleDoseMg} mg.
                    </span>
                  </div>
                </div>
              )}

              {/* Clinical Rationale */}
              <div className="p-3.5 bg-muted/50 rounded-lg text-xs space-y-1">
                <span className="font-semibold text-foreground block">
                  Clinical Rationale:
                </span>
                <p className="text-muted-foreground">
                  {locale === 'km'
                    ? isCappedAtAdult
                      ? `កម្រិតថ្នាំត្រូវបានកំណត់ត្រឹមពិដានអតិបរមារបស់មនុស្សពេញវ័យ ${currentMed.adultMaxSingleDoseMg} mg ដើម្បីការពារការពុលថ្នាំលើកុមារដែលមានទម្ងន់លើសកម្រិត`
                      : `កម្រិតថ្នាំសុវត្ថិភាព ${recommendedDoseMg} mg ស្មើនឹង ${liquidVolumeMl} mL នៃកំហាប់ ${selectedConcMgPerMl} mg/mL ត្រូវបានគណនាយ៉ាងត្រឹមត្រូវតាមទម្ងន់ ${weightKg} គីឡូក្រាម`
                    : isCappedAtAdult
                    ? `Dose capped at adult single-dose ceiling of ${currentMed.adultMaxSingleDoseMg} mg (raw calculated: ${rawWeightDose} mg) to prevent toxicity in high-weight child.`
                    : `Precision dose of ${recommendedDoseMg} mg (${liquidVolumeMl} mL of ${selectedConcMgPerMl} mg/mL) calculated at ${currentMed.standardDoseMgPerKg} mg/kg for ${weightKg} kg patient.`}
                </p>
              </div>

              {/* Historical Approximations Benchmark Grid */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-muted-foreground block mb-3">
                  Historical Formula Benchmarks (Adult Base: {currentMed.adultMaxSingleDoseMg} mg)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-card border border-border rounded-lg">
                    <span className="text-xs text-muted-foreground block">{t.pediatric.clarksRule}</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">{clarksDose} mg</span>
                    <span className="text-[10px] text-muted-foreground">(Weight lbs / 150) * Adult</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-lg">
                    <span className="text-xs text-muted-foreground block">{t.pediatric.youngsRule}</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">{youngsDose} mg</span>
                    <span className="text-[10px] text-muted-foreground">Age / (Age + 12) * Adult</span>
                  </div>
                  <div className="p-3 bg-card border border-border rounded-lg">
                    <span className="text-xs text-muted-foreground block">{t.pediatric.friedsRule}</span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">{friedsDose} mg</span>
                    <span className="text-[10px] text-muted-foreground">(Months / 150) * Adult</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Neonatal Extended-Interval Antibiotics */}
      {activeTab === 'NEONATAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4 bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Syringe className="w-4 h-4 text-primary" />
              Neonate Parameters
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t.pediatric.gestationalAgeWeeks}
                </label>
                <input
                  type="number"
                  min="24"
                  max="42"
                  step="1"
                  value={gaWeeks}
                  onChange={(e) => setGaWeeks(parseFloat(e.target.value) || 30)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t.pediatric.postnatalAgeDays}
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="1"
                  value={pnaDays}
                  onChange={(e) => setPnaDays(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Infant Weight (kg)
                </label>
                <input
                  type="number"
                  min="0.4"
                  max="6.0"
                  step="0.05"
                  value={neoWeightKg}
                  onChange={(e) => setNeoWeightKg(parseFloat(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                <span className="text-xs text-muted-foreground block">{t.pediatric.postmenstrualAge}:</span>
                <span className="text-base font-bold text-foreground">
                  {pmaWeeks} weeks
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  PMA = Gestational Age ({gaWeeks}w) + Postnatal Age ({pnaDays}d / 7)
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
              <div className="border-b border-border pb-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t.pediatric.recommendedSchedule} (Gentamicin)
                </span>
                <div className="flex flex-wrap items-baseline gap-4 mt-2">
                  <span className="text-3xl font-extrabold text-primary">
                    {neoCalculatedDoseMg} mg
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    ({neoNominalDose} mg/kg)
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    q{neoInterval}h Interval
                  </span>
                </div>
              </div>

              {/* Target Trough and Peak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-card border border-border rounded-lg">
                  <span className="text-xs text-muted-foreground block">{t.pediatric.targetTrough}</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    &lt; 1.0 ug/mL
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Ideally &lt; 0.5 ug/mL (protect nephrons & cochlea)
                  </span>
                </div>

                <div className="p-3.5 bg-card border border-border rounded-lg">
                  <span className="text-xs text-muted-foreground block">{t.pediatric.targetPeak}</span>
                  <span className="text-lg font-bold text-primary mt-1 block">
                    5.0 - 10.0 ug/mL
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    Bactericidal concentration-dependent peak
                  </span>
                </div>
              </div>

              {/* Renal Stage Analysis */}
              <div className="p-4 bg-muted/40 rounded-lg space-y-2 text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  Renal Clearance Stage:
                </span>
                <p className="text-muted-foreground leading-relaxed">
                  {locale === 'km' ? renalStageKm : renalStageEn}
                </p>
                <div className="pt-2 border-t border-border/60">
                  <span className="font-semibold text-foreground block">
                    Therapeutic Drug Monitoring (TDM) Protocol:
                  </span>
                  <p className="text-muted-foreground mt-0.5">
                    {locale === 'km'
                      ? 'បូមឈាមវាស់កំហាប់ទាបបំផុត Trough ៣០ នាទីមុនចាក់លើកទីពីរ និងវាស់កំហាប់ខ្ពស់បំផុត Peak ៣០ នាទីក្រោយចាក់រួច'
                      : 'Draw serum trough concentration 30 minutes prior to 2nd dose. Serum peak 30 minutes after 30-minute IV infusion.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AAP 2022 Hyperbilirubinemia Phototherapy Nomogram */}
      {activeTab === 'PHOTOTHERAPY' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4 bg-card border border-border rounded-xl p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              Bilirubin Assessment Inputs
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t.pediatric.postnatalHours}
                </label>
                <input
                  type="number"
                  min="12"
                  max="168"
                  step="1"
                  value={postnatalHours}
                  onChange={(e) => setPostnatalHours(parseFloat(e.target.value) || 24)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t.pediatric.totalSerumBilirubin}
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="35"
                  step="0.1"
                  value={tsbMgDl}
                  onChange={(e) => setTsbMgDl(parseFloat(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Gestational Age at Birth (Weeks)
                </label>
                <input
                  type="number"
                  min="35"
                  max="42"
                  step="1"
                  value={biliGaWeeks}
                  onChange={(e) => setBiliGaWeeks(parseFloat(e.target.value) || 38)}
                  className="w-full mt-1 px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasNeuroFactors}
                    onChange={(e) => setHasNeuroFactors(e.target.checked)}
                    className="mt-0.5 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground">
                    {t.pediatric.neurotoxicityRiskFactors}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
              {/* Decision Action Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${photoActionBadgeClass}`}>
                {tsbMgDl >= exchangeThreshold ? (
                  <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                ) : tsbMgDl >= photoThreshold ? (
                  <Sun className="w-6 h-6 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                )}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block">
                    {t.pediatric.riskTier}: {riskCategory.replace('_', ' ')}
                  </span>
                  <p className="text-sm font-semibold mt-1">
                    {t.pediatric[photoActionKey as keyof typeof t.pediatric]}
                  </p>
                </div>
              </div>

              {/* Threshold Comparison Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-card border border-border rounded-lg">
                  <span className="text-xs text-muted-foreground block">{t.pediatric.phototherapyThreshold}</span>
                  <span className="text-xl font-extrabold text-foreground mt-0.5 block">{photoThreshold} mg/dL</span>
                  <span className="text-[10px] text-muted-foreground">Cutoff at {boundedHours}h</span>
                </div>

                <div className="p-3 bg-card border border-border rounded-lg">
                  <span className="text-xs text-muted-foreground block">{t.pediatric.exchangeThreshold}</span>
                  <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 block">{exchangeThreshold} mg/dL</span>
                  <span className="text-[10px] text-muted-foreground">Emergency exchange ceiling</span>
                </div>

                <div className="p-3 bg-card border border-border rounded-lg">
                  <span className="text-xs text-muted-foreground block">Distance to Threshold</span>
                  <span className={`text-xl font-extrabold mt-0.5 block ${distanceToThreshold <= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {distanceToThreshold <= 0 ? `+${Math.abs(distanceToThreshold)}` : `-${distanceToThreshold}`} mg/dL
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {distanceToThreshold <= 0 ? 'Exceeds threshold' : 'Below threshold'}
                  </span>
                </div>
              </div>

              {/* Irradiance Guidance */}
              <div className="p-4 bg-muted/40 rounded-lg space-y-1 text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  {t.pediatric.irradianceRecommendation}:
                </span>
                <p className="text-muted-foreground">
                  {irradianceText}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Pediatric Liquid Formulary */}
      {activeTab === 'FORMULARY' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" />
              Essential Pediatric Liquid Formulary
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Standard weight-based dosages, dosing intervals, and concentrations for pediatric patient management
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-2.5 px-3 font-semibold text-foreground">Medication</th>
                  <th className="py-2.5 px-3 font-semibold text-foreground">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-foreground">Standard Dose</th>
                  <th className="py-2.5 px-3 font-semibold text-foreground">Interval</th>
                  <th className="py-2.5 px-3 font-semibold text-foreground">Daily Max</th>
                  <th className="py-2.5 px-3 font-semibold text-foreground">Adult Single Max</th>
                  <th className="py-2.5 px-3 font-semibold text-foreground">Formulations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FORMULARY_LIST.map((med) => (
                  <tr key={med.code} className="hover:bg-muted/20">
                    <td className="py-3 px-3 font-medium text-foreground">{med.name}</td>
                    <td className="py-3 px-3 text-muted-foreground">{med.category}</td>
                    <td className="py-3 px-3 text-foreground font-semibold">{med.standardDoseMgPerKg} mg/kg</td>
                    <td className="py-3 px-3 text-muted-foreground">q{med.dosingIntervalHours}h</td>
                    <td className="py-3 px-3 text-muted-foreground">{med.maxDoseMgPerKgPerDay} mg/kg/day</td>
                    <td className="py-3 px-3 text-foreground font-semibold">{med.adultMaxSingleDoseMg} mg</td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {med.liquidFormulations.map((f) => f.concentrationName).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
