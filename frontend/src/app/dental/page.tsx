'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  Plus,
  AlertCircle,
  FileText,
  DollarSign,
  Activity,
  Layers,
  X,
  CreditCard,
  Shield,
  Clock,
  Printer,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';

export default function DentalPage() {
  const { t, locale } = useTranslation();
  const d = t.dental || ({} as any);
  const isKh = locale === 'km';

  // State
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PT-1001');
  const [activeTab, setActiveTab] = useState<'chart' | 'plans' | 'procedures' | 'periodontal'>('chart');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dental Data
  const [chart, setChart] = useState<any>(null);
  const [treatmentPlans, setTreatmentPlans] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);

  // Modals & Drawers
  const [selectedToothNumber, setSelectedToothNumber] = useState<number | null>(null);
  const [showToothModal, setShowToothModal] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);

  // Tooth Form Data
  const [toothFormData, setToothFormData] = useState({
    status: 'HEALTHY',
    surfaces: { mesial: false, distal: false, occlusal: false, buccal: false, lingual: false },
    mobilityScore: 0,
    pocketDepthsMm: [2, 2, 2, 2, 2, 2],
    bleedingOnProbing: [false, false, false, false, false, false],
    notes: ''
  });

  // Treatment Plan Form Data
  const [newPlanData, setNewPlanData] = useState({
    title: '',
    dentistName: 'Dr. Seng Chanthou',
    items: [
      {
        toothNumber: 16,
        surface: 'Occlusal',
        procedureCode: 'D-REST-01',
        notes: ''
      }
    ]
  });

  const exchangeRate = 4100;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatMoney = (usd: number) => {
    return `$${usd.toFixed(2)} (${(usd * exchangeRate).toLocaleString()} ៛)`;
  };

  // Adult Tooth Quadrants
  const upperRightTeeth = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeftTeeth = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRightTeeth = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeftTeeth = [31, 32, 33, 34, 35, 36, 37, 38];

  // Load Data
  const loadDentalData = async () => {
    setLoading(true);
    try {
      const [chartRes, plansRes, procRes] = await Promise.all([
        api.dental.getChart(selectedPatientId),
        api.dental.getTreatmentPlans(selectedPatientId),
        api.dental.getProcedures()
      ]);

      if (chartRes?.success && chartRes.data) setChart(chartRes.data);
      else if (chartRes?.data) setChart(chartRes.data);

      const plansList = (plansRes as any)?.data || (Array.isArray(plansRes) ? plansRes : []);
      setTreatmentPlans(plansList);

      const procsList = (procRes as any)?.data || (Array.isArray(procRes) ? procRes : []);
      setProcedures(procsList);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDentalData();
  }, [selectedPatientId]);

  // Handle Tooth Selection
  const handleSelectTooth = (toothNum: number) => {
    setSelectedToothNumber(toothNum);
    const existing = chart?.teeth?.[toothNum];
    if (existing) {
      setToothFormData({
        status: existing.status || 'HEALTHY',
        surfaces: existing.surfaces || { mesial: false, distal: false, occlusal: false, buccal: false, lingual: false },
        mobilityScore: existing.mobilityScore || 0,
        pocketDepthsMm: existing.pocketDepthsMm || [2, 2, 2, 2, 2, 2],
        bleedingOnProbing: existing.bleedingOnProbing || [false, false, false, false, false, false],
        notes: existing.notes || ''
      });
    } else {
      setToothFormData({
        status: 'HEALTHY',
        surfaces: { mesial: false, distal: false, occlusal: false, buccal: false, lingual: false },
        mobilityScore: 0,
        pocketDepthsMm: [2, 2, 2, 2, 2, 2],
        bleedingOnProbing: [false, false, false, false, false, false],
        notes: ''
      });
    }
    setShowToothModal(true);
  };

  // Save Tooth Changes
  const handleSaveTooth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedToothNumber) return;
    try {
      const res = await api.dental.updateTooth(selectedPatientId, selectedToothNumber, toothFormData);
      if (res?.success) {
        showToast(d.saveChartSuccess || 'Dental chart updated successfully');
        setShowToothModal(false);
        await loadDentalData();
      }
    } catch {
      showToast('Error updating tooth record');
    }
  };

  // Add Tooth to Treatment Plan
  const handleAddToothToPlan = () => {
    if (!selectedToothNumber) return;
    setShowToothModal(false);
    setNewPlanData({
      title: `Treatment Plan for Tooth ${selectedToothNumber}`,
      dentistName: 'Dr. Seng Chanthou',
      items: [
        {
          toothNumber: selectedToothNumber,
          surface: Object.entries(toothFormData.surfaces).filter(([, v]) => v).map(([k]) => k).join(', ') || 'General',
          procedureCode: toothFormData.status === 'CARIES' ? 'D-REST-01' : toothFormData.status === 'MISSING' ? 'D-IMPL-01' : 'D-PREV-01',
          notes: toothFormData.notes || ''
        }
      ]
    });
    setShowNewPlanModal(true);
  };

  // Create New Plan
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.dental.createTreatmentPlan(selectedPatientId, newPlanData);
      if (res?.success) {
        showToast(d.planCreatedSuccess || 'Dental treatment plan created');
        setShowNewPlanModal(false);
        await loadDentalData();
      }
    } catch {
      showToast('Error creating treatment plan');
    }
  };

  // Mark Plan Item Done
  const handleMarkItemDone = async (planId: string, itemId: string) => {
    try {
      const res = await api.dental.updateTreatmentItemStatus(planId, itemId, 'DONE');
      if (res?.success) {
        showToast(d.itemDoneSuccess || 'Treatment procedure marked as completed');
        await loadDentalData();
      }
    } catch {
      showToast('Error updating procedure status');
    }
  };

  // Tooth status color helper
  const getToothStatusColor = (status: string) => {
    switch (status) {
      case 'CARIES':
        return 'border-rose-500 bg-rose-50 text-rose-900';
      case 'FILLED':
        return 'border-blue-500 bg-blue-50 text-blue-900';
      case 'CROWN':
        return 'border-amber-500 bg-amber-50 text-amber-900';
      case 'IMPLANT':
        return 'border-teal-500 bg-teal-50 text-teal-900';
      case 'ROOT_CANAL':
        return 'border-purple-500 bg-purple-50 text-purple-900';
      case 'MISSING':
        return 'border-stone-400 bg-stone-100 text-stone-400 opacity-60';
      case 'FRACTURED':
        return 'border-orange-500 bg-orange-50 text-orange-900';
      case 'IMPACTED':
        return 'border-indigo-500 bg-indigo-50 text-indigo-900';
      default:
        return 'border-stone-200 bg-white text-stone-900 hover:border-teal-500';
    }
  };

  // Render Tooth Anatomical Graphic Box
  const renderToothBox = (toothNum: number) => {
    const tooth = chart?.teeth?.[toothNum];
    const status = tooth?.status || 'HEALTHY';
    const isSelected = selectedToothNumber === toothNum;
    const surfaces = tooth?.surfaces || {};

    return (
      <div
        key={toothNum}
        onClick={() => handleSelectTooth(toothNum)}
        className={`relative flex flex-col items-center justify-between p-1.5 rounded-lg border cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-teal-700 shadow-md' : 'shadow-2xs'
        } ${getToothStatusColor(status)} min-w-[54px] h-[78px] select-none`}
      >
        <span className="text-[10px] font-mono font-bold">{toothNum}</span>

        {/* Anatomical 5-Surface Diagram */}
        <div className="relative w-8 h-8 rounded-sm border border-stone-300 flex items-center justify-center bg-white/80 overflow-hidden">
          {/* Occlusal / Incisal Center */}
          <div
            className={`w-3.5 h-3.5 rounded-2xs border border-stone-300 transition-colors ${
              surfaces.occlusal ? 'bg-rose-500' : 'bg-stone-50'
            }`}
          />
          {/* Buccal (Top) */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              surfaces.buccal ? 'bg-rose-500' : 'bg-transparent'
            }`}
          />
          {/* Lingual (Bottom) */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-1.5 ${
              surfaces.lingual ? 'bg-rose-500' : 'bg-transparent'
            }`}
          />
          {/* Mesial (Left) */}
          <div
            className={`absolute top-1.5 bottom-1.5 left-0 w-1.5 ${
              surfaces.mesial ? 'bg-rose-500' : 'bg-transparent'
            }`}
          />
          {/* Distal (Right) */}
          <div
            className={`absolute top-1.5 bottom-1.5 right-0 w-1.5 ${
              surfaces.distal ? 'bg-rose-500' : 'bg-transparent'
            }`}
          />

          {/* Missing X cross */}
          {status === 'MISSING' && (
            <div className="absolute inset-0 flex items-center justify-center font-bold text-stone-500 text-xs">
              X
            </div>
          )}
        </div>

        <span className="text-[9px] font-bold uppercase truncate max-w-[50px] leading-tight">
          {status === 'HEALTHY' ? '' : status.slice(0, 4)}
        </span>
      </div>
    );
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
            <Sparkles className="w-4 h-4" />
            <span>Phase 15 Clinical Dental Suite</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            {d.title || 'Dental Odontogram Interactive Charting & Treatment Planner'}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {d.subtitle || 'Adult 32-tooth anatomical FDI charting, 5-surface lesion tracking, WHO DMFT index, and procedural cost estimates'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Patient Switcher */}
          <div className="flex items-center bg-stone-100 rounded-lg px-2.5 py-1.5 border border-stone-200 text-xs">
            <span className="text-stone-500 font-semibold mr-2">Patient:</span>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="bg-transparent font-bold text-stone-900 outline-none"
            >
              <option value="PT-1001">PT-1001 (Keo Samnang)</option>
              <option value="PT-1002">PT-1002 (Sok Vicheka)</option>
              <option value="PT-1003">PT-1003 (Chan Monika)</option>
            </select>
          </div>

          <button
            onClick={() => setShowNewPlanModal(true)}
            className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{d.createPlanButton || 'New Treatment Plan'}</span>
          </button>
        </div>
      </div>

      {/* WHO DMFT Index Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <div className="text-xs font-semibold text-stone-500">{d.dmftDecayed || 'Decayed (D)'}</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{chart?.dmftIndex?.decayed ?? 0}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Teeth requiring restoration</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <div className="text-xs font-semibold text-stone-500">{d.dmftMissing || 'Missing (M)'}</div>
          <div className="text-2xl font-black text-stone-600 mt-1">{chart?.dmftIndex?.missing ?? 0}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Extracted or congenital absence</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <div className="text-xs font-semibold text-stone-500">{d.dmftFilled || 'Filled (F)'}</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{chart?.dmftIndex?.filled ?? 0}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Restored or crowned teeth</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <div className="text-xs font-semibold text-stone-500">{d.dmftScore || 'Total DMFT Score'}</div>
          <div className="text-2xl font-black text-stone-900 mt-1">{chart?.dmftIndex?.totalDmft ?? 0}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">WHO standard caries index</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs">
          <div className="text-xs font-semibold text-stone-500">Caries Risk Category</div>
          <div className="mt-1">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              chart?.dmftIndex?.riskCategory === 'LOW'
                ? 'bg-emerald-100 text-emerald-800'
                : chart?.dmftIndex?.riskCategory === 'MODERATE'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {chart?.dmftIndex?.riskCategory || 'LOW'} RISK
            </span>
          </div>
          <div className="text-[11px] text-stone-400 mt-1">Plaque: {chart?.plaqueScorePct || 0}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 flex gap-6 text-xs font-bold">
        {[
          { key: 'chart', label: d.tabChart || 'Odontogram Chart', icon: Sparkles },
          { key: 'plans', label: d.tabTreatmentPlan || 'Treatment Plans', icon: FileText },
          { key: 'procedures', label: d.tabProcedures || 'Dental Fee Schedule', icon: DollarSign }
        ].map((tab) => {
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

      {/* TAB 1: ODONTOGRAM CHART */}
      {activeTab === 'chart' && (
        <div className="space-y-6">
          {/* Status Color Legend */}
          <div className="bg-white rounded-xl p-3 border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-stone-700">Clinical Conditions:</span>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-2xs border border-stone-300 bg-white" />
                <span>{d.statusHealthy || 'Healthy'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-2xs border border-rose-500 bg-rose-50" />
                <span>{d.statusCaries || 'Caries'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-2xs border border-blue-500 bg-blue-50" />
                <span>{d.statusFilled || 'Filled'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-2xs border border-amber-500 bg-amber-50" />
                <span>{d.statusCrown || 'Crown'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-2xs border border-teal-500 bg-teal-50" />
                <span>{d.statusImplant || 'Implant'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-2xs border border-purple-500 bg-purple-50" />
                <span>{d.statusRootCanal || 'Root Canal'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-2xs border border-stone-400 bg-stone-100 text-[9px] text-center font-bold">X</span>
                <span>{d.statusMissing || 'Missing'}</span>
              </span>
            </div>
          </div>

          {/* Interactive Odontogram Chart Grid */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-2xs space-y-8">
            {/* UPPER JAW (MAXILLA) */}
            <div>
              <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-4">
                <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
                  {d.upperJaw || 'Maxilla (Upper Jaw)'}
                </h3>
                <span className="text-xs text-stone-500 font-mono">FDI Adult Dentition 18 to 28</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {/* Quadrant 1: 18 -> 11 */}
                <div className="flex items-center gap-1.5">
                  {upperRightTeeth.map((tn) => renderToothBox(tn))}
                </div>
                {/* Midline separator */}
                <div className="w-px h-16 bg-stone-300 mx-2" />
                {/* Quadrant 2: 21 -> 28 */}
                <div className="flex items-center gap-1.5">
                  {upperLeftTeeth.map((tn) => renderToothBox(tn))}
                </div>
              </div>
            </div>

            {/* LOWER JAW (MANDIBLE) */}
            <div>
              <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-4">
                <h3 className="text-sm font-black text-stone-900 uppercase tracking-wide">
                  {d.lowerJaw || 'Mandible (Lower Jaw)'}
                </h3>
                <span className="text-xs text-stone-500 font-mono">FDI Adult Dentition 48 to 38</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {/* Quadrant 4: 48 -> 41 */}
                <div className="flex items-center gap-1.5">
                  {lowerRightTeeth.map((tn) => renderToothBox(tn))}
                </div>
                {/* Midline separator */}
                <div className="w-px h-16 bg-stone-300 mx-2" />
                {/* Quadrant 3: 31 -> 38 */}
                <div className="flex items-center gap-1.5">
                  {lowerLeftTeeth.map((tn) => renderToothBox(tn))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TREATMENT PLANS */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {treatmentPlans.map((plan) => (
            <div key={plan.planId} className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div>
                  <div className="text-sm font-black text-stone-900">{plan.title}</div>
                  <div className="text-xs text-stone-500 font-mono mt-0.5">
                    Plan ID: {plan.planId} | Dentist: {plan.dentistName}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    plan.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : plan.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {plan.status}
                  </span>
                  <div className="text-sm font-black text-teal-800 font-mono">
                    {formatMoney(plan.totalFeeUsd)}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase">
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5">Tooth</th>
                      <th className="p-2.5">Surface</th>
                      <th className="p-2.5">{d.procedureName || 'Procedure'}</th>
                      <th className="p-2.5 text-right">{d.fee || 'Fee'}</th>
                      <th className="p-2.5 text-center">Status</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {plan.items.map((it: any) => (
                      <tr key={it.itemId} className="hover:bg-stone-50">
                        <td className="p-2.5 font-mono text-stone-500">{it.itemId}</td>
                        <td className="p-2.5 font-mono font-bold text-stone-800">{it.toothNumber || 'All'}</td>
                        <td className="p-2.5 text-stone-600">{it.surface || '-'}</td>
                        <td className="p-2.5 font-medium text-stone-900">{it.procedureName}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-stone-800">
                          {formatMoney(it.feeUsd)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            it.status === 'DONE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {it.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">
                          {it.status === 'PLANNED' && (
                            <button
                              onClick={() => handleMarkItemDone(plan.planId, it.itemId)}
                              className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-[11px] font-bold transition-all"
                            >
                              {d.markDone || 'Mark Done'}
                            </button>
                          )}
                          {it.status === 'DONE' && (
                            <span className="text-[11px] text-stone-400 font-mono">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {treatmentPlans.length === 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center text-stone-400 text-xs">
              No treatment plans for this patient yet. Click &apos;New Treatment Plan&apos; to create one.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DENTAL FEE SCHEDULE */}
      {activeTab === 'procedures' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-stone-900">Official Clinic Dental Fee Schedule</h3>
            <span className="text-xs text-stone-500 font-mono">1 USD = 4,100 KHR</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Code</th>
                  <th className="p-3">Procedure Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Fee (USD)</th>
                  <th className="p-3 text-right">Fee (KHR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {procedures.map((proc) => (
                  <tr key={proc.code} className="hover:bg-stone-50">
                    <td className="p-3 font-mono font-bold text-stone-700">{proc.code}</td>
                    <td className="p-3 font-semibold text-stone-900">{proc.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold">
                        {proc.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-stone-900">${proc.defaultFeeUsd.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-bold text-teal-800">{proc.defaultFeeKhr.toLocaleString()} ៛</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Tooth Detail & Examination Drawer */}
      {showToothModal && selectedToothNumber && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span>Tooth {selectedToothNumber} Examination</span>
              </h3>
              <button
                onClick={() => setShowToothModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTooth} className="p-4 space-y-3.5 text-xs">
              {/* Tooth Condition Status */}
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Tooth Condition Status</label>
                <select
                  value={toothFormData.status}
                  onChange={(e) => setToothFormData({ ...toothFormData, status: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 font-bold"
                >
                  <option value="HEALTHY">{d.statusHealthy || 'Healthy / Sound'}</option>
                  <option value="CARIES">{d.statusCaries || 'Dental Caries / Decay'}</option>
                  <option value="FILLED">{d.statusFilled || 'Restored / Filled'}</option>
                  <option value="CROWN">{d.statusCrown || 'Crown / Bridge Abutment'}</option>
                  <option value="IMPLANT">{d.statusImplant || 'Titanium Implant'}</option>
                  <option value="ROOT_CANAL">{d.statusRootCanal || 'Root Canal Treated'}</option>
                  <option value="MISSING">{d.statusMissing || 'Missing / Extracted'}</option>
                  <option value="FRACTURED">{d.statusFractured || 'Fractured / Chipped'}</option>
                  <option value="IMPACTED">{d.statusImpacted || 'Impacted Wisdom Tooth'}</option>
                </select>
              </div>

              {/* Surface Involvement */}
              <div>
                <label className="block text-stone-600 font-semibold mb-1">Affected Surfaces</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'occlusal', label: d.surfaceOcclusal || 'Occlusal' },
                    { key: 'mesial', label: d.surfaceMesial || 'Mesial' },
                    { key: 'distal', label: d.surfaceDistal || 'Distal' },
                    { key: 'buccal', label: d.surfaceBuccal || 'Buccal' },
                    { key: 'lingual', label: d.surfaceLingual || 'Lingual' }
                  ].map((s) => (
                    <label
                      key={s.key}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer ${
                        (toothFormData.surfaces as any)[s.key]
                          ? 'border-rose-400 bg-rose-50 text-rose-900 font-bold'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(toothFormData.surfaces as any)[s.key]}
                        onChange={(e) =>
                          setToothFormData({
                            ...toothFormData,
                            surfaces: {
                              ...toothFormData.surfaces,
                              [s.key]: e.target.checked
                            }
                          })
                        }
                        className="rounded text-rose-600"
                      />
                      <span className="text-[11px] truncate">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Mobility Score */}
              <div>
                <label className="block text-stone-600 font-semibold mb-1">{d.mobility || 'Mobility Grade'}</label>
                <select
                  value={toothFormData.mobilityScore}
                  onChange={(e) => setToothFormData({ ...toothFormData, mobilityScore: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900"
                >
                  <option value={0}>Grade 0 (Physiological mobility under 0.2mm)</option>
                  <option value={1}>Grade I (Slight horizontal mobility 0.2 to 1mm)</option>
                  <option value={2}>Grade II (Moderate horizontal mobility exceeding 1mm)</option>
                  <option value={3}>Grade III (Severe horizontal and vertical depression)</option>
                </select>
              </div>

              {/* Clinical Notes */}
              <div>
                <label className="block text-stone-600 font-semibold mb-1">{d.toothNotes || 'Clinical Notes'}</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sensitivity to percussion, cold pulp test positive"
                  value={toothFormData.notes}
                  onChange={(e) => setToothFormData({ ...toothFormData, notes: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleAddToothToPlan}
                  className="px-3 py-1.5 rounded-lg border border-teal-300 text-teal-800 font-bold hover:bg-teal-50"
                >
                  {d.addToPlan || 'Add to Plan'}
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowToothModal(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 font-bold hover:bg-stone-50"
                  >
                    {d.cancel || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-stone-900 text-white font-bold hover:bg-black"
                  >
                    {d.saveTooth || 'Update Tooth'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New Treatment Plan */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>{d.createPlanButton || 'New Treatment Plan'}</span>
              </h3>
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">{d.planTitle || 'Plan Title'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quadrant 1 Restorative Plan"
                  value={newPlanData.title}
                  onChange={(e) => setNewPlanData({ ...newPlanData, title: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">Tooth Number</label>
                <input
                  type="number"
                  min={11}
                  max={48}
                  value={newPlanData.items[0]?.toothNumber || 16}
                  onChange={(e) =>
                    setNewPlanData({
                      ...newPlanData,
                      items: [
                        {
                          ...newPlanData.items[0],
                          toothNumber: parseInt(e.target.value) || 16
                        }
                      ]
                    })
                  }
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">{d.procedureName || 'Procedure'}</label>
                <select
                  value={newPlanData.items[0]?.procedureCode}
                  onChange={(e) =>
                    setNewPlanData({
                      ...newPlanData,
                      items: [
                        {
                          ...newPlanData.items[0],
                          procedureCode: e.target.value
                        }
                      ]
                    })
                  }
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-900"
                >
                  {procedures.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name} (${p.defaultFeeUsd})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 font-bold hover:bg-stone-50"
                >
                  {d.cancel || 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-700 text-white font-bold hover:bg-teal-800"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
