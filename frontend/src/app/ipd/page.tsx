'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BedDouble,
  UserCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  PlusCircle,
  FileCheck,
  Calculator,
  Droplets,
  ArrowRightLeft,
  LogOut,
  Sparkles,
  QrCode,
  ShieldCheck,
  AlertCircle,
  User,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useTranslation } from '../../context/I18nContext';

interface Bed {
  id: string;
  bedNumber: string;
  ward: string;
  wardNameKh: string;
  wardNameEn: string;
  dailyRateUsd: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING_REQUIRED' | 'OUT_OF_SERVICE';
  currentAdmissionId?: string;
  currentPatientId?: string;
  currentPatientName?: string;
}

interface InpatientAdmission {
  id: string;
  admissionNumber: string;
  patientId: string;
  patientName: string;
  bedId: string;
  bedNumber: string;
  ward: string;
  wardNameKh: string;
  wardNameEn: string;
  attendingDoctor: string;
  admittingDiagnosis: string;
  status: 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED';
  wristbandBarcode: string;
  admissionDate: string;
  dischargeDate?: string;
  depositAmountUsd: number;
  dailyRateUsd: number;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
}

interface MedicationAdminRecord {
  id: string;
  admissionId: string;
  patientId: string;
  medicationName: string;
  medicationBarcode: string;
  dose: string;
  route: string;
  scheduledTime: string;
  administeredTime?: string;
  status: 'SCHEDULED' | 'GIVEN' | 'MISSED' | 'REFUSED' | 'HELD_CLINICAL';
  administeringNurse?: string;
  notes?: string;
  verifiedBarcodeScan: boolean;
}

interface FluidBalanceRecord {
  id: string;
  admissionId: string;
  patientId: string;
  recordTime: string;
  intakeOralMl: number;
  intakeIvMl: number;
  outputUrineMl: number;
  outputDrainMl: number;
  netBalanceMl: number;
  recordedByNurse: string;
}

