'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  PlusCircle,
  FileCheck,
  Cpu,
  BarChart2,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  User,
  QrCode,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';

interface AnalyteResult {
  code: string;
  nameEn: string;
  nameKh: string;
  value: number;
  unit: string;
  minNormal: number;
  maxNormal: number;
  flag: 'NORMAL' | 'LOW' | 'HIGH' | 'PANIC_CRITICAL' | 'DELTA_ALERT';
  deltaPercent?: number;
  previousValue?: number;
  panicAlert: boolean;
}

interface SpecimenAccession {
  accessionNumber: string;
  barcode: string;
  patientId: string;
  patientName: string;
  tubeType: string;
  tubeNameKh: string;
  tubeNameEn: string;
  collectedAt: string;
  phlebotomist: string;
}

interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  panelCode: string;
  panelNameEn: string;
  panelNameKh: string;
  specimen: SpecimenAccession;
  analyzerModel?: string;
  analyzerProtocol: string;
  status: 'ORDERED' | 'COLLECTED' | 'IN_ANALYZER' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'CANCELLED';
  results: AnalyteResult[];
  hasPanicValue: boolean;
  hasDeltaAlert: boolean;
  orderingDoctor: string;
  verifyingPathologist?: string;
  verifiedAt?: string;
  createdAt: string;
}

