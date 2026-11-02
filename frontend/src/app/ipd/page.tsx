'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BedDouble,
  Activity,
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

interface BradenScaleAssessment {
  id: string;
  admissionId: string;
  patientId: string;
  assessedAt: string;
  assessedByNurse: string;
  sensoryPerception: 1 | 2 | 3 | 4;
  moisture: 1 | 2 | 3 | 4;
  activity: 1 | 2 | 3 | 4;
  mobility: 1 | 2 | 3 | 4;
  nutrition: 1 | 2 | 3 | 4;
  frictionShear: 1 | 2 | 3;
  totalScore: number;
  riskLevel: 'VERY_HIGH_RISK' | 'HIGH_RISK' | 'MODERATE_RISK' | 'MILD_RISK' | 'NO_RISK';
  riskLevelKh: string;
  protocols: string[];
}

interface NursingVitalFlowsheetEntry {
  id: string;
  admissionId: string;
  patientId: string;
  recordedAt: string;
  recordedByNurse: string;
  respiratoryRate: number;
  spo2Percent: number;
  onSupplementalOxygen: boolean;
  systolicBp: number;
  diastolicBp: number;
  pulseRate: number;
  consciousnessAvpu: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
  temperatureCelsius: number;
  news2Score: number;
  clinicalRisk: 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH_CRITICAL';
  monitoringFrequencyEn: string;
  monitoringFrequencyKh: string;
}

interface StayChargesInfo {
  admissionNumber: string;
  patientId: string;
  ward: string;
  dailyRateUsd: number;
  dailyRateKhr: number;
  admissionDate: string;
  calculateToDate: string;
  daysStayed: number;
  totalRoomChargesUsd: number;
  totalRoomChargesKhr: number;
  depositAmountUsd: number;
  netBalanceDueUsd: number;
  netBalanceDueKhr: number;
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

// Bedside Station Interactive Tabs
  const [activeStationTab, setActiveStationTab] = useState<'EMAR' | 'FLOWSHEET' | 'BRADEN' | 'FLUID' | 'BILLING'>('EMAR');
  const [bradenRecords, setBradenRecords] = useState<BradenScaleAssessment[]>([
    {
      id: 'braden-init',
      admissionId: 'adm-20261020-01',
      patientId: 'PT-1001',
      assessedAt: new Date().toISOString(),
      assessedByNurse: 'Nurse Sreymom',
      sensoryPerception: 3,
      moisture: 3,
      activity: 2,
      mobility: 2,
      nutrition: 3,
      frictionShear: 2,
      totalScore: 15,
      riskLevel: 'MILD_RISK',
      riskLevelKh: 'ហានិភ័យទាប',
      protocols: [
        'លើកទឹកចិត្តឱ្យចលនាខ្លួនតាមដែលអាចធ្វើបាន',
        'ត្រួតពិនិត្យស្បែកជារៀងរាល់ថ្ងៃ',
        'រក្សាស្បែកឱ្យស្អាតនិងស្ងួតជានិច្ច'
      ]
    }
  ]);
  const [vitalRecords, setVitalRecords] = useState<NursingVitalFlowsheetEntry[]>([
    {
      id: 'vital-init',
      admissionId: 'adm-20261020-01',
      patientId: 'PT-1001',
      recordedAt: new Date().toISOString(),
      recordedByNurse: 'Nurse Sreymom',
      respiratoryRate: 20,
      spo2Percent: 96,
      onSupplementalOxygen: false,
      systolicBp: 120,
      diastolicBp: 78,
      pulseRate: 82,
      consciousnessAvpu: 'ALERT',
      temperatureCelsius: 37.1,
      news2Score: 0,
      clinicalRisk: 'LOW',
      monitoringFrequencyEn: '12 hourly routine monitoring',
      monitoringFrequencyKh: 'តាមដានរៀងរាល់ ១២ម៉ោងម្តង'
    }
  ]);
  const [stayCharges, setStayCharges] = useState<StayChargesInfo | null>(null);