export default function IpdPage() {
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';

  const [beds, setBeds] = useState<Bed[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedAdmission, setSelectedAdmission] = useState<InpatientAdmission | null>(null);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [emarRecords, setEmarRecords] = useState<MedicationAdminRecord[]>([]);
  const [fluidRecords, setFluidRecords] = useState<FluidBalanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [wardFilter, setWardFilter] = useState<string>('ALL');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Admission Modal State
  const [showAdmitModal, setShowAdmitModal] = useState<boolean>(false);
  const [admitPatientId, setAdmitPatientId] = useState<string>('PT-1002');
  const [admitPatientName, setAdmitPatientName] = useState<string>('CHHAY Bopha');
  const [admitBedId, setAdmitBedId] = useState<string>('');
  const [admitDoctor, setAdmitDoctor] = useState<string>('Dr. CHAN Vanna');
  const [admitDiagnosis, setAdmitDiagnosis] = useState<string>('Acute Bronchitis with Severe Dehydration');
  const [admitDeposit, setAdmitDeposit] = useState<number>(100);
  const [admitContactName, setAdmitContactName] = useState<string>('CHHAY Sopheak (Brother)');
  const [admitContactPhone, setAdmitContactPhone] = useState<string>('012998877');

  // e-MAR Five Rights Modal State
  const [showAdministerModal, setShowAdministerModal] = useState<boolean>(false);
  const [selectedEmarItem, setSelectedEmarItem] = useState<MedicationAdminRecord | null>(null);
  const [scannedWristband, setScannedWristband] = useState<string>('');
  const [scannedMedBarcode, setScannedMedBarcode] = useState<string>('');
  const [nurseName, setNurseName] = useState<string>('Nurse Kolap');
  const [administerError, setAdministerError] = useState<string | null>(null);

  // IV Drip Calculator Modal State
  const [showIvModal, setShowIvModal] = useState<boolean>(false);
  const [calcVolume, setCalcVolume] = useState<number>(1000);
  const [calcDuration, setCalcDuration] = useState<number>(8);
  const [calcDropFactor, setCalcDropFactor] = useState<number>(20);
  const [calcResult, setCalcResult] = useState<{ flowRate: number; dripRate: number } | null>(null);

  // Fluid I/O Form State
  const [showFluidModal, setShowFluidModal] = useState<boolean>(false);
  const [fluidOral, setFluidOral] = useState<number>(300);
  const [fluidIv, setFluidIv] = useState<number>(500);
  const [fluidUrine, setFluidUrine] = useState<number>(600);
  const [fluidDrain, setFluidDrain] = useState<number>(0);

  const fetchData = useCallback(async () => {
    try {
      const [bedsData, metricsData, admissionsData] = await Promise.all([
        api.ipd.getBeds(),
        api.ipd.getBedMetrics(),
        api.ipd.getAdmissions('ADMITTED'),
      ]);

      setBeds(bedsData);
      setMetrics(metricsData);

      if (admissionsData.length > 0 && !selectedAdmission) {
        const defaultAdm = admissionsData[0];
        setSelectedAdmission(defaultAdm);
        const [emarData, fluidData] = await Promise.all([
          api.ipd.getEmar(defaultAdm.id),
          api.ipd.getFluidBalance(defaultAdm.id),
        ]);
        setEmarRecords(emarData);
        setFluidRecords(fluidData);
      }

      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [selectedAdmission]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectBed = async (bed: Bed) => {
    setSelectedBed(bed);
    if (bed.currentAdmissionId) {
      try {
        const adm = await api.ipd.getAdmission(bed.currentAdmissionId);
        setSelectedAdmission(adm);
        const [emarData, fluidData] = await Promise.all([
          api.ipd.getEmar(adm.id),
          api.ipd.getFluidBalance(adm.id),
        ]);
        setEmarRecords(emarData);
        setFluidRecords(fluidData);
      } catch {
        // Catch
      }
    }
  };

  const handleCleanBed = async (bedId: string) => {
    try {
      await api.ipd.markBedCleaned(bedId);
      setSuccessToast(t.ipd.cleanSuccessToast);
      setTimeout(() => setSuccessToast(null), 3000);
      fetchData();
    } catch {
      // Catch
    }
  };

  const handleDischargePatient = async (admissionId: string) => {
    try {
      await api.ipd.dischargePatient(admissionId, {
        dischargeSummary: 'Inpatient stay completed. Condition stabilized.',
      });
      setSelectedAdmission(null);
      setSuccessToast(t.ipd.dischargeSuccessToast);
      setTimeout(() => setSuccessToast(null), 3000);
      fetchData();
    } catch {
      // Catch
    }
  };

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admitBedId) return;

    try {
      const newAdm = await api.ipd.admitPatient({
        patientId: admitPatientId,
        patientName: admitPatientName,
        bedId: admitBedId,
        attendingDoctor: admitDoctor,
        admittingDiagnosis: admitDiagnosis,
        depositAmountUsd: admitDeposit,
        emergencyContact: {
          name: admitContactName,
          phone: admitContactPhone,
          relation: 'Family',
        },
      });

      setShowAdmitModal(false);
      setSelectedAdmission(newAdm);
      setSuccessToast(t.ipd.admitSuccessToast);
      setTimeout(() => setSuccessToast(null), 3500);
      fetchData();
    } catch {
      // Catch
    }
  };

  const handleOpenAdminister = (item: MedicationAdminRecord) => {
    setSelectedEmarItem(item);
    setScannedWristband(selectedAdmission?.wristbandBarcode || '');
    setScannedMedBarcode(item.medicationBarcode);
    setAdministerError(null);
    setShowAdministerModal(true);
  };

  const handleAdministerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission || !selectedEmarItem) return;

    try {
      await api.ipd.administerMedication(selectedAdmission.id, selectedEmarItem.id, {
        scannedWristbandBarcode: scannedWristband.trim(),
        scannedMedicationBarcode: scannedMedBarcode.trim(),
        nurseName,
        notes: 'Administered at bedside. Five rights verified via barcode scanner.',
      });

      setShowAdministerModal(false);
      setSuccessToast(t.ipd.administerSuccessToast);
      setTimeout(() => setSuccessToast(null), 3500);
      const updatedEmar = await api.ipd.getEmar(selectedAdmission.id);
      setEmarRecords(updatedEmar);
    } catch (err: any) {
      setAdministerError(err?.message || 'Five Rights verification failed');
    }
  };

  const handleFluidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    try {
      await api.ipd.recordFluidBalance(selectedAdmission.id, {
        intakeOralMl: fluidOral,
        intakeIvMl: fluidIv,
        outputUrineMl: fluidUrine,
        outputDrainMl: fluidDrain,
        nurseName,
      });

      setShowFluidModal(false);
      setSuccessToast(t.ipd.fluidSuccessToast);
      setTimeout(() => setSuccessToast(null), 3500);
      const updatedFluid = await api.ipd.getFluidBalance(selectedAdmission.id);
      setFluidRecords(updatedFluid);
    } catch {
      // Catch
    }
  };

  const handleCalculateIvDrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (calcVolume <= 0 || calcDuration <= 0) return;
    const flowRate = Math.round((calcVolume / calcDuration) * 10) / 10;
    const dripRate = Math.round((calcVolume * calcDropFactor) / (calcDuration * 60));
    setCalcResult({ flowRate, dripRate });
  };

  const filteredBeds = beds.filter((b) => {
    if (wardFilter !== 'ALL' && b.ward !== wardFilter) return false;
    return true;
  });

  const availableBeds = beds.filter((b) => b.status === 'AVAILABLE');

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E1D4]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              {t.ipd.title}
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              {t.ipd.subtitle}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              if (availableBeds.length > 0) setAdmitBedId(availableBeds[0].id);
              setShowAdmitModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-medium shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.ipd.admitPatientButton}</span>
          </button>

          <button
            onClick={() => {
              setCalcResult(null);
              setShowIvModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-xs transition-colors"
          >
            <Calculator className="w-4 h-4 text-indigo-600" />
            <span>{t.ipd.ivCalculatorButton}</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-[#E7E1D4] shadow-2xs">
            <span className="text-[11px] font-medium text-slate-400 block mb-0.5">{t.ipd.totalBeds}</span>
            <span className="text-xl font-bold text-slate-800">{metrics.totalBeds}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 shadow-2xs">
            <span className="text-[11px] font-medium text-indigo-700 block mb-0.5">{t.ipd.occupiedBeds}</span>
            <span className="text-xl font-bold text-indigo-900">{metrics.occupiedBeds}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 shadow-2xs">
            <span className="text-[11px] font-medium text-emerald-700 block mb-0.5">{t.ipd.availableBeds}</span>
            <span className="text-xl font-bold text-emerald-900">{metrics.availableBeds}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 shadow-2xs">
            <span className="text-[11px] font-medium text-amber-700 block mb-0.5">{t.ipd.cleaningBeds}</span>
            <span className="text-xl font-bold text-amber-900">{metrics.cleaningRequired}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 text-white shadow-2xs">
            <span className="text-[11px] font-medium text-slate-400 block mb-0.5">{t.ipd.occupancyRate}</span>
            <span className="text-xl font-bold text-emerald-400">{metrics.occupancyRatePercent}%</span>
          </div>
        </div>
      )}

      {/* Success Notification Toast */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Ward Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setWardFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            wardFilter === 'ALL'
              ? 'bg-indigo-700 text-white border-indigo-700'
              : 'bg-white text-slate-600 border-[#E7E1D4] hover:bg-slate-50'
          }`}
        >
          {t.ipd.filterAllWards}
        </button>
        <button
          onClick={() => setWardFilter('WARD_GENERAL_MED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            wardFilter === 'WARD_GENERAL_MED'
              ? 'bg-indigo-700 text-white border-indigo-700'
              : 'bg-white text-slate-600 border-[#E7E1D4] hover:bg-slate-50'
          }`}
        >
          {t.ipd.wardGeneralMed}
        </button>
        <button
          onClick={() => setWardFilter('WARD_SURGICAL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            wardFilter === 'WARD_SURGICAL'
              ? 'bg-indigo-700 text-white border-indigo-700'
              : 'bg-white text-slate-600 border-[#E7E1D4] hover:bg-slate-50'
          }`}
        >
          {t.ipd.wardSurgical}
        </button>
        <button
          onClick={() => setWardFilter('WARD_MATERNITY')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            wardFilter === 'WARD_MATERNITY'
              ? 'bg-indigo-700 text-white border-indigo-700'
              : 'bg-white text-slate-600 border-[#E7E1D4] hover:bg-slate-50'
          }`}
        >
          {t.ipd.wardMaternity}
        </button>
        <button
          onClick={() => setWardFilter('WARD_OBSERVATION')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
            wardFilter === 'WARD_OBSERVATION'
              ? 'bg-indigo-700 text-white border-indigo-700'
              : 'bg-white text-slate-600 border-[#E7E1D4] hover:bg-slate-50'
          }`}
        >
          {t.ipd.wardObservation}
        </button>
      </div>

      {/* Main Grid: Interactive Bed Floorplan vs Inpatient Bedside Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Bed Floorplan Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Ward Floorplan ({filteredBeds.length} Beds)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[780px] overflow-y-auto pr-1">
            {loading ? (
              <div className="col-span-2 p-12 text-center text-slate-400 text-xs animate-pulse">
                {t.common.loading}
              </div>
            ) : filteredBeds.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-400 text-xs bg-white rounded-xl border border-[#E7E1D4]">
                {t.common.none}
              </div>
            ) : (
              filteredBeds.map((bed) => {
                const isOccupied = bed.status === 'OCCUPIED';
                const isCleaning = bed.status === 'CLEANING_REQUIRED';
                const isAvailable = bed.status === 'AVAILABLE';
                const isSelected = selectedBed?.id === bed.id || selectedAdmission?.bedId === bed.id;

                return (
                  <div
                    key={bed.id}
                    onClick={() => handleSelectBed(bed)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-1 ring-indigo-500'
                        : isOccupied
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : isCleaning
                        ? 'bg-amber-50/30 border-amber-200 hover:border-amber-300'
                        : 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <BedDouble
                          className={`w-4 h-4 ${
                            isOccupied
                              ? 'text-indigo-600'
                              : isCleaning
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        />
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {bed.bedNumber}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOccupied
                            ? 'bg-indigo-100 text-indigo-800'
                            : isCleaning
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOccupied
                          ? t.ipd.statusOccupied
                          : isCleaning
                          ? t.ipd.statusCleaning
                          : t.ipd.statusAvailable}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mb-2">
                      {isKh ? bed.wardNameKh : bed.wardNameEn}
                    </div>

                    {isOccupied ? (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-800">
                          {bed.currentPatientName}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {bed.currentPatientId}
                        </span>
                      </div>
                    ) : isCleaning ? (
                      <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
                        <span className="text-[11px] text-amber-700">Disinfected pending</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCleanBed(bed.id);
                          }}
                          className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-medium transition-colors"
                        >
                          {t.ipd.markCleanedButton}
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-emerald-100 text-[11px] text-emerald-700">
                        ${bed.dailyRateUsd}/day - Ready for admission
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Inpatient Bedside Station & e-MAR (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedAdmission ? (
            <div className="bg-white rounded-2xl border border-[#E7E1D4] shadow-xs p-5 space-y-5">
              {/* Patient Inpatient Banner */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedAdmission.patientName}
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {selectedAdmission.bedNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {selectedAdmission.admittingDiagnosis}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {t.ipd.wristbandBarcode}: <strong>{selectedAdmission.wristbandBarcode}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDischargePatient(selectedAdmission.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                    title={t.ipd.dischargeButton}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* e-MAR: Medication Administration Record */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t.ipd.emarTitle}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {emarRecords.filter((r) => r.status === 'GIVEN').length}/{emarRecords.length} Given
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {emarRecords.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No medication scheduled
                    </div>
                  ) : (
                    emarRecords.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                          item.status === 'GIVEN'
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-slate-50/60 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            {item.medicationName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {item.dose} ({item.route})
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div className="text-right">
                          {item.status === 'GIVEN' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Given</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenAdminister(item)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium transition-colors"
                            >
                              {t.ipd.administerButton}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 24-Hour Fluid Balance I/O Card */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span>{t.ipd.fluidBalanceTitle}</span>
                  </h3>
                  <button
                    onClick={() => setShowFluidModal(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    + Record I/O
                  </button>
                </div>

                {fluidRecords.length > 0 ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total In</span>
                      <span className="font-bold text-blue-700">
                        {fluidRecords.reduce((acc, r) => acc + r.intakeOralMl + r.intakeIvMl, 0)} mL
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total Out</span>
                      <span className="font-bold text-amber-700">
                        {fluidRecords.reduce((acc, r) => acc + r.outputUrineMl + r.outputDrainMl, 0)} mL
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Net 24h</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {fluidRecords.reduce((acc, r) => acc + r.netBalanceMl, 0) > 0 ? '+' : ''}
                        {fluidRecords.reduce((acc, r) => acc + r.netBalanceMl, 0)} mL
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    No fluid records entered today
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-[#E7E1D4]">
              Select an occupied bed to inspect patient e-MAR and bedside care chart
            </div>
          )}
        </div>
      </div>

      {/* Five Rights Medication Administration Modal */}
      {showAdministerModal && selectedEmarItem && selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-700" />
                <span>Five Rights e-MAR Bedside Verification</span>
              </h3>
              <button
                onClick={() => setShowAdministerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {administerError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs mb-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{administerError}</span>
              </div>
            )}

            <form onSubmit={handleAdministerSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200">
                <div className="font-bold text-slate-900 text-sm">{selectedEmarItem.medicationName}</div>
                <div className="text-slate-600 mt-0.5">
                  Dose: {selectedEmarItem.dose} | Route: {selectedEmarItem.route}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  {t.ipd.scanWristbandPrompt}
                </label>
                <input
                  type="text"
                  required
                  value={scannedWristband}
                  onChange={(e) => setScannedWristband(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  {t.ipd.scanMedicationPrompt}
                </label>
                <input
                  type="text"
                  required
                  value={scannedMedBarcode}
                  onChange={(e) => setScannedMedBarcode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  {t.ipd.nurseName}
                </label>
                <input
                  type="text"
                  required
                  value={nurseName}
                  onChange={(e) => setNurseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdministerModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-medium shadow-xs"
                >
                  {t.ipd.confirmAdminister}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IV Drip Calculator Modal */}
      {showIvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-700" />
                <span>{t.ipd.ivDripTitle}</span>
              </h3>
              <button
                onClick={() => setShowIvModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCalculateIvDrip} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t.ipd.ivVolume}</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={calcVolume}
                  onChange={(e) => setCalcVolume(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t.ipd.ivDurationHours}</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  required
                  value={calcDuration}
                  onChange={(e) => setCalcDuration(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t.ipd.ivDropFactor}</label>
                <select
                  value={calcDropFactor}
                  onChange={(e) => setCalcDropFactor(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-indigo-600"
                >
                  <option value={20}>20 gtt/mL (Standard Macro Drip Set)</option>
                  <option value={15}>15 gtt/mL (Blood / Viscous Drip Set)</option>
                  <option value={60}>60 gtt/mL (Pediatric Micro Drip Set)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-medium shadow-xs"
                >
                  {t.ipd.calculateButton}
                </button>
              </div>

              {calcResult && (
                <div className="p-4 rounded-xl bg-slate-900 text-white grid grid-cols-2 gap-3 text-center mt-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t.ipd.ivFlowRate}</span>
                    <span className="text-xl font-bold text-white font-mono">{calcResult.flowRate}</span>
                    <span className="text-[10px] text-slate-400 block">mL/hr</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t.ipd.ivDripRate}</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono">{calcResult.dripRate}</span>
                    <span className="text-[10px] text-slate-400 block">drops/min</span>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Admission Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-indigo-700" />
                <span>{t.ipd.admitPatientButton}</span>
              </h3>
              <button
                onClick={() => setShowAdmitModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdmitSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.ipd.patientName}</label>
                  <input
                    type="text"
                    required
                    value={admitPatientName}
                    onChange={(e) => setAdmitPatientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.ipd.patientId}</label>
                  <input
                    type="text"
                    required
                    value={admitPatientId}
                    onChange={(e) => setAdmitPatientId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Select Available Bed</label>
                <select
                  required
                  value={admitBedId}
                  onChange={(e) => setAdmitBedId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-indigo-600"
                >
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} - {isKh ? b.wardNameKh : b.wardNameEn} (${b.dailyRateUsd}/day)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">{t.ipd.admittingDiagnosis}</label>
                <input
                  type="text"
                  required
                  value={admitDiagnosis}
                  onChange={(e) => setAdmitDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.ipd.attendingDoctor}</label>
                  <input
                    type="text"
                    required
                    value={admitDoctor}
                    onChange={(e) => setAdmitDoctor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.ipd.depositAmount}</label>
                  <input
                    type="number"
                    min="0"
                    value={admitDeposit}
                    onChange={(e) => setAdmitDeposit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-medium shadow-xs"
                >
                  Confirm Inpatient Admission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Fluid Modal */}
      {showFluidModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                <span>{t.ipd.recordFluidButton}</span>
              </h3>
              <button
                onClick={() => setShowFluidModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFluidSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.ipd.intakeOral}</label>
                  <input
                    type="number"
                    min="0"
                    value={fluidOral}
                    onChange={(e) => setFluidOral(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.ipd.intakeIv}</label>
                  <input
                    type="number"
                    min="0"
                    value={fluidIv}
                    onChange={(e) => setFluidIv(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.ipd.outputUrine}</label>
                  <input
                    type="number"
                    min="0"
                    value={fluidUrine}
                    onChange={(e) => setFluidUrine(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">{t.ipd.outputDrain}</label>
                  <input
                    type="number"
                    min="0"
                    value={fluidDrain}
                    onChange={(e) => setFluidDrain(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFluidModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                >
                  Save Fluid Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