export default function LabPage() {
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';

  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<'ALL' | 'PANIC' | 'PENDING' | 'VERIFIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Accession modal
  const [showAccessionModal, setShowAccessionModal] = useState<boolean>(false);
  const [accPatientId, setAccPatientId] = useState<string>('PT-1002');
  const [accPatientName, setAccPatientName] = useState<string>('CHHAY Bopha');
  const [accPanel, setAccPanel] = useState<string>('CBC_5DIFF');
  const [accTube, setAccTube] = useState<string>('EDTA_LAVENDER');
  const [accDoctor, setAccDoctor] = useState<string>('Dr. CHAN Vanna');
  const [accPhlebotomist, setAccPhlebotomist] = useState<string>('Meas Channa');

  // Analyzer ingest modal
  const [showIngestModal, setShowIngestModal] = useState<boolean>(false);
  const [ingestProtocol, setIngestProtocol] = useState<'ASTM' | 'HL7'>('ASTM');
  const [ingestModel, setIngestModel] = useState<string>('Mindray BC-5000 Auto Hematology');
  const [rawPacket, setRawPacket] = useState<string>(
    'H|\\^&|||Mindray^BC-5000\r\nR|1|^^^WBC|8.4|10^9/L|4.0-10.0|N\r\nR|2|^^^HGB|14.2|g/dL|12.0-16.5|N\r\nR|3|^^^PLT|260|10^9/L|150-450|N',
  );

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.lis.getOrders();
      setOrders(data);
      if (data.length > 0 && !selectedOrder) {
        setSelectedOrder(data[0]);
      } else if (selectedOrder) {
        const updated = data.find((o) => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [selectedOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleFilterChange = (type: 'ALL' | 'PANIC' | 'PENDING' | 'VERIFIED') => {
    setFilterType(type);
  };

  const filteredOrders = orders.filter((o) => {
    if (filterType === 'PANIC' && !o.hasPanicValue) return false;
    if (filterType === 'PENDING' && o.status !== 'PENDING_VERIFICATION') return false;
    if (filterType === 'VERIFIED' && o.status !== 'VERIFIED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.patientName.toLowerCase().includes(q) ||
        o.patientId.toLowerCase().includes(q) ||
        o.specimen.barcode.includes(q)
      );
    }
    return true;
  });

  const handleVerifyOrder = async (orderId: string) => {
    try {
      const updated = await api.lis.verifyOrder(orderId, {
        pathologistName: 'Dr. SOK Piseth (Pathologist)',
        notes: 'Quality controls verified. Clinically concordant with diagnosis.',
      });
      setSelectedOrder(updated);
      setSuccessToast(t.lab.verifiedSuccess);
      setTimeout(() => setSuccessToast(null), 3500);
      fetchOrders();
    } catch {
      // Catch
    }
  };

  const handleCreateAccession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const panelNames: Record<string, { en: string; kh: string }> = {
        CBC_5DIFF: { en: 'Complete Blood Count (CBC)', kh: 'វិភាគគ្រាប់ឈាមពេញលេញ (CBC)' },
        CMP_METABOLIC: { en: 'Comprehensive Metabolic Panel', kh: 'វិភាគការរំលាយអាហារ និងជាតិស្ករ' },
        LIPID_PROFILE: { en: 'Lipid Panel & Cholesterol', kh: 'វិភាគជាតិខ្លាញ់ក្នុងឈាម' },
        ELECTROLYTES: { en: 'Serum Electrolytes (Na/K/Cl)', kh: 'វិភាគអេឡិចត្រូលីតឈាម' },
      };

      const newOrder = await api.lis.createAccession({
        patientId: accPatientId,
        patientName: accPatientName,
        panelCode: accPanel,
        panelNameEn: panelNames[accPanel]?.en || accPanel,
        panelNameKh: panelNames[accPanel]?.kh || accPanel,
        tubeType: accTube,
        orderingDoctor: accDoctor,
        phlebotomist: accPhlebotomist,
      });

      setShowAccessionModal(false);
      setSuccessToast(t.lab.accessionSuccess);
      setTimeout(() => setSuccessToast(null), 3500);
      setSelectedOrder(newOrder);
      fetchOrders();
    } catch {
      // Catch
    }
  };

  const handleSimulateIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      const updated = await api.lis.ingestResults(selectedOrder.id, {
        rawProtocolPacket: rawPacket,
        analyzerModel: ingestModel,
        protocol: ingestProtocol === 'ASTM' ? 'ASTM_E1394' : 'HL7_V2_ORU',
      });

      setShowIngestModal(false);
      setSuccessToast(t.lab.ingestSuccess);
      setTimeout(() => setSuccessToast(null), 3500);
      setSelectedOrder(updated);
      fetchOrders();
    } catch {
      // Catch
    }
  };

  const totalPanic = orders.filter((o) => o.hasPanicValue).length;
  const totalPending = orders.filter((o) => o.status === 'PENDING_VERIFICATION').length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E1D4]">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                {t.lab.title}
              </h1>
              <p className="text-xs md:text-sm text-slate-500">
                {t.lab.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          {totalPanic > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-pulse">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>{totalPanic} {t.lab.filterPanicOnly}</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{totalPending} {t.lab.filterPendingOnly}</span>
          </div>

          <button
            onClick={() => setShowAccessionModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.lab.newAccessionButton}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKh ? 'ស្វែងរកតាមលេខបាកូដ ឬឈ្មោះ...' : 'Search by barcode or patient...'}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E7E1D4] bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-teal-600"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
          <button
            onClick={() => handleFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
              filterType === 'ALL'
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-slate-600 border-[#E7E1D4] hover:bg-slate-50'
            }`}
          >
            {t.lab.filterAllOrders}
          </button>
          <button
            onClick={() => handleFilterChange('PANIC')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
              filterType === 'PANIC'
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
          >
            {t.lab.filterPanicOnly}
          </button>
          <button
            onClick={() => handleFilterChange('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
              filterType === 'PENDING'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
            }`}
          >
            {t.lab.filterPendingOnly}
          </button>
          <button
            onClick={() => handleFilterChange('VERIFIED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
              filterType === 'VERIFIED'
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            {t.lab.filterVerifiedOnly}
          </button>
        </div>
      </div>

      {/* Main Grid: Orders Master List vs Selected Order Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Specimen Master List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            {t.lab.title} ({filteredOrders.length})
          </div>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs animate-pulse">
                {t.common.loading}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-xl border border-[#E7E1D4]">
                {t.common.none}
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = selectedOrder?.id === ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50/50 border-teal-600 shadow-sm'
                        : 'bg-white border-[#E7E1D4] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {ord.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          ord.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'PENDING_VERIFICATION'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ord.status === 'VERIFIED'
                          ? t.lab.statusVerified
                          : ord.status === 'PENDING_VERIFICATION'
                          ? t.lab.statusPending
                          : t.lab.statusCollected}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 mb-1">
                      {ord.patientName}
                    </div>

                    <div className="text-xs text-slate-500 mb-2">
                      {isKh ? ord.panelNameKh : ord.panelNameEn}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span className="font-mono">{ord.specimen.barcode}</span>
                      <div className="flex items-center gap-1.5">
                        {ord.hasPanicValue && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[9px]">
                            PANIC
                          </span>
                        )}
                        {ord.hasDeltaAlert && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[9px]">
                            DELTA
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Order Results & Pathologist Sign-Off (8 cols) */}
        <div className="lg:col-span-8">
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-[#E7E1D4] shadow-xs p-6 space-y-6">
              {/* Order Detail Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedOrder.patientName}
                    </h2>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {selectedOrder.patientId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        selectedOrder.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedOrder.status === 'PENDING_VERIFICATION'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {selectedOrder.status === 'VERIFIED'
                        ? t.lab.statusVerified
                        : selectedOrder.status === 'PENDING_VERIFICATION'
                        ? t.lab.statusPending
                        : t.lab.statusCollected}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isKh ? selectedOrder.panelNameKh : selectedOrder.panelNameEn} |{' '}
                    {isKh ? selectedOrder.specimen.tubeNameKh : selectedOrder.specimen.tubeNameEn}
                  </p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowIngestModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
                  >
                    <Cpu className="w-4 h-4 text-slate-500" />
                    <span>{t.lab.ingestButton}</span>
                  </button>

                  {selectedOrder.status !== 'VERIFIED' && (
                    <button
                      onClick={() => handleVerifyOrder(selectedOrder.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium shadow-xs transition-colors"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>{t.lab.verifyButton}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Barcode & Specimen Accession Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1 font-medium">{t.lab.specimenTube}</span>
                  <span className="font-semibold text-slate-800">
                    {isKh ? selectedOrder.specimen.tubeNameKh : selectedOrder.specimen.tubeNameEn}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1 font-medium">{t.lab.phlebotomistName}</span>
                  <span className="font-semibold text-slate-800">
                    {selectedOrder.specimen.phlebotomist}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1 font-medium">{t.lab.analyzerProtocol}</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    {selectedOrder.analyzerProtocol} ({selectedOrder.analyzerModel || 'Auto Analyzer'})
                  </span>
                </div>
              </div>

              {/* Critical Alert Banner if Panic or Delta detected */}
              {selectedOrder.hasPanicValue && (
                <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-900 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-rose-800">
                      {t.lab.panicBadge}: Immediate Clinical Notification Required
                    </div>
                    <div className="text-xs text-rose-700 mt-0.5">
                      Critical laboratory values detected exceeding safe physiological thresholds. Attending physician notified.
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.hasDeltaAlert && (
                <div className="p-4 rounded-xl bg-purple-50 border border-purple-300 text-purple-900 flex items-start gap-3">
                  <BarChart2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-purple-800">
                      {t.lab.deltaBadge}: Substantial Longitudinal Variation Detected
                    </div>
                    <div className="text-xs text-purple-700 mt-0.5">
                      Analyte shifted markedly from patient historical baseline. Manual pathologist review required.
                    </div>
                  </div>
                </div>
              )}

              {/* Analyte Results Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                  {t.lab.analyteName} &amp; {t.lab.resultValue}
                </h3>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="py-2.5 px-3">{t.lab.analyteCode}</th>
                        <th className="py-2.5 px-3">{t.lab.analyteName}</th>
                        <th className="py-2.5 px-3 text-right">{t.lab.resultValue}</th>
                        <th className="py-2.5 px-3 text-center">{t.lab.referenceRange}</th>
                        <th className="py-2.5 px-3 text-right">{t.lab.deltaCheck}</th>
                        <th className="py-2.5 px-3 text-center">{t.lab.status}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!selectedOrder.results || selectedOrder.results.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            {t.lab.statusInAnalyzer} - {t.lab.ingestModalDesc}
                          </td>
                        </tr>
                      ) : (
                        selectedOrder.results.map((res) => {
                          const isPanic = res.flag === 'PANIC_CRITICAL';
                          const isDelta = res.flag === 'DELTA_ALERT';
                          const isHigh = res.flag === 'HIGH';
                          const isLow = res.flag === 'LOW';

                          return (
                            <tr
                              key={res.code}
                              className={`hover:bg-slate-50 transition-colors ${
                                isPanic ? 'bg-rose-50/60 font-semibold' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                                {res.code}
                              </td>
                              <td className="py-2.5 px-3 text-slate-800">
                                {isKh ? res.nameKh : res.nameEn}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold">
                                <span
                                  className={`${
                                    isPanic
                                      ? 'text-rose-700 text-sm'
                                      : isHigh || isLow
                                      ? 'text-amber-700'
                                      : 'text-slate-900'
                                  }`}
                                >
                                  {res.value} {res.unit}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                                {res.minNormal} - {res.maxNormal} {res.unit}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {res.deltaPercent !== undefined ? (
                                  <span
                                    className={`inline-flex items-center gap-0.5 font-mono text-[11px] ${
                                      isDelta
                                        ? 'text-purple-700 font-bold'
                                        : 'text-slate-500'
                                    }`}
                                  >
                                    {res.deltaPercent > 0 ? (
                                      <ArrowUpRight className="w-3 h-3 text-rose-500" />
                                    ) : (
                                      <ArrowDownRight className="w-3 h-3 text-blue-500" />
                                    )}
                                    <span>{res.deltaPercent > 0 ? `+${res.deltaPercent}` : res.deltaPercent}%</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono">-</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isPanic
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : isDelta
                                      ? 'bg-purple-100 text-purple-800'
                                      : isHigh || isLow
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {res.flag}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pathologist Verification Signature Footer */}
              {selectedOrder.status === 'VERIFIED' && (
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {t.lab.statusVerified}: <strong className="text-slate-800">{selectedOrder.verifyingPathologist}</strong>
                    </span>
                  </div>
                  <span className="font-mono text-slate-400">
                    {selectedOrder.verifiedAt ? new Date(selectedOrder.verifiedAt).toLocaleString() : ''}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-[#E7E1D4]">
              {t.common.none}
            </div>
          )}
        </div>
      </div>

      {/* Accession Modal */}
      {showAccessionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-teal-700" />
                <span>{t.lab.accessionModalTitle}</span>
              </h3>
              <button
                onClick={() => setShowAccessionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccession} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {t.lab.patientName}
                  </label>
                  <input
                    type="text"
                    required
                    value={accPatientName}
                    onChange={(e) => setAccPatientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Patient ID
                  </label>
                  <input
                    type="text"
                    required
                    value={accPatientId}
                    onChange={(e) => setAccPatientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-teal-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t.lab.panelName}
                </label>
                <select
                  value={accPanel}
                  onChange={(e) => setAccPanel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-teal-600"
                >
                  <option value="CBC_5DIFF">Complete Blood Count (CBC 5-Diff)</option>
                  <option value="CMP_METABOLIC">Comprehensive Metabolic Panel (CMP)</option>
                  <option value="LIPID_PROFILE">Fasting Lipid Profile</option>
                  <option value="ELECTROLYTES">Serum Electrolyte Panel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t.lab.selectTube}
                </label>
                <select
                  value={accTube}
                  onChange={(e) => setAccTube(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-teal-600"
                >
                  <option value="EDTA_LAVENDER">EDTA Lavender (Hematology / CBC)</option>
                  <option value="SERUM_RED_GOLD">Clot Activator Red/Gold (Biochemistry / SST)</option>
                  <option value="SODIUM_CITRATE_BLUE">Sodium Citrate Blue (Coagulation / PT/INR)</option>
                  <option value="HEPARIN_GREEN">Lithium Heparin Green</option>
                  <option value="FLUORIDE_GREY">Sodium Fluoride Grey (Glucose)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {t.lab.phlebotomistName}
                  </label>
                  <input
                    type="text"
                    required
                    value={accPhlebotomist}
                    onChange={(e) => setAccPhlebotomist(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {t.lab.orderingDoctor}
                  </label>
                  <input
                    type="text"
                    required
                    value={accDoctor}
                    onChange={(e) => setAccDoctor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAccessionModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium shadow-xs"
                >
                  {t.lab.createAccessionSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analyzer Ingestion Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-teal-700" />
                <span>{t.lab.ingestModalTitle}</span>
              </h3>
              <button
                onClick={() => setShowIngestModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateIngest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t.lab.selectAnalyzer}
                </label>
                <input
                  type="text"
                  required
                  value={ingestModel}
                  onChange={(e) => setIngestModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Protocol Standard
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={ingestProtocol === 'ASTM'}
                      onChange={() => {
                        setIngestProtocol('ASTM');
                        setRawPacket(
                          'H|\\^&|||Mindray^BC-5000\r\nR|1|^^^WBC|8.4|10^9/L|4.0-10.0|N\r\nR|2|^^^HGB|14.2|g/dL|12.0-16.5|N\r\nR|3|^^^PLT|260|10^9/L|150-450|N',
                        );
                      }}
                    />
                    <span>{t.lab.protocolAstm}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={ingestProtocol === 'HL7'}
                      onChange={() => {
                        setIngestProtocol('HL7');
                        setRawPacket(
                          'MSH|^~\\&|ARCHITECT|ABBOTT|LIS\r\nOBX|1|NM|GLU^Glucose||105|mg/dL|70-110|N\r\nOBX|2|NM|CREA^Creatinine||1.1|mg/dL|0.6-1.2|N\r\nOBX|3|NM|K_PLUS^Potassium||4.4|mmol/L|3.5-5.1|N',
                        );
                      }}
                    />
                    <span>{t.lab.protocolHl7}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {t.lab.pastePacketPlaceholder}
                </label>
                <textarea
                  rows={5}
                  required
                  value={rawPacket}
                  onChange={(e) => setRawPacket(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:outline-hidden focus:border-teal-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIngestModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium shadow-xs"
                >
                  {t.lab.submitIngest}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