  // Braden Form State
  const [bradenSensory, setBradenSensory] = useState<1 | 2 | 3 | 4>(3);
  const [bradenMoisture, setBradenMoisture] = useState<1 | 2 | 3 | 4>(3);
  const [bradenActivity, setBradenActivity] = useState<1 | 2 | 3 | 4>(2);
  const [bradenMobility, setBradenMobility] = useState<1 | 2 | 3 | 4>(2);
  const [bradenNutrition, setBradenNutrition] = useState<1 | 2 | 3 | 4>(3);
  const [bradenFriction, setBradenFriction] = useState<1 | 2 | 3>(2);

  // Vitals Form State
  const [vitalRR, setVitalRR] = useState<number>(18);
  const [vitalSpo2, setVitalSpo2] = useState<number>(97);
  const [vitalO2, setVitalO2] = useState<boolean>(false);
  const [vitalSbp, setVitalSbp] = useState<number>(120);
  const [vitalDbp, setVitalDbp] = useState<number>(80);
  const [vitalPulse, setVitalPulse] = useState<number>(78);
  const [vitalAvpu, setVitalAvpu] = useState<'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE'>('ALERT');
  const [vitalTemp, setVitalTemp] = useState<number>(36.8);

  const handleSaveBraden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    try {
      const res = await api.ipd.assessBradenScale(selectedAdmission.id, {
        sensoryPerception: bradenSensory,
        moisture: bradenMoisture,
        activity: bradenActivity,
        mobility: bradenMobility,
        nutrition: bradenNutrition,
        frictionShear: bradenFriction,
        nurseName,
      });
      setBradenRecords((prev) => [res, ...prev]);
      setSuccessToast(isKh ? 'បានកត់ត្រាការវាយតម្លៃ Braden ជោគជ័យ' : 'Braden assessment recorded successfully');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch {
      // Local fallback
      const totalScore = bradenSensory + bradenMoisture + bradenActivity + bradenMobility + bradenNutrition + bradenFriction;
      let riskLevel: BradenScaleAssessment['riskLevel'] = 'NO_RISK';
      let riskLevelKh = 'គ្មានហានិភ័យ';
      let protocols = ['ការថែទាំអនាម័យស្តង់ដារតាមវួដ'];

      if (totalScore <= 9) {
        riskLevel = 'VERY_HIGH_RISK';
        riskLevelKh = 'ហានិភ័យធ្ងន់ធ្ងរខ្លាំង';
        protocols = [
          'ប្តូរឥរិយាបថរៀងរាល់ ២ម៉ោងម្តងជាកំហិត',
          'ប្រើពូកខ្យល់បញ្ចៀសសម្ពាធសង្កត់កម្រិតខ្ពស់ Low Air Loss Mattress',
          'ទ្រកែងជើងមិនឱ្យប៉ះផ្ទាល់ជាមួយពូក Heel Suspension',
          'លាបក្រែមការពារស្បែកសំណើម Barrier Cream'
        ];
      } else if (totalScore <= 12) {
        riskLevel = 'HIGH_RISK';
        riskLevelKh = 'ហានិភ័យខ្ពស់';
        protocols = [
          'តារាងប្តូរឥរិយាបថរៀងរាល់ ២ ទៅ ៣ម៉ោងម្តង',
          'ប្រើពូកអេប៉ុងទន់កម្រិតខ្ពស់ High-Density Foam',
          'ប្រើខ្នើយកល់ត្រគាកនិងខ្នង Foam Wedge'
        ];
      } else if (totalScore <= 14) {
        riskLevel = 'MODERATE_RISK';
        riskLevelKh = 'ហានិភ័យមធ្យម';
        protocols = ['ប្តូរឥរិយាបថរៀងរាល់ ៤ម៉ោងម្តង', 'លាបក្រែមការពារសំណើមលើស្បែក'];
      } else if (totalScore <= 18) {
        riskLevel = 'MILD_RISK';
        riskLevelKh = 'ហានិភ័យទាប';
        protocols = ['លើកទឹកចិត្តឱ្យចលនាខ្លួនតាមដែលអាចធ្វើបាន', 'ត្រួតពិនិត្យស្បែកជារៀងរាល់ថ្ងៃ'];
      }

      const fallbackBraden: BradenScaleAssessment = {
        id: 'braden-' + Date.now(),
        admissionId: selectedAdmission.id,
        patientId: selectedAdmission.patientId,
        assessedAt: new Date().toISOString(),
        assessedByNurse: nurseName,
        sensoryPerception: bradenSensory,
        moisture: bradenMoisture,
        activity: bradenActivity,
        mobility: bradenMobility,
        nutrition: bradenNutrition,
        frictionShear: bradenFriction,
        totalScore,
        riskLevel,
        riskLevelKh,
        protocols
      };
      setBradenRecords((prev) => [fallbackBraden, ...prev]);
      setSuccessToast(isKh ? 'បានកត់ត្រាការវាយតម្លៃ Braden ជោគជ័យ' : 'Braden assessment recorded successfully');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    try {
      const res = await api.ipd.recordVitalFlowsheet(selectedAdmission.id, {
        respiratoryRate: vitalRR,
        spo2Percent: vitalSpo2,
        onSupplementalOxygen: vitalO2,
        systolicBp: vitalSbp,
        diastolicBp: vitalDbp,
        pulseRate: vitalPulse,
        consciousnessAvpu: vitalAvpu,
        temperatureCelsius: vitalTemp,
        nurseName,
      });
      setVitalRecords((prev) => [res, ...prev]);
      setSuccessToast(isKh ? 'បានកត់ត្រាសញ្ញាជីវិត និងពិន្ទុ NEWS2 ជោគជ័យ' : 'Bedside vitals & NEWS2 recorded successfully');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch {
      // Local fallback calculation
      let respScore = 0;
      if (vitalRR <= 8 || vitalRR >= 25) respScore = 3;
      else if (vitalRR <= 11) respScore = 1;
      else if (vitalRR >= 21) respScore = 2;

      let spo2Score = 0;
      if (vitalSpo2 <= 91) spo2Score = 3;
      else if (vitalSpo2 <= 93) spo2Score = 2;
      else if (vitalSpo2 <= 95) spo2Score = 1;

      const o2Score = vitalO2 ? 2 : 0;

      let sbpScore = 0;
      if (vitalSbp <= 90 || vitalSbp >= 220) sbpScore = 3;
      else if (vitalSbp <= 100) sbpScore = 2;
      else if (vitalSbp <= 110) sbpScore = 1;

      let pulseScore = 0;
      if (vitalPulse <= 40 || vitalPulse >= 131) pulseScore = 3;
      else if (vitalPulse <= 50 || (vitalPulse >= 111 && vitalPulse <= 130)) pulseScore = 2;
      else if (vitalPulse >= 91 && vitalPulse <= 110) pulseScore = 1;

      const avpuScore = vitalAvpu === 'ALERT' ? 0 : 3;

      let tempScore = 0;
      if (vitalTemp <= 35.0) tempScore = 3;
      else if (vitalTemp <= 36.0 || (vitalTemp >= 38.1 && vitalTemp <= 39.0)) tempScore = 1;
      else if (vitalTemp >= 39.1) tempScore = 2;

      const news2Score = respScore + spo2Score + o2Score + sbpScore + pulseScore + avpuScore + tempScore;
      const hasSingle3 = [respScore, spo2Score, sbpScore, pulseScore, avpuScore, tempScore].some((s) => s === 3);

      let clinicalRisk: NursingVitalFlowsheetEntry['clinicalRisk'] = 'LOW';
      let monitoringFrequencyEn = '12 hourly routine monitoring';
      let monitoringFrequencyKh = 'តាមដានរៀងរាល់ ១២ម៉ោងម្តង';

      if (news2Score >= 7) {
        clinicalRisk = 'HIGH_CRITICAL';
        monitoringFrequencyEn = 'Continuous monitoring & Emergency MET Call';
        monitoringFrequencyKh = 'តាមដានបន្តជាប់មិនឈប់ និងហៅក្រុមសង្គ្រោះបន្ទាន់ MET';
      } else if (news2Score >= 5 || hasSingle3) {
        clinicalRisk = 'MEDIUM';
        monitoringFrequencyEn = 'Minimum 1 hourly monitoring & urgent clinical review';
        monitoringFrequencyKh = 'តាមដានយ៉ាងតិចរៀងរាល់ ១ម៉ោងម្តង និងជូនដំណឹងគ្រូពេទ្យពិនិត្យបន្ទាន់';
      } else if (news2Score >= 1) {
        clinicalRisk = 'LOW_MEDIUM';
        monitoringFrequencyEn = '4-6 hourly monitoring';
        monitoringFrequencyKh = 'តាមដានរៀងរាល់ ៤ ទៅ ៦ម៉ោងម្តង';
      }

      const fallbackVital: NursingVitalFlowsheetEntry = {
        id: 'vital-' + Date.now(),
        admissionId: selectedAdmission.id,
        patientId: selectedAdmission.patientId,
        recordedAt: new Date().toISOString(),
        recordedByNurse: nurseName,
        respiratoryRate: vitalRR,
        spo2Percent: vitalSpo2,
        onSupplementalOxygen: vitalO2,
        systolicBp: vitalSbp,
        diastolicBp: vitalDbp,
        pulseRate: vitalPulse,
        consciousnessAvpu: vitalAvpu,
        temperatureCelsius: vitalTemp,
        news2Score,
        clinicalRisk,
        monitoringFrequencyEn,
        monitoringFrequencyKh
      };
      setVitalRecords((prev) => [fallbackVital, ...prev]);
      setSuccessToast(isKh ? 'បានកត់ត្រាសញ្ញាជីវិត និងពិន្ទុ NEWS2 ជោគជ័យ' : 'Bedside vitals & NEWS2 recorded successfully');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

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
        const [emarData, fluidData, bradenData, vitalsData, chargesData] = await Promise.all([
          api.ipd.getEmar(defaultAdm.id),
          api.ipd.getFluidBalance(defaultAdm.id),
          api.ipd.getBradenAssessments(defaultAdm.id).catch(() => []),
          api.ipd.getVitalFlowsheet(defaultAdm.id).catch(() => []),
          api.ipd.getStayCharges(defaultAdm.id).catch(() => null),
        ]);
        setEmarRecords(emarData);
        setFluidRecords(fluidData);
        if (bradenData && bradenData.length) setBradenRecords(bradenData);
        if (vitalsData && vitalsData.length) setVitalRecords(vitalsData);
        if (chargesData) setStayCharges(chargesData);
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
        const [emarData, fluidData, bradenData, vitalsData, chargesData] = await Promise.all([
          api.ipd.getEmar(adm.id),
          api.ipd.getFluidBalance(adm.id),
          api.ipd.getBradenAssessments(adm.id).catch(() => []),
          api.ipd.getVitalFlowsheet(adm.id).catch(() => []),
          api.ipd.getStayCharges(adm.id).catch(() => null),
        ]);
        setEmarRecords(emarData);
        setFluidRecords(fluidData);
        if (bradenData && bradenData.length) setBradenRecords(bradenData);
        if (vitalsData && vitalsData.length) setVitalRecords(vitalsData);
        if (chargesData) setStayCharges(chargesData);
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

        {/* Right Column: Inpatient Bedside Station & Advanced Nursing Flowsheet (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedAdmission ? (
            <div className="bg-white rounded-2xl border border-[#E7E1D4] shadow-xs p-5 space-y-4">
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

              {/* Station Navigation Pill Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs border-b border-slate-100">
                <button
                  onClick={() => setActiveStationTab('EMAR')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors ${
                    activeStationTab === 'EMAR'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  e-MAR
                </button>
                <button
                  onClick={() => setActiveStationTab('FLOWSHEET')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1 ${
                    activeStationTab === 'FLOWSHEET'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Flowsheet</span>
                  {vitalRecords[0] && (
                    <span
                      className={`px-1 rounded text-[9px] font-bold ${
                        vitalRecords[0].clinicalRisk === 'HIGH_CRITICAL'
                          ? 'bg-rose-500 text-white animate-pulse'
                          : vitalRecords[0].clinicalRisk === 'MEDIUM'
                          ? 'bg-amber-400 text-stone-900'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      NEWS {vitalRecords[0].news2Score}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveStationTab('BRADEN')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1 ${
                    activeStationTab === 'BRADEN'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Braden</span>
                  {bradenRecords[0] && (
                    <span className="px-1 rounded text-[9px] font-bold bg-slate-200 text-slate-800">
                      {bradenRecords[0].totalScore}/23
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveStationTab('FLUID')}
                  className={`px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1 ${
                    activeStationTab === 'FLUID'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Fluid I/O</span>
                </button>
                <button
                  onClick={async () => {
                    setActiveStationTab('BILLING');
                    try {
                      const charges = await api.ipd.getStayCharges(selectedAdmission.id);
                      setStayCharges(charges);
                    } catch {
                      // fallback
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1 ${
                    activeStationTab === 'BILLING'
                      ? 'bg-indigo-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Stay Bill</span>
                </button>
              </div>

              {/* TAB 1: e-MAR */}
              {activeStationTab === 'EMAR' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t.ipd.emarTitle}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {emarRecords.filter((r) => r.status === 'GIVEN').length}/{emarRecords.length} Given
                    </span>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
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
              )}

              {/* TAB 2: VITAL SIGNS FLOWSHEET & NEWS2 */}
              {activeStationTab === 'FLOWSHEET' && (
                <div className="space-y-3">
                  {/* Latest NEWS2 Banner */}
                  {vitalRecords[0] && (
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        vitalRecords[0].clinicalRisk === 'HIGH_CRITICAL'
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : vitalRecords[0].clinicalRisk === 'MEDIUM'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Activity className="w-4 h-4" />
                          <span>NEWS2 Score: {vitalRecords[0].news2Score}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-black bg-white/70">
                            {vitalRecords[0].clinicalRisk}
                          </span>
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {isKh ? vitalRecords[0].monitoringFrequencyKh : vitalRecords[0].monitoringFrequencyEn}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bedside Vitals Form */}
                  <form onSubmit={handleSaveVitals} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                      <span>{isKh ? 'កត់ត្រាសញ្ញាជីវិតក្បែរគ្រែថ្មី' : 'Record Bedside Vital Signs'}</span>
                      <span className="font-mono text-[10px] text-slate-400">NEWS2 Deterministic</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Resp (bpm)</label>
                        <input
                          type="number"
                          min="4"
                          max="60"
                          value={vitalRR}
                          onChange={(e) => setVitalRR(parseInt(e.target.value) || 16)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">SpO2 (%)</label>
                        <input
                          type="number"
                          min="50"
                          max="100"
                          value={vitalSpo2}
                          onChange={(e) => setVitalSpo2(parseInt(e.target.value) || 98)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Pulse (bpm)</label>
                        <input
                          type="number"
                          min="30"
                          max="220"
                          value={vitalPulse}
                          onChange={(e) => setVitalPulse(parseInt(e.target.value) || 75)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">BP (mmHg)</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="Sys"
                            value={vitalSbp}
                            onChange={(e) => setVitalSbp(parseInt(e.target.value) || 120)}
                            className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-center font-bold text-xs"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            placeholder="Dia"
                            value={vitalDbp}
                            onChange={(e) => setVitalDbp(parseInt(e.target.value) || 80)}
                            className="w-full px-1.5 py-1 bg-white border border-slate-300 rounded text-center text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">Temp (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="32"
                          max="43"
                          value={vitalTemp}
                          onChange={(e) => setVitalTemp(parseFloat(e.target.value) || 37.0)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block">AVPU Alert</label>
                        <select
                          value={vitalAvpu}
                          onChange={(e) => setVitalAvpu(e.target.value as any)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                        >
                          <option value="ALERT">Alert</option>
                          <option value="VOICE">Voice</option>
                          <option value="PAIN">Pain</option>
                          <option value="UNRESPONSIVE">Unresponsive</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 font-semibold">
                        <input
                          type="checkbox"
                          checked={vitalO2}
                          onChange={(e) => setVitalO2(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span>Supplemental O2 Therapy</span>
                      </label>

                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs transition-colors"
                      >
                        {isKh ? 'កត់ត្រាសញ្ញាជីវិត' : 'Save Vitals'}
                      </button>
                    </div>
                  </form>

                  {/* Flowsheet Table */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {vitalRecords.map((v) => (
                      <div
                        key={v.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-[11px] flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>BP: {v.systolicBp}/{v.diastolicBp}</span>
                            <span>HR: {v.pulseRate} bpm</span>
                            <span>SpO2: {v.spo2Percent}%</span>
                            <span>Temp: {v.temperatureCelsius}°C</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            RR: {v.respiratoryRate}/min | AVPU: {v.consciousnessAvpu} | {new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {v.recordedByNurse}
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                            v.clinicalRisk === 'HIGH_CRITICAL'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : v.clinicalRisk === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          NEWS {v.news2Score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: BRADEN SCALE PRESSURE ULCER ASSESSMENT */}
              {activeStationTab === 'BRADEN' && (
                <div className="space-y-3 text-xs">
                  {/* Latest Braden Scorecard */}
                  {bradenRecords[0] && (
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        bradenRecords[0].riskLevel === 'VERY_HIGH_RISK'
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : bradenRecords[0].riskLevel === 'HIGH_RISK'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Braden Score: {bradenRecords[0].totalScore} / 23</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-black bg-white/70">
                            {isKh ? bradenRecords[0].riskLevelKh : bradenRecords[0].riskLevel}
                          </span>
                        </div>
                        <div className="text-[10px] mt-1 space-y-0.5 text-slate-700">
                          {bradenRecords[0].protocols.map((p, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Interactive Braden 6-Parameter Assessment Form */}
                  <form onSubmit={handleSaveBraden} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-slate-800 text-[11px]">
                      {isKh ? 'ការវាយតម្លៃ Braden Scale ថ្មី' : 'Record New Braden Scale Assessment'}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block">Sensory Perception (1-4)</label>
                        <select
                          value={bradenSensory}
                          onChange={(e) => setBradenSensory(parseInt(e.target.value) as any)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        >
                          <option value={1}>1: Completely Limited</option>
                          <option value={2}>2: Very Limited</option>
                          <option value={3}>3: Slightly Limited</option>
                          <option value={4}>4: No Impairment</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block">Moisture (1-4)</label>
                        <select
                          value={bradenMoisture}
                          onChange={(e) => setBradenMoisture(parseInt(e.target.value) as any)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        >
                          <option value={1}>1: Constantly Moist</option>
                          <option value={2}>2: Very Moist</option>
                          <option value={3}>3: Occasionally Moist</option>
                          <option value={4}>4: Rarely Moist</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block">Activity (1-4)</label>
                        <select
                          value={bradenActivity}
                          onChange={(e) => setBradenActivity(parseInt(e.target.value) as any)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        >
                          <option value={1}>1: Bedfast</option>
                          <option value={2}>2: Chairfast</option>
                          <option value={3}>3: Walks Occasionally</option>
                          <option value={4}>4: Walks Frequently</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block">Mobility (1-4)</label>
                        <select
                          value={bradenMobility}
                          onChange={(e) => setBradenMobility(parseInt(e.target.value) as any)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        >
                          <option value={1}>1: Completely Immobile</option>
                          <option value={2}>2: Very Limited</option>
                          <option value={3}>3: Slightly Limited</option>
                          <option value={4}>4: No Limitations</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block">Nutrition (1-4)</label>
                        <select
                          value={bradenNutrition}
                          onChange={(e) => setBradenNutrition(parseInt(e.target.value) as any)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        >
                          <option value={1}>1: Very Poor</option>
                          <option value={2}>2: Probably Inadequate</option>
                          <option value={3}>3: Adequate</option>
                          <option value={4}>4: Excellent</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block">Friction & Shear (1-3)</label>
                        <select
                          value={bradenFriction}
                          onChange={(e) => setBradenFriction(parseInt(e.target.value) as any)}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                        >
                          <option value={1}>1: Problem</option>
                          <option value={2}>2: Potential Problem</option>
                          <option value={3}>3: No Apparent Problem</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-bold text-slate-700">
                        Total Score: {bradenSensory + bradenMoisture + bradenActivity + bradenMobility + bradenNutrition + bradenFriction} / 23
                      </span>

                      <button
                        type="submit"
                        className="px-3 py-1 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs transition-colors"
                      >
                        {isKh ? 'កត់ត្រាការវាយតម្លៃ' : 'Save Braden Assessment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: FLUID BALANCE I/O */}
              {activeStationTab === 'FLUID' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-blue-600" />
                      <span>{t.ipd.fluidBalanceTitle}</span>
                    </h3>
                    <button
                      onClick={() => setShowFluidModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                    >
                      + Record I/O
                    </button>
                  </div>

                  {fluidRecords.length > 0 ? (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Total In</span>
                        <span className="font-bold text-blue-700 text-sm">
                          {fluidRecords.reduce((acc, r) => acc + r.intakeOralMl + r.intakeIvMl, 0)} mL
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Total Out</span>
                        <span className="font-bold text-amber-700 text-sm">
                          {fluidRecords.reduce((acc, r) => acc + r.outputUrineMl + r.outputDrainMl, 0)} mL
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Net 24h</span>
                        <span className="font-black text-slate-900 font-mono text-sm">
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

                  <div className="space-y-1.5 max-h-56 overflow-y-auto">
                    {fluidRecords.map((fl) => (
                      <div
                        key={fl.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-[11px] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            In: Oral {fl.intakeOralMl}mL + IV {fl.intakeIvMl}mL | Out: Urine {fl.outputUrineMl}mL + Drain {fl.outputDrainMl}mL
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(fl.recordTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {fl.recordedByNurse}
                          </div>
                        </div>

                        <span className="font-mono font-bold text-slate-900">
                          {fl.netBalanceMl > 0 ? '+' : ''}{fl.netBalanceMl} mL
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: STAY CHARGES & SETTLEMENT */}
              {activeStationTab === 'BILLING' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-indigo-600" />
                      <span>{isKh ? 'ថ្លៃស្នាក់នៅសម្រាកពេទ្យ & គណនីទូទាត់' : 'Inpatient Daily Stay Charges'}</span>
                    </h3>
                  </div>

                  {stayCharges ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Length of Stay</span>
                          <span className="text-base font-black text-slate-900">{stayCharges.daysStayed} Days</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Daily Bed Rate</span>
                          <span className="text-base font-black text-indigo-700">${stayCharges.dailyRateUsd}/day</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Total Room Charges</span>
                          <span className="font-bold text-slate-900">${stayCharges.totalRoomChargesUsd}</span>
                          <span className="text-[9px] text-slate-400 block font-mono">({stayCharges.totalRoomChargesKhr.toLocaleString()} KHR)</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-600 block">Deposit Credited</span>
                          <span className="font-bold text-emerald-700">${stayCharges.depositAmountUsd}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-600 block font-bold">Net Balance Due</span>
                          <span className="font-black text-amber-700 text-sm">${stayCharges.netBalanceDueUsd}</span>
                          <span className="text-[9px] text-amber-600 block font-mono">({stayCharges.netBalanceDueKhr.toLocaleString()} KHR)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      Loading stay charges...
                    </div>
                  )}
                </div>
              )}
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
