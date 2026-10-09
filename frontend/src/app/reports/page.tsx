'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Banknote,
  QrCode,
  Users,
  Activity,
  Printer,
  Download,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  Stethoscope,
  Pill,
  ArrowUpRight,
  FileText,
} from 'lucide-react';

export default function ReportsPage() {
  const { locale } = useTranslation();
  const isKm = locale === 'km';

  const [invoices, setInvoices] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Date range state
  const [datePreset, setDatePreset] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'LAST30' | 'ALL' | 'CUSTOM'>('MONTH');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invList, visitList, patList] = await Promise.all([
        api.payments.listInvoices(),
        api.visits.list(),
        api.patients.list({ limit: 1000 }),
      ]);
      setInvoices(invList || []);
      setVisits(visitList || []);
      const patArray = Array.isArray(patList) ? patList : patList?.data || [];
      setPatients(patArray);
    } catch (err) {
      console.error('Failed to load reports data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick preset dates setter
  const applyPreset = (preset: 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'LAST30' | 'ALL') => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'YESTERDAY') {
      const y = new Date();
      y.setDate(now.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === 'WEEK') {
      const w = new Date();
      w.setDate(now.getDate() - 7);
      setStartDate(w.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'MONTH') {
      const m = new Date();
      m.setDate(1);
      setStartDate(m.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'LAST30') {
      const l = new Date();
      l.setDate(now.getDate() - 30);
      setStartDate(l.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Filter items within selected date range
  const filteredData = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    const filteredInvoices = invoices.filter((inv) => {
      const invDate = new Date(inv.createdAt);
      if (start && invDate < start) return false;
      if (end && invDate > end) return false;
      return true;
    });

    const filteredVisits = visits.filter((v) => {
      const vDate = new Date(v.createdAt);
      if (start && vDate < start) return false;
      if (end && vDate > end) return false;
      return true;
    });

    const filteredPatients = patients.filter((p) => {
      const pDate = new Date(p.createdAt);
      if (start && pDate < start) return false;
      if (end && pDate > end) return false;
      return true;
    });

    return { filteredInvoices, filteredVisits, filteredPatients };
  }, [invoices, visits, patients, startDate, endDate]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let khqrRevenue = 0;
    let cashRevenue = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let khqrCount = 0;
    let cashCount = 0;

    filteredData.filteredInvoices.forEach((inv) => {
      const amt = Number(inv.payableAmount) || 0;
      if (inv.status === 'PAID') {
        totalRevenue += amt;
        paidCount++;
        if (inv.paymentMethod === 'KHQR' || inv.paymentMethod === 'ABA') {
          khqrRevenue += amt;
          khqrCount++;
        } else {
          cashRevenue += amt;
          cashCount++;
        }
      } else {
        unpaidCount++;
      }
    });

    const completedVisits = filteredData.filteredVisits.filter((v) => v.status === 'COMPLETED').length;
    const avgTicket = paidCount > 0 ? totalRevenue / paidCount : 0;
    const khqrPercentage = totalRevenue > 0 ? Math.round((khqrRevenue / totalRevenue) * 100) : 0;
    const cashPercentage = totalRevenue > 0 ? 100 - khqrPercentage : 0;

    return {
      totalRevenue,
      khqrRevenue,
      cashRevenue,
      paidCount,
      unpaidCount,
      khqrCount,
      cashCount,
      completedVisits,
      totalVisits: filteredData.filteredVisits.length,
      newPatients: filteredData.filteredPatients.length,
      avgTicket,
      khqrPercentage,
      cashPercentage,
    };
  }, [filteredData]);

  // Daily revenue breakdown grouped by date
  const dailyBreakdown = useMemo(() => {
    const map = new Map<string, { date: string; count: number; khqr: number; cash: number; total: number }>();

    filteredData.filteredInvoices.forEach((inv) => {
      if (inv.status !== 'PAID') return;
      const dateKey = new Date(inv.createdAt).toISOString().split('T')[0];
      const amt = Number(inv.payableAmount) || 0;
      const isKhqr = inv.paymentMethod === 'KHQR' || inv.paymentMethod === 'ABA';

      if (!map.has(dateKey)) {
        map.set(dateKey, { date: dateKey, count: 0, khqr: 0, cash: 0, total: 0 });
      }
      const entry = map.get(dateKey)!;
      entry.count += 1;
      entry.total += amt;
      if (isKhqr) {
        entry.khqr += amt;
      } else {
        entry.cash += amt;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredData]);

  // Doctor breakdown
  const doctorBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; count: number; completed: number }>();
    filteredData.filteredVisits.forEach((v) => {
      const docName = v.doctor?.fullNameEn ? `Dr. ${v.doctor.fullNameEn}` : 'Attending Medical Officer';
      if (!map.has(docName)) {
        map.set(docName, { name: docName, count: 0, completed: 0 });
      }
      const entry = map.get(docName)!;
      entry.count += 1;
      if (v.status === 'COMPLETED') entry.completed += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredData]);

  // Export to CSV
  const handleExportCsv = () => {
    if (dailyBreakdown.length === 0) return;
    const headers = ['Date', 'Invoices Settled', 'KHQR Amount (USD)', 'Cash Amount (USD)', 'Total (USD)', 'Approx KHR'];
    const rows = dailyBreakdown.map((row) => [
      row.date,
      row.count,
      row.khqr.toFixed(2),
      row.cash.toFixed(2),
      row.total.toFixed(2),
      Math.round(row.total * 4100),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rotana_clinic_revenue_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-800" />
            <span>{isKm ? 'របាយការណ៍ហិរញ្ញវត្ថុ & ស្ថិតិប្រតិបត្តិការ' : 'Financial Revenue & Operations Reports'}</span>
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            {isKm
              ? 'ត្រួតពិនិត្យចំណូលតាមកាលបរិច្ឆេទ ការទូទាត់ KHQR vs សាច់ប្រាក់ និងស្ថិតិព្យាបាល'
              : 'Audit period collections, KHQR vs cash settlement distribution, and clinical throughput'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-stone-800 border border-[#E5DFD2] rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>{isKm ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] text-stone-800 border border-[#E5DFD2] rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600" />
            <span>{isKm ? 'បោះពុម្ព' : 'Print Report'}</span>
          </button>

          <button
            type="button"
            onClick={fetchData}
            className="p-2 text-stone-600 hover:text-stone-900 bg-[#FAF7F2] border border-[#E5DFD2] rounded-xl shadow-2xs transition-all active:scale-95"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Filter Ribbon */}
      <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E7E1D4] shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-stone-500 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>{isKm ? 'ចន្លោះពេល:' : 'Period:'}</span>
            </span>

            {[
              { id: 'TODAY', labelKm: 'ថ្ងៃនេះ', labelEn: 'Today' },
              { id: 'YESTERDAY', labelKm: 'ម្សិលមិញ', labelEn: 'Yesterday' },
              { id: 'WEEK', labelKm: '៧ ថ្ងៃចុងក្រោយ', labelEn: 'Last 7 Days' },
              { id: 'MONTH', labelKm: 'ខែនេះ', labelEn: 'This Month' },
              { id: 'LAST30', labelKm: '៣០ ថ្ងៃ', labelEn: 'Last 30 Days' },
              { id: 'ALL', labelKm: 'ទាំងអស់', labelEn: 'All Time' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  datePreset === p.id
                    ? 'bg-stone-900 text-white font-semibold shadow-xs'
                    : 'bg-[#F2EDE2] text-stone-700 hover:bg-[#EBE4D6]'
                }`}
              >
                {isKm ? p.labelKm : p.labelEn}
              </button>
            ))}
          </div>

          {/* Exact Date Inputs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#EFEAE0]">
            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <span className="text-[11px] text-stone-500 font-medium">{isKm ? 'ចាប់ពី:' : 'From:'}</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="px-2.5 py-1.5 bg-[#F5EFE4] border border-[#DFD6C6] rounded-lg text-xs font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <span className="text-[11px] text-stone-500 font-medium">{isKm ? 'ដល់:' : 'To:'}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('CUSTOM');
                }}
                className="px-2.5 py-1.5 bg-[#F5EFE4] border border-[#DFD6C6] rounded-lg text-xs font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>
          </div>
        </div>

        {/* Selected Range Badge */}
        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-[#F2EDE2]">
          <div className="flex items-center gap-2">
            <span className="font-medium text-stone-700">
              {isKm ? 'កាលបរិច្ឆេទដែលបានជ្រើស:' : 'Active Date Range:'}
            </span>
            <span className="font-mono bg-[#F2EDE2] px-2 py-0.5 rounded border border-[#E5DFD2] text-stone-800 font-semibold">
              {startDate || 'Beginning'} &rarr; {endDate || 'Present'}
            </span>
          </div>
          <div>
            <span>
              {isKm
                ? `ទិន្នន័យ: ${filteredData.filteredInvoices.length} វិក្កយបត្រ, ${filteredData.filteredVisits.length} វត្តមាន`
                : `Audited: ${filteredData.filteredInvoices.length} invoices, ${filteredData.filteredVisits.length} visits`}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Performance KPI Ribbon (4 Cards in Milk-Coffee & 3D styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Settled Revenue */}
        <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E7E1D4] shadow-xs card-3d relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-600">
              {isKm ? 'ចំណូលទូទាត់រួចសរុប' : 'Total Settled Revenue'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-800 mt-2 font-mono">
            ${metrics.totalRevenue.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 pt-2 border-t border-[#F2ECE0]">
            <span>≈ {Math.round(metrics.totalRevenue * 4100).toLocaleString()} ៛</span>
            <span className="text-emerald-700 font-semibold">{metrics.paidCount} txns</span>
          </div>
        </div>

        {/* Dynamic KHQR Revenue */}
        <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E7E1D4] shadow-xs card-3d relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-600">
              {isKm ? 'ទូទាត់តាម KHQR (ABA & Bakong)' : 'KHQR Digital Settlement'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-900 mt-2 font-mono">
            ${metrics.khqrRevenue.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 pt-2 border-t border-[#F2ECE0]">
            <span>{metrics.khqrPercentage}% of total</span>
            <span className="text-teal-800 font-semibold">{metrics.khqrCount} scans</span>
          </div>
        </div>

        {/* Cash Collected */}
        <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E7E1D4] shadow-xs card-3d relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-600">
              {isKm ? 'ទទួលជាប្រាក់សុទ្ធ (Cash Desk)' : 'Cash Counter Collections'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-2 font-mono">
            ${metrics.cashRevenue.toFixed(2)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 pt-2 border-t border-[#F2ECE0]">
            <span>{metrics.cashPercentage}% of total</span>
            <span className="text-amber-800 font-semibold">{metrics.cashCount} cash</span>
          </div>
        </div>

        {/* Clinical Operations Summary */}
        <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E7E1D4] shadow-xs card-3d relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-600">
              {isKm ? 'វត្តមានពិគ្រោះ & អ្នកជំងឺថ្មី' : 'Encounters & Enrollments'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900 mt-2 font-mono">
            {metrics.completedVisits} <span className="text-xs font-normal text-stone-400">/ {metrics.totalVisits}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2 pt-2 border-t border-[#F2ECE0]">
            <span>Avg: ${metrics.avgTicket.toFixed(2)}</span>
            <span className="text-blue-700 font-semibold">+{metrics.newPatients} new</span>
          </div>
        </div>
      </div>

      {/* Payment Channel Comparison Visualizer */}
      <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E7E1D4] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900">
            {isKm ? 'សមាមាត្របណ្តាញទូទាត់ (Payment Channels)' : 'Settlement Channel Ratio'}
          </h2>
          <span className="text-xs font-mono text-stone-500">
            1 USD = 4,100 KHR
          </span>
        </div>

        <div className="w-full bg-[#EFE8DC] h-3.5 rounded-full overflow-hidden flex">
          <div
            className="bg-teal-700 h-full transition-all duration-700"
            style={{ width: `${metrics.khqrPercentage}%` }}
            title={`KHQR: ${metrics.khqrPercentage}%`}
          />
          <div
            className="bg-amber-600 h-full transition-all duration-700"
            style={{ width: `${metrics.cashPercentage}%` }}
            title={`Cash: ${metrics.cashPercentage}%`}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-700 inline-block" />
            <span>
              KHQR Dynamic ({metrics.khqrPercentage}%): <strong>${metrics.khqrRevenue.toFixed(2)}</strong> (≈ {Math.round(metrics.khqrRevenue * 4100).toLocaleString()} ៛)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
            <span>
              Cash Desk ({metrics.cashPercentage}%): <strong>${metrics.cashRevenue.toFixed(2)}</strong> (≈ {Math.round(metrics.cashRevenue * 4100).toLocaleString()} ៛)
            </span>
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E7E1D4] flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-600" />
            <span>{isKm ? 'តារាងចំណូលតាមកាលបរិច្ឆេទនីមួយៗ (Daily Breakdown)' : 'Daily Revenue Breakdown Table'}</span>
          </h2>
          <span className="text-xs text-stone-500 font-mono">
            {dailyBreakdown.length} {isKm ? 'ថ្ងៃមានប្រតិបត្តិការ' : 'settled days'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-500">
            <div className="w-7 h-7 border-2 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">{isKm ? 'កំពុងទាញយកទិន្នន័យ...' : 'Loading report entries...'}</p>
          </div>
        ) : dailyBreakdown.length === 0 ? (
          <div className="p-10 text-center text-stone-400 text-xs">
            {isKm ? 'មិនមានទិន្នន័យចំណូលក្នុងចន្លោះកាលបរិច្ឆេទនេះឡើយ។' : 'No revenue records found for this period.'}
          </div>
        ) : (
          <div className="overflow-x-auto touch-scroll">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F5EFE4] text-stone-700 font-semibold border-b border-[#E7E1D4]">
                <tr>
                  <th className="py-3 px-4">{isKm ? 'កាលបរិច្ឆេទ (Date)' : 'Date'}</th>
                  <th className="py-3 px-4">{isKm ? 'វិក្កយបត្រ (Invoices)' : 'Invoices'}</th>
                  <th className="py-3 px-4">{isKm ? 'KHQR ($)' : 'KHQR ($)'}</th>
                  <th className="py-3 px-4">{isKm ? 'ប្រាក់សុទ្ធ ($)' : 'Cash ($)'}</th>
                  <th className="py-3 px-4 text-right">{isKm ? 'សរុប (USD)' : 'Total (USD)'}</th>
                  <th className="py-3 px-4 text-right">{isKm ? 'សមមូលជាប្រាក់រៀល (KHR)' : 'Approx (KHR)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEAE0]">
                {dailyBreakdown.map((row) => (
                  <tr key={row.date} className="hover:bg-[#F8F4EC] transition-colors font-mono">
                    <td className="py-3 px-4 font-semibold text-stone-900">{row.date}</td>
                    <td className="py-3 px-4 text-stone-600">{row.count} txns</td>
                    <td className="py-3 px-4 text-teal-800 font-medium">${row.khqr.toFixed(2)}</td>
                    <td className="py-3 px-4 text-amber-800 font-medium">${row.cash.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-stone-900">${row.total.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right text-stone-600">
                      ≈ {Math.round(row.total * 4100).toLocaleString()} ៛
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-[#F2ECE0] font-semibold text-stone-900 border-t border-[#E7E1D4]">
                <tr className="font-mono">
                  <td className="py-3 px-4">{isKm ? 'សរុបរួម' : 'Period Total'}</td>
                  <td className="py-3 px-4">{metrics.paidCount} txns</td>
                  <td className="py-3 px-4 text-teal-900">${metrics.khqrRevenue.toFixed(2)}</td>
                  <td className="py-3 px-4 text-amber-900">${metrics.cashRevenue.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-emerald-900 font-bold">${metrics.totalRevenue.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-stone-700">
                    ≈ {Math.round(metrics.totalRevenue * 4100).toLocaleString()} ៛
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Doctor & Physician Activity Table */}
      <div className="bg-[#FDFBF7] rounded-2xl border border-[#E7E1D4] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E7E1D4] flex items-center justify-between">
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-800" />
            <span>{isKm ? 'សកម្មភាពពិគ្រោះតាមគ្រូពេទ្យ (Physician Activity)' : 'Physician Encounters & Consultations'}</span>
          </h2>
          <span className="text-xs text-stone-500 font-mono">
            {metrics.completedVisits} {isKm ? 'បានបញ្ចប់' : 'completed'}
          </span>
        </div>

        {doctorBreakdown.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs">
            {isKm ? 'មិនមានទិន្នន័យពិគ្រោះក្នុងចន្លោះកាលបរិច្ឆេទនេះឡើយ។' : 'No clinical encounters in selected period.'}
          </div>
        ) : (
          <div className="divide-y divide-[#EFEAE0]">
            {doctorBreakdown.map((doc) => (
              <div key={doc.name} className="p-4 flex items-center justify-between hover:bg-[#F8F4EC] transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#F2EDE2] border border-[#DFD7C7] flex items-center justify-center text-stone-700 font-bold text-xs">
                    {doc.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900">{doc.name}</div>
                    <div className="text-[11px] text-stone-500">
                      {isKm ? 'បានពិនិត្យបញ្ចប់' : 'Completed'}: {doc.completed} encounters
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-stone-900">{doc.count} visits</div>
                  <div className="text-[10px] text-stone-500">
                    {metrics.totalVisits > 0 ? Math.round((doc.count / metrics.totalVisits) * 100) : 0}% of period
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
