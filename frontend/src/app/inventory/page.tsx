'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Building2,
  Truck,
  AlertTriangle,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
  Clock,
  ShieldAlert,
  Calendar,
  Layers,
  MapPin,
  Phone,
  UserCheck,
  ChevronRight,
  Barcode,
} from 'lucide-react';
import { useTranslation } from '../../context/I18nContext';
import { api } from '../../lib/api';

export default function InventoryWarehousePage() {
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'hq' | 'inventory' | 'transfers' | 'verification'>('hq');

  // Filters & State
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [overview, setOverview] = useState<any | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Barcode Verification State
  const [scanManifestCode, setScanManifestCode] = useState<string>('');
  const [scannedTransfer, setScannedTransfer] = useState<any | null>(null);
  const [verifiedItems, setVerifiedItems] = useState<{ [batchNumber: string]: number }>({});
  const [discrepancyNote, setDiscrepancyNote] = useState<string>('');
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Transfer Creation Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTransferSource, setNewTransferSource] = useState<string>('branch-hq');
  const [newTransferTarget, setNewTransferTarget] = useState<string>('branch-tk');
  const [newTransferBatchId, setNewTransferBatchId] = useState<string>('');
  const [newTransferQty, setNewTransferQty] = useState<number>(10);
  const [newTransferNotes, setNewTransferNotes] = useState<string>('');
  const [autoDispatch, setAutoDispatch] = useState<boolean>(false);
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);

  // Load initial data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [branchesRes, overviewRes, batchesRes, transfersRes] = await Promise.all([
        api.warehouse.getBranches(),
        api.warehouse.getHqOverview(),
        api.warehouse.getInventoryBatches(selectedBranchId || undefined),
        api.warehouse.getTransfers(selectedBranchId || undefined),
      ]);

      setBranches(branchesRes || []);
      setOverview(overviewRes || null);
      setBatches(batchesRes || []);
      setTransfers(transfersRes || []);

      if (batchesRes && batchesRes.length > 0 && !newTransferBatchId) {
        setNewTransferBatchId(batchesRes[0].id);
      }
    } catch (err) {
      console.error('Failed to load warehouse data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranchId]);

  // Handle Find Manifest for Inbound Scanning
  const handleLookupManifest = async (codeToSearch?: string) => {
    const code = (codeToSearch || scanManifestCode).trim();
    if (!code) return;

    setVerificationFeedback(null);
    try {
      const result = await api.warehouse.getTransferById(code);
      setScannedTransfer(result);
      // Initialize verified quantities to dispatched quantities
      const initialMap: { [batchNumber: string]: number } = {};
      if (result.items) {
        result.items.forEach((it: any) => {
          initialMap[it.batchNumber] = it.dispatchedQty;
        });
      }
      setVerifiedItems(initialMap);
    } catch (err: any) {
      setVerificationFeedback(isKh ? 'រកមិនឃើញលិខិតផ្ទេរទេ' : 'Transfer manifest was not found.');
      setScannedTransfer(null);
    }
  };

  // Submit Inbound Receipt
  const handleConfirmReceipt = async () => {
    if (!scannedTransfer) return;
    setIsVerifying(true);
    setVerificationFeedback(null);

    try {
      const payload = {
        receivedBy: isKh ? 'ឱសថការីទទួលស្តុក' : 'Receiving Staff',
        scannedManifestBarcode: scannedTransfer.manifestBarcode,
        discrepancyNote: discrepancyNote.trim() || undefined,
        items: scannedTransfer.items.map((it: any) => ({
          batchNumber: it.batchNumber,
          scannedBarcode: it.barcode,
          verifiedQuantity: verifiedItems[it.batchNumber] ?? it.dispatchedQty,
        })),
      };

      const updated = await api.warehouse.verifyAndReceiveTransfer(scannedTransfer.id, payload);
      setScannedTransfer(updated);
      setVerificationFeedback(t.warehouse.receiveSuccessToast);
      fetchData();
    } catch (err: any) {
      setVerificationFeedback(err.message || 'Receipt verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Dispatch Draft Transfer
  const handleDispatch = async (transferId: string, manifestBarcode: string) => {
    try {
      await api.warehouse.dispatchTransfer(transferId, {
        dispatchedBy: isKh ? 'អ្នកបញ្ជូនស្តុក HQ' : 'HQ Dispatcher',
        scannedBarcode: manifestBarcode,
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    }
  };

  // Create Transfer Manifest
  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTransferSource === newTransferTarget) {
      setCreateFeedback(t.warehouse.sourceSameAsTarget);
      return;
    }
    if (!newTransferBatchId || newTransferQty <= 0) {
      setCreateFeedback(t.warehouse.errorNoItems);
      return;
    }

    try {
      await api.warehouse.createTransfer({
        sourceBranchId: newTransferSource,
        targetBranchId: newTransferTarget,
        notes: newTransferNotes,
        autoDispatch,
        dispatchedBy: autoDispatch ? (isKh ? 'អ្នកបញ្ជូនស្តុក' : 'Dispatcher') : undefined,
        items: [{ batchId: newTransferBatchId, quantity: Number(newTransferQty) }],
      });
      setIsCreateModalOpen(false);
      setNewTransferNotes('');
      setCreateFeedback(null);
      fetchData();
    } catch (err: any) {
      setCreateFeedback(err.message || 'Failed to create transfer');
    }
  };

  // Filtered batches by search
  const filteredBatches = batches.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.medicineName?.toLowerCase().includes(q) ||
      b.genericName?.toLowerCase().includes(q) ||
      b.sku?.toLowerCase().includes(q) ||
      b.batchNumber?.toLowerCase().includes(q) ||
      b.barcode?.includes(q)
    );
  });

  // Helper for expiry severity badge
  const renderExpiryBadge = (severity: string, daysLeft: number) => {
    if (severity === 'CRITICAL_EXPIRED' || daysLeft <= 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
          <ShieldAlert className="w-3 h-3 mr-1" />
          {t.warehouse.expired} ({Math.abs(daysLeft)} {t.warehouse.daysAgo})
        </span>
      );
    }
    if (severity === 'CRITICAL_30_DAYS' || daysLeft <= 30) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {daysLeft} {t.warehouse.daysLeft} (30d)
        </span>
      );
    }
    if (severity === 'WARNING_60_DAYS' || daysLeft <= 60) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 mr-1" />
          {daysLeft} {t.warehouse.daysLeft} (60d)
        </span>
      );
    }
    if (severity === 'NOTICE_90_DAYS' || daysLeft <= 90) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          {daysLeft} {t.warehouse.daysLeft} (90d)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {daysLeft} {t.warehouse.daysLeft}
      </span>
    );
  };

  // Helper for transfer status pill
  const renderTransferStatus = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
            {t.warehouse.draftStatus}
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Truck className="w-3 h-3 mr-1" />
            {t.warehouse.inTransitStatus}
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t.warehouse.receivedStatus}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#E7E1D4] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t.warehouse.title}</h1>
              <p className="text-sm text-gray-600">{t.warehouse.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Switcher */}
          <div className="flex items-center gap-2 bg-[#FDFBF7] border border-[#E7E1D4] px-3 py-1.5 rounded-xl text-sm">
            <Building2 className="w-4 h-4 text-gray-500" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent font-medium text-gray-800 focus:outline-hidden cursor-pointer"
            >
              <option value="">{t.warehouse.allBranches}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branchCode} - {isKh ? b.nameKh : b.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* New Transfer Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#111827] text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t.warehouse.createTransferButton}
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2 border border-[#E7E1D4] rounded-xl hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Executive KPI Metrics */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Network Valuation */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7E1D4] shadow-2xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              {t.warehouse.totalValuation}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-gray-900">
                ${overview.totalValuationUsd?.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {overview.totalValuationKhr?.toLocaleString()} KHR
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {overview.branchesCount} {isKh ? 'ទីតាំងសាខា និងឃ្លាំង' : 'Active Branches & Depots'}
            </p>
          </div>

          {/* Total Active Stock Units */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7E1D4] shadow-2xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              {t.warehouse.totalUnits}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-gray-900">
                {overview.totalStockUnits?.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {overview.totalBatchesCount} {isKh ? 'ឡូត៍ថ្នាំ' : 'Batches'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {overview.lowStockBatches?.length || 0} {isKh ? 'មុខថ្នាំជិតអស់ពីស្តុក' : 'Low stock alerts (<20 units)'}
            </p>
          </div>

          {/* In-Transit Transfers */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7E1D4] shadow-2xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              {t.warehouse.transfersInTransit}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-blue-700">
                {overview.transfersInTransitCount}
              </span>
              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                <Truck className="w-3 h-3 inline mr-1" />
                {isKh ? 'កំពុងដឹក' : 'On Route'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {isKh ? 'ត្រូវការផ្ទៀងផ្ទាត់បាកូដពេលទៅដល់' : 'Require inbound barcode verification'}
            </p>
          </div>

          {/* Critical Expiry Radar */}
          <div className="bg-white p-5 rounded-2xl border border-[#E7E1D4] shadow-2xs">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              {t.warehouse.criticalExpiryAlerts}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black text-red-600">
                {(overview.expiryAlerts?.expiredCount || 0) + (overview.expiryAlerts?.within30DaysCount || 0)}
              </span>
              <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                {overview.expiryAlerts?.within90DaysCount || 0} {isKh ? 'ក្រោម ៩០ ថ្ងៃ' : '<90d notice'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {overview.expiryAlerts?.within30DaysCount || 0} {isKh ? 'ក្រោម ៣០ ថ្ងៃ' : '<30d'} |{' '}
              {overview.expiryAlerts?.within60DaysCount || 0} {isKh ? 'ក្រោម ៦០ ថ្ងៃ' : '<60d'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#E7E1D4] space-x-1 sm:space-x-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hq')}
          className={`py-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'hq'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          {t.warehouse.hqOverviewTab}
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4 inline mr-2" />
          {t.warehouse.inventoryBatchesTab}
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`py-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'transfers'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Truck className="w-4 h-4 inline mr-2" />
          {t.warehouse.transfersTab}
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`py-3 px-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'verification'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Barcode className="w-4 h-4 inline mr-2" />
          {t.warehouse.verificationTab}
        </button>
      </div>

      {/* TAB 1: HQ Overview & Branches */}
      {activeTab === 'hq' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overview.branchBreakdown?.map((br: any) => {
              const branchMeta = branches.find((b) => b.id === br.branchId);
              return (
                <div
                  key={br.branchId}
                  className="bg-white p-5 rounded-2xl border border-[#E7E1D4] shadow-2xs hover:border-gray-400 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-300">
                          {br.branchCode}
                        </span>
                        {br.isWarehouse ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {t.warehouse.centralWarehouse}
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {t.warehouse.clinicBranch}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mt-2">
                        {isKh ? br.nameKh : br.nameEn}
                      </h3>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedBranchId(br.branchId);
                        setActiveTab('inventory');
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      {isKh ? 'មើលស្តុក' : 'View Stock'}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {branchMeta && (
                    <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{isKh ? branchMeta.addressKh : branchMeta.addressEn}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{branchMeta.phone}</span>
                      </div>
                      {branchMeta.managerName && (
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>
                            {t.warehouse.manager}: {branchMeta.managerName}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-[#F2EEE9] grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-xs text-gray-500 block">{t.warehouse.stockUnits}</span>
                      <span className="font-bold text-gray-900 text-sm">{br.totalStockUnits}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">{t.warehouse.valuation}</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        ${br.valuationUsd?.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">
                        {t.warehouse.criticalExpiryAlerts}
                      </span>
                      <span
                        className={`font-bold text-sm ${
                          br.criticalAlertsCount > 0 ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {br.criticalAlertsCount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Inventory Batches & FEFO Expiration Radar */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={isKh ? 'ស្វែងរកតាមឈ្មោះថ្នាំ, SKU, លេខឡូត៍, ឬបាកូដ...' : 'Search medicine, SKU, batch, or barcode...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#E7E1D4] rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-gray-900 bg-white"
              />
            </div>

            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                {t.warehouse.fefoBadge}
              </span>
              <span>{isKh ? 'តម្រៀបតាមកាលបរិច្ឆេទជិតផុតកំណត់មុន' : 'Sorted First Expired, First Out'}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7E1D4] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#FDFBF7] border-b border-[#E7E1D4] text-gray-600 text-xs uppercase font-semibold">
                    <th className="py-3 px-4">{t.warehouse.medicine}</th>
                    <th className="py-3 px-4">{t.warehouse.sku} / {t.warehouse.batchNo}</th>
                    <th className="py-3 px-4">{t.warehouse.barcode}</th>
                    <th className="py-3 px-4">{t.warehouse.qty}</th>
                    <th className="py-3 px-4">{t.warehouse.costPrice}</th>
                    <th className="py-3 px-4">{t.warehouse.expDate}</th>
                    <th className="py-3 px-4">{t.warehouse.status}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E1D4]">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">
                        {isKh ? 'មិនមានទិន្នន័យស្តុកថ្នាំទេ' : 'No inventory batches found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((batch) => {
                      const branch = branches.find((b) => b.id === batch.branchId);
                      return (
                        <tr key={batch.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900">{batch.medicineName}</div>
                            <div className="text-xs text-gray-500">{batch.genericName}</div>
                            {branch && (
                              <div className="text-xs font-mono text-gray-400 mt-0.5">
                                {branch.branchCode} - {isKh ? branch.nameKh : branch.nameEn}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">
                            <div className="text-gray-900 font-medium">{batch.sku}</div>
                            <div className="text-gray-500">{batch.batchNumber}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-600">
                            {batch.barcode}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-bold ${
                                batch.quantity <= 20 ? 'text-red-600' : 'text-gray-900'
                              }`}
                            >
                              {batch.quantity}
                            </span>{' '}
                            <span className="text-xs text-gray-500">{batch.unit}</span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            ${batch.costPriceUsd?.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">
                            {batch.expirationDate}
                            <div className="mt-1">
                              {renderExpiryBadge(batch.expirySeverity, batch.daysUntilExpiration)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                batch.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : batch.status === 'EXPIRED'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {batch.status}
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
        </div>
      )}

      {/* TAB 3: Inter-Branch Stock Transfers */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E7E1D4] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#FDFBF7] border-b border-[#E7E1D4] text-gray-600 text-xs uppercase font-semibold">
                    <th className="py-3 px-4">{t.warehouse.transferCode}</th>
                    <th className="py-3 px-4">{t.warehouse.origin} {'->'} {t.warehouse.destination}</th>
                    <th className="py-3 px-4">{t.warehouse.stockUnits} / {t.warehouse.valuation}</th>
                    <th className="py-3 px-4">{t.warehouse.dispatchedBy}</th>
                    <th className="py-3 px-4">{t.warehouse.status}</th>
                    <th className="py-3 px-4 text-right">{t.warehouse.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E1D4]">
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        {isKh ? 'មិនទាន់មានប្រតិបត្តិការផ្ទេរថ្នាំទេ' : 'No transfer manifests recorded.'}
                      </td>
                    </tr>
                  ) : (
                    transfers.map((trf) => (
                      <tr key={trf.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <div className="font-bold text-gray-900">{trf.transferCode}</div>
                          <div className="text-xs text-gray-400 font-mono">
                            {t.warehouse.barcode}: {trf.manifestBarcode}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-900 font-medium">{trf.sourceBranchNameEn}</div>
                          <div className="text-xs text-gray-500">{'->'} {trf.targetBranchNameEn}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{trf.totalUnits} {isKh ? 'ឯកតា' : 'units'}</div>
                          <div className="text-xs text-emerald-700">${trf.totalValuationUsd?.toFixed(2)}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          <div>{trf.dispatchedBy || '-'}</div>
                          {trf.dispatchedAt && (
                            <div className="text-gray-400 text-2xs mt-0.5">
                              {new Date(trf.dispatchedAt).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {renderTransferStatus(trf.status)}
                          {trf.discrepancyNote && (
                            <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={trf.discrepancyNote}>
                              {trf.discrepancyNote}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {trf.status === 'DRAFT' && (
                            <button
                              onClick={() => handleDispatch(trf.id, trf.manifestBarcode)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                              {t.warehouse.dispatchAction}
                            </button>
                          )}
                          {trf.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() => {
                                setScanManifestCode(trf.manifestBarcode);
                                handleLookupManifest(trf.manifestBarcode);
                                setActiveTab('verification');
                              }}
                              className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                              {t.warehouse.receiveAction}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Barcode Verification Station */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E7E1D4] shadow-2xs">
            <h2 className="text-base font-bold text-gray-900">
              {t.warehouse.inboundVerificationTitle}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {t.warehouse.inboundVerificationSubtitle}
            </p>

            {/* Scan Box */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Barcode className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.warehouse.scanManifestPlaceholder}
                  value={scanManifestCode}
                  onChange={(e) => setScanManifestCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLookupManifest();
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E7E1D4] rounded-xl text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-gray-900 bg-[#FDFBF7]"
                />
              </div>
              <button
                onClick={() => handleLookupManifest()}
                className="px-5 py-2.5 bg-[#111827] text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors cursor-pointer"
              >
                {t.warehouse.lookupTransfer}
              </button>
            </div>

            {verificationFeedback && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs font-medium ${
                  verificationFeedback.includes('successfully') || verificationFeedback.includes('ជោគជ័យ')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {verificationFeedback}
              </div>
            )}
          </div>

          {/* Scanned Transfer Details Card */}
          {scannedTransfer && (
            <div className="bg-white p-6 rounded-2xl border border-[#E7E1D4] shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-[#E7E1D4] gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-gray-900">
                      {scannedTransfer.transferCode}
                    </span>
                    {renderTransferStatus(scannedTransfer.status)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {scannedTransfer.sourceBranchNameEn} {'->'} {scannedTransfer.targetBranchNameEn}
                  </div>
                </div>

                <div className="font-mono text-xs text-gray-500">
                  {t.warehouse.manifestBarcode}: <span className="font-bold text-gray-800">{scannedTransfer.manifestBarcode}</span>
                </div>
              </div>

              {/* Items Verification Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#FDFBF7] border-b border-[#E7E1D4] text-gray-600 text-xs uppercase font-semibold">
                      <th className="py-2.5 px-3">{t.warehouse.medicine}</th>
                      <th className="py-2.5 px-3">{t.warehouse.batchNo}</th>
                      <th className="py-2.5 px-3">{t.warehouse.barcode}</th>
                      <th className="py-2.5 px-3">Dispatched</th>
                      <th className="py-2.5 px-3">{t.warehouse.verifiedQtyLabel}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E1D4]">
                    {scannedTransfer.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-900">{item.medicineName}</div>
                          <div className="text-xs text-gray-500">{item.unit}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs">{item.batchNumber}</td>
                        <td className="py-3 px-3 font-mono text-xs text-gray-600">{item.barcode}</td>
                        <td className="py-3 px-3 font-bold text-gray-900">{item.dispatchedQty}</td>
                        <td className="py-3 px-3">
                          {scannedTransfer.status === 'IN_TRANSIT' ? (
                            <input
                              type="number"
                              min="0"
                              value={verifiedItems[item.batchNumber] ?? item.dispatchedQty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setVerifiedItems((prev) => ({
                                  ...prev,
                                  [item.batchNumber]: isNaN(val) ? 0 : val,
                                }));
                              }}
                              className="w-20 px-2.5 py-1 border border-[#E7E1D4] rounded-lg text-sm font-bold bg-[#FDFBF7]"
                            />
                          ) : (
                            <span className="font-bold text-emerald-700">{item.receivedQty}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Remarks / Discrepancy Note */}
              {scannedTransfer.status === 'IN_TRANSIT' && (
                <div className="pt-3 border-t border-[#E7E1D4] space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      {t.warehouse.discrepancyNote}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={t.warehouse.notesPlaceholder}
                      value={discrepancyNote}
                      onChange={(e) => setDiscrepancyNote(e.target.value)}
                      className="w-full p-2.5 border border-[#E7E1D4] rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-gray-900 bg-[#FDFBF7]"
                    />
                  </div>

                  <button
                    onClick={handleConfirmReceipt}
                    disabled={isVerifying}
                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-bold hover:bg-emerald-800 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {t.warehouse.confirmReceiptButton}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Create New Stock Transfer */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E7E1D4] shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[#E7E1D4]">
              <h3 className="text-base font-bold text-gray-900">
                {t.warehouse.createTransferButton}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                X
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    {t.warehouse.origin}
                  </label>
                  <select
                    value={newTransferSource}
                    onChange={(e) => setNewTransferSource(e.target.value)}
                    className="w-full p-2 border border-[#E7E1D4] rounded-xl text-xs sm:text-sm bg-[#FDFBF7]"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branchCode} - {isKh ? b.nameKh : b.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    {t.warehouse.destination}
                  </label>
                  <select
                    value={newTransferTarget}
                    onChange={(e) => setNewTransferTarget(e.target.value)}
                    className="w-full p-2 border border-[#E7E1D4] rounded-xl text-xs sm:text-sm bg-[#FDFBF7]"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branchCode} - {isKh ? b.nameKh : b.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  {t.warehouse.medicine} ({t.warehouse.batchNo})
                </label>
                <select
                  value={newTransferBatchId}
                  onChange={(e) => setNewTransferBatchId(e.target.value)}
                  className="w-full p-2 border border-[#E7E1D4] rounded-xl text-xs sm:text-sm bg-[#FDFBF7]"
                >
                  {batches
                    .filter((b) => b.branchId === newTransferSource)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.medicineName} ({b.batchNumber}) - {b.quantity} {b.unit} available
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  {t.warehouse.qty}
                </label>
                <input
                  type="number"
                  min="1"
                  value={newTransferQty}
                  onChange={(e) => setNewTransferQty(parseInt(e.target.value, 10))}
                  className="w-full p-2 border border-[#E7E1D4] rounded-xl text-sm bg-[#FDFBF7]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  {isKh ? 'កំណត់ចំណាំ' : 'Transfer Notes'}
                </label>
                <input
                  type="text"
                  placeholder={isKh ? 'ឧទាហរណ៍៖ បញ្ចូលស្តុកបន្ទាន់សម្រាប់ផ្នែកអ្នកជំងឺក្រៅ...' : 'e.g. Urgent outpatient replenishment'}
                  value={newTransferNotes}
                  onChange={(e) => setNewTransferNotes(e.target.value)}
                  className="w-full p-2 border border-[#E7E1D4] rounded-xl text-sm bg-[#FDFBF7]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoDispatch"
                  checked={autoDispatch}
                  onChange={(e) => setAutoDispatch(e.target.checked)}
                  className="rounded text-gray-900 cursor-pointer"
                />
                <label htmlFor="autoDispatch" className="text-xs text-gray-700 cursor-pointer">
                  {isKh ? 'បញ្ជូនចេញភ្លាមៗ (កាត់ស្តុកប្រភព និងដាក់ក្នុងស្ថានភាពកំពុងដឹក)' : 'Auto-dispatch immediately (mark In-Transit)'}
                </label>
              </div>

              {createFeedback && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-800 text-xs border border-red-200">
                  {createFeedback}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E7E1D4]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 cursor-pointer"
                >
                  {isKh ? 'បោះបង់' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111827] text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                >
                  {isKh ? 'បង្កើតលិខិតផ្ទេរ' : 'Generate Manifest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
