'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../../context/I18nContext';
import {
  Calculator,
  TrendingUp,
  Clock,
  ShieldCheck,
  DollarSign,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const RoiCalculatorSection: React.FC = () => {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  // Slider state: average patients per day
  const [patientsPerDay, setPatientsPerDay] = useState<number>(35);

  // Derived calculations
  const hoursSavedPerDay = (patientsPerDay * 5) / 60; // ~5 mins saved per patient on admin/queue/writing
  const hoursSavedPerMonth = Math.round(hoursSavedPerDay * 26);
  const fakeQrLeakageSaved = Math.round(patientsPerDay * 0.25 * 30); // estimated payment discrepancy prevention ($)
  const paperAndPrintingSaved = Math.round(25 + patientsPerDay * 1.5); // estimated paper/label savings ($/mo)
  const additionalPatientCapacity = Math.round(patientsPerDay * 0.22); // extra patients possible to serve daily

  return (
    <section className="py-16 md:py-24 bg-[#FAF7F2] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D5CDBD] text-stone-800 text-xs font-bold shadow-2xs">
            <Calculator className="w-3.5 h-3.5 text-teal-800" />
            <span>
              {isKm
                ? 'ឧបករណ៍គណនាផលចំណេញ • Clinical Value & ROI Estimator'
                : 'Interactive ROI & Time Savings Estimator'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-900 tracking-tight font-sans">
            {isKm
              ? 'គណនាផលចំណេញដែលគ្លីនិករបស់អ្នកនឹងទទួលបាន'
              : 'Calculate Your Clinic Measurable Monthly Savings'}
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
            {isKm
              ? 'ជ្រើសរើសចំនួនអ្នកជំងឺដែលមកពិគ្រោះនៅគ្លីនិករបស់អ្នកជារៀងរាល់ថ្ងៃ ដើម្បីមើលឃើញពេលវេលា និងថវិកាដែលលោកអ្នកនឹងសន្សំបានជាក់ស្តែង។'
              : 'Adjust the slider below to project how many hours of administrative strain and financial leakage KruPet will recover each month.'}
          </p>
        </div>

        {/* Interactive Calculator Box */}
        <div className="mt-12 max-w-4xl mx-auto bg-white rounded-3xl border border-[#DFD6C6] shadow-xl overflow-hidden">
          <div className="p-6 sm:p-10 space-y-8">
            {/* Slider Controls */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <label className="text-xs sm:text-sm font-bold text-stone-900 block font-sans">
                    {isKm
                      ? 'ចំនួនអ្នកជំងឺមកពិគ្រោះជាមធ្យមក្នុងមួយថ្ងៃ:'
                      : 'Average Patient Volume Per Day:'}
                  </label>
                  <span className="text-xs text-stone-500 font-sans">
                    {isKm
                      ? 'អូសរំកិលតាមទំហំជាក់ស្តែងនៃគ្លីនិករបស់អ្នក'
                      : 'Drag the slider to match your daily patient visits'}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 px-4 py-2 rounded-2xl shrink-0">
                  <Users className="w-4 h-4 text-teal-800" />
                  <span className="text-xl sm:text-2xl font-black text-teal-900 font-mono">
                    {patientsPerDay}
                  </span>
                  <span className="text-xs font-bold text-teal-800 font-sans">
                    {isKm ? 'នាក់ / ថ្ងៃ' : 'patients / day'}
                  </span>
                </div>
              </div>

              {/* Range Input Slider */}
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={patientsPerDay}
                onChange={(e) => setPatientsPerDay(parseInt(e.target.value, 10))}
                className="w-full h-3 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-800"
              />

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                  {isKm ? 'ជ្រើសរើសលឿន:' : 'Quick Presets:'}
                </span>
                {[15, 30, 50, 75, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPatientsPerDay(val)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all ${
                      patientsPerDay === val
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {val} {isKm ? 'នាក់' : 'pts'}
                  </button>
                ))}
              </div>
            </div>

            {/* Projected Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-stone-100">
              {/* Card 1: Time Saved */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7DFCF] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 font-bold">HOURS</span>
                </div>
                <div className="text-2xl font-black text-stone-900 font-mono">
                  {hoursSavedPerMonth} {isKm ? 'ម៉ោង' : 'hrs'}
                </div>
                <div className="text-[11px] font-bold text-stone-700 font-sans">
                  {isKm ? 'ពេលវេលារដ្ឋបាលចំណេញ / ខែ' : 'Admin Time Saved / Month'}
                </div>
                <p className="text-[10px] text-stone-500 leading-relaxed font-sans">
                  {isKm
                    ? 'កាត់បន្ថយការស្រែកហៅ សរសេរក្រដាស និងស្វែងរកឯកសារចាស់'
                    : 'Saved from manual dictation, paper searching, and shouting queues'}
                </p>
              </div>

              {/* Card 2: Leakage Prevented */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7DFCF] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">100% AUDIT</span>
                </div>
                <div className="text-2xl font-black text-emerald-800 font-mono">
                  ${fakeQrLeakageSaved} <span className="text-xs font-normal text-stone-500">/mo</span>
                </div>
                <div className="text-[11px] font-bold text-stone-700 font-sans">
                  {isKm ? 'ទប់ស្កាត់ការបាត់បង់ប្រាក់ & Fake QR' : 'Leakage & Fake QR Protected'}
                </div>
                <p className="text-[10px] text-stone-500 leading-relaxed font-sans">
                  {isKm
                    ? 'គ្មានកំហុសវាយខុសចំនួនទឹកប្រាក់ ឬក្លែងបន្លំ Screenshot'
                    : 'Zero mistyped amounts or falsified transaction screenshots'}
                </p>
              </div>

              {/* Card 3: Printing & Supplies Saved */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7DFCF] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-amber-800 font-bold">SUPPLIES</span>
                </div>
                <div className="text-2xl font-black text-amber-900 font-mono">
                  ${paperAndPrintingSaved} <span className="text-xs font-normal text-stone-500">/mo</span>
                </div>
                <div className="text-[11px] font-bold text-stone-700 font-sans">
                  {isKm ? 'សន្សំថ្លៃសៀវភៅ & ក្រដាសបោះពុម្ព' : 'Stationery & Printing Saved'}
                </div>
                <p className="text-[10px] text-stone-500 leading-relaxed font-sans">
                  {isKm
                    ? 'កាត់បន្ថយថ្លៃសៀវភៅកត់ត្រា និងប័ណ្ណក្រដាសរញ៉េរញ៉ៃ'
                    : 'Eliminates paper file folders, duplicate notebooks, and wasted slips'}
                </p>
              </div>

              {/* Card 4: Extra Capacity */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E7DFCF] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-teal-800 font-bold">+22% EFFICIENCY</span>
                </div>
                <div className="text-2xl font-black text-teal-900 font-mono">
                  +{additionalPatientCapacity} {isKm ? 'នាក់/ថ្ងៃ' : 'pts/day'}
                </div>
                <div className="text-[11px] font-bold text-stone-700 font-sans">
                  {isKm ? 'លទ្ធភាពទទួលអ្នកជំងឺបន្ថែម' : 'Extra Patient Capacity'}
                </div>
                <p className="text-[10px] text-stone-500 leading-relaxed font-sans">
                  {isKm
                    ? 'បង្កើនសមត្ថភាពព្យាបាលអ្នកជំងឺដោយមិនបាច់បន្ថែមគ្រូពេទ្យ'
                    : 'Serve more patients comfortably without increasing payroll overhead'}
                </p>
              </div>
            </div>

            {/* Bottom Value Guarantee Summary */}
            <div className="p-5 rounded-2xl bg-teal-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-sm font-bold flex items-center justify-center sm:justify-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isKm
                      ? 'ផលចំណេញត្រឡប់មកវិញ - ROI លើសពី ៨០០% នៃតម្លៃសេវាប្រចាំខែ'
                      : 'Estimated Return on Investment Exceeds 800% of Plan Cost'}
                  </span>
                </div>
                <p className="text-xs text-teal-200">
                  {isKm
                    ? 'គម្រោង Clinic Starter ត្រឹម $5/ខែ ឬ Free Starter $0/ខែ ជួយសន្សំបានរាប់រយដុល្លារជារៀងរាល់ខែ។'
                    : 'Starter plan at just $5/mo pays for itself within the very first 2 business days.'}
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0"
              >
                <span>{isKm ? 'ចាប់ផ្តើមសន្សំប្រាក់ថ្ងៃនេះ' : 'Start Saving Today'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
