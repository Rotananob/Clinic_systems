'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  ShieldCheck,
  FileCode,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Send,
  Building2,
  Stethoscope,
  Activity,
  Layers,
  Search,
  ExternalLink,
  Code,
  Check,
  Copy,
  Clock,
  User,
  Hash
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslation } from '@/context/I18nContext';

interface ClaimItem {
  id: string;
  serviceCode: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  totalPriceUsd: number;
  coveredAmountUsd: number;
  coPayUsd: number;
  deductibleUsd: number;
}

interface DiagnosisEntry {
  code: string;
  name: string;
  isPrimary: boolean;
}

interface ElectronicClaim {
  id: string;
  claimNumber: string;
  insurer: 'FORTE' | 'PRUDENTIAL' | 'AIA' | 'MANULIFE' | 'INFINITY' | 'NSSF';
  policyNumber: string;
  memberId: string;
  patientId: string;
  patientName: string;
  patientDob: string;
  patientGender: string;
  providerId: string;
  providerName: string;
  providerLicense: string;
  preAuthCode?: string;
  diagnosisCodes: DiagnosisEntry[];
  admissionDate?: string;
  dischargeDate?: string;
  claimType: 'OUTPATIENT' | 'INPATIENT' | 'DENTAL';
  items: ClaimItem[];
  totalBilledUsd: number;
  totalClaimedUsd: number;
  patientShareUsd: number;
  status: 'DRAFT' | 'VALIDATED' | 'SUBMITTED' | 'PRE_APPROVED' | 'SETTLED' | 'REJECTED';
  createdAt: string;
  submittedAt?: string;
  adjudicatedAt?: string;
  adjudicationNotes?: string;
  batchHash?: string;
  transactionReference?: string;
  xmlPayload?: string;
  fhirJsonPayload?: any;
}

interface ReportableDisease {
  code: string;
  khmerName: string;
  englishName: string;
  category: 'IMMEDIATE' | 'WEEKLY' | 'MONTHLY';
}

interface SurveillanceCaseRecord {
  id: string;
  diseaseCode: string;
  diseaseName: string;
  caseType: 'SUSPECTED' | 'PROBABLE' | 'CONFIRMED';
  laboratoryConfirmation: 'PCR' | 'RDT' | 'SEROLOGY' | 'CULTURE' | 'CLINICAL_ONLY';
  patientAge: number;
  patientGender: 'M' | 'F';
  provinceCode: string;
  districtCode: string;
  healthFacilityCode: string;
  encounterDate: string;
  reportingPeriod: string;
  outcome: 'RECOVERED' | 'HOSPITALIZED' | 'TRANSFERRED' | 'DECEASED';
}

export default function EclaimPage() {
  const { t, locale } = useTranslation();
  const isKh = locale === 'km';

  const [activeTab, setActiveTab] = useState<'CLAIMS' | 'SURVEILLANCE' | 'VALIDATOR'>('CLAIMS');

  // Claims State
  const [claims, setClaims] = useState<ElectronicClaim[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<ElectronicClaim | null>(null);
  const [insurerFilter, setInsurerFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [xmlModalContent, setXmlModalContent] = useState<{ title: string; content: string } | null>(null);
  const [copiedBatchHash, setCopiedBatchHash] = useState<boolean>(false);

  // New Claim Modal State
  const [showNewClaimModal, setShowNewClaimModal] = useState<boolean>(false);
  const [newInsurer, setNewInsurer] = useState<ElectronicClaim['insurer']>('FORTE');
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [newPolicyNum, setNewPolicyNum] = useState<string>('');
  const [newMemberId, setNewMemberId] = useState<string>('');
  const [newClaimType, setNewClaimType] = useState<ElectronicClaim['claimType']>('OUTPATIENT');
  const [newDiagCode, setNewDiagCode] = useState<string>('J06.9');
  const [newDiagName, setNewDiagName] = useState<string>('Acute Upper Respiratory Tract Infection');
  const [newServiceDesc, setNewServiceDesc] = useState<string>('Medical Consultation & Treatment');
  const [newBilledAmount, setNewBilledAmount] = useState<number>(35.0);
  const [newCoveredAmount, setNewCoveredAmount] = useState<number>(28.0);

  // Surveillance State
  const [diseases, setDiseases] = useState<ReportableDisease[]>([]);
  const [cases, setCases] = useState<SurveillanceCaseRecord[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<string>('2026-W42');
  const [showNewCaseModal, setShowNewCaseModal] = useState<boolean>(false);
  const [selectedDiseaseCode, setSelectedDiseaseCode] = useState<string>('A90');
  const [caseType, setCaseType] = useState<SurveillanceCaseRecord['caseType']>('CONFIRMED');
  const [labMethod, setLabMethod] = useState<SurveillanceCaseRecord['laboratoryConfirmation']>('RDT');
  const [caseAge, setCaseAge] = useState<number>(30);
  const [caseGender, setCaseGender] = useState<'M' | 'F'>('M');
  const [caseProvince, setCaseProvince] = useState<string>('KH-12');

  // XML Validator State
  const [rawXmlToValidate, setRawXmlToValidate] = useState<string>('');
  const [validationOutput, setValidationOutput] = useState<{ valid: boolean; errors: string[]; schemaVersion?: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res: any = await api.eclaim.listClaims();
      const cList: ElectronicClaim[] = Array.isArray(res) ? res : res?.data || [];
      setClaims(cList);
      if (cList.length > 0 && !selectedClaim) {
        setSelectedClaim(cList[0]);
      }

      const dRes: any = await api.eclaim.listDiseases();
      setDiseases(Array.isArray(dRes) ? dRes : dRes?.data || []);

      const casesRes: any = await api.eclaim.listSurveillanceCases({ period: currentPeriod });
      setCases(Array.isArray(casesRes) ? casesRes : casesRes?.data || []);
    } catch {
      // Local fallback simulation data
      const mockClaim: ElectronicClaim = {
        id: 'clm-2026-001',
        claimNumber: 'CLM-FORTE-2026-8819',
        insurer: 'FORTE',
        policyNumber: 'FT-MED-994821',
        memberId: 'MEM-88129',
        patientId: 'p-1001',
        patientName: 'Chea Sokunthea',
        patientDob: '1990-05-14',
        patientGender: 'Female',
        providerId: 'PROV-CAM-0042',
        providerName: 'Preah Monivong Family Clinic',
        providerLicense: 'MOH-CLINIC-7721',
        preAuthCode: 'AUTH-FT-9912',
        claimType: 'OUTPATIENT',
        diagnosisCodes: [{ code: 'J01.90', name: 'Acute sinusitis, unspecified', isPrimary: true }],
        items: [
          {
            id: 'item-01',
            serviceCode: 'CONS-SPEC-01',
            description: 'Specialist Medical Consultation',
            quantity: 1,
            unitPriceUsd: 25.0,
            totalPriceUsd: 25.0,
            coveredAmountUsd: 20.0,
            coPayUsd: 5.0,
            deductibleUsd: 0.0
          }
        ],
        totalBilledUsd: 25.0,
        totalClaimedUsd: 20.0,
        patientShareUsd: 5.0,
        status: 'PRE_APPROVED',
        createdAt: new Date().toISOString()
      };
      setClaims([mockClaim]);
      setSelectedClaim(mockClaim);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPeriod]);

  const filteredClaims = claims.filter((c) => {
    if (insurerFilter === 'ALL') return true;
    return c.insurer === insurerFilter;
  });

  const handleSubmitClaim = async (id: string) => {
    try {
      const res: any = await api.eclaim.submitClaim(id);
      loadData();
      if (selectedClaim && selectedClaim.id === id) {
        setSelectedClaim({
          ...selectedClaim,
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          transactionReference: res?.transactionReference || `TXN-OK-${Date.now().toString(36)}`,
          batchHash: res?.batchHash || '8f7a9e2c4182b79104ad58129e01fbc349a182049e71b29a1738c821a89b021f'
        });
      }
    } catch {
      if (selectedClaim && selectedClaim.id === id) {
        setSelectedClaim({
          ...selectedClaim,
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
          transactionReference: `TXN-MOCK-${Date.now().toString(36).toUpperCase()}`,
          batchHash: '8f7a9e2c4182b79104ad58129e01fbc349a182049e71b29a1738c821a89b021f'
        });
      }
    }
  };

  const handleAdjudicate = async (status: 'PRE_APPROVED' | 'SETTLED' | 'REJECTED') => {
    if (!selectedClaim) return;
    try {
      await api.eclaim.adjudicateClaim(selectedClaim.id, {
        status,
        notes: `Simulated clearinghouse decision: ${status} pursuant to policy schedule.`
      });
      loadData();
      setSelectedClaim({
        ...selectedClaim,
        status,
        adjudicatedAt: new Date().toISOString(),
        adjudicationNotes: `Decision: ${status} approved.`
      });
    } catch {
      setSelectedClaim({
        ...selectedClaim,
        status,
        adjudicatedAt: new Date().toISOString(),
        adjudicationNotes: `Decision: ${status} approved.`
      });
    }
  };

  const handleCreateClaim = async () => {
    if (!newPatientName.trim() || !newPolicyNum.trim()) return;

    const payload = {
      insurer: newInsurer,
      patientName: newPatientName.trim(),
      policyNumber: newPolicyNum.trim(),
      memberId: newMemberId.trim() || 'MEM-GEN',
      claimType: newClaimType,
      diagnosisCodes: [{ code: newDiagCode, name: newDiagName, isPrimary: true }],
      items: [
        {
          id: `item-${Date.now()}`,
          serviceCode: 'SVC-GEN-01',
          description: newServiceDesc || 'Clinical Service',
          quantity: 1,
          unitPriceUsd: newBilledAmount,
          totalPriceUsd: newBilledAmount,
          coveredAmountUsd: newCoveredAmount,
          coPayUsd: Math.max(0, newBilledAmount - newCoveredAmount),
          deductibleUsd: 0.0
        }
      ]
    };

    try {
      const res: any = await api.eclaim.createClaim(payload);
      const newClaim = res?.data || res;
      setShowNewClaimModal(false);
      setNewPatientName('');
      setNewPolicyNum('');
      setNewMemberId('');
      loadData();
      if (newClaim?.id) {
        setSelectedClaim(newClaim);
      }
    } catch {
      setShowNewClaimModal(false);
    }
  };

  const handleRecordCase = async () => {
    const dis = diseases.find((d) => d.code === selectedDiseaseCode);
    const payload = {
      diseaseCode: selectedDiseaseCode,
      diseaseName: dis?.englishName || 'Reportable Condition',
      caseType,
      laboratoryConfirmation: labMethod,
      patientAge: caseAge,
      patientGender: caseGender,
      provinceCode: caseProvince,
      reportingPeriod: currentPeriod
    };

    try {
      await api.eclaim.recordSurveillanceCase(payload);
      setShowNewCaseModal(false);
      loadData();
    } catch {
      setShowNewCaseModal(false);
    }
  };

  const handleValidateXml = async () => {
    if (!rawXmlToValidate.trim()) return;
    try {
      const res: any = await api.eclaim.validateXml(rawXmlToValidate);
      setValidationOutput(res?.data || res);
    } catch {
      setValidationOutput({ valid: false, errors: ['Failed to execute schema validation against server.'] });
    }
  };

  const handleExportDhis2Xml = async () => {
    try {
      const res: any = await api.eclaim.getDhis2Xml(currentPeriod);
      const xml = res?.data?.xml || res?.xml || '<dxf />';
      setXmlModalContent({
        title: `MoH DHIS2 Communicable Disease Surveillance XML (${currentPeriod})`,
        content: xml
      });
    } catch {
      // Fallback
      setXmlModalContent({
        title: `MoH DHIS2 Export (${currentPeriod})`,
        content: `<?xml version="1.0" encoding="UTF-8"?>\n<dxf xmlns="http://dhis2.org/schema/dxf/2.0">\n  <meta><reportingPeriod>${currentPeriod}</reportingPeriod></meta>\n</dxf>`
      });
    }
  };

  const handleExportDhis2Json = async () => {
    try {
      const res: any = await api.eclaim.getDhis2Json(currentPeriod);
      const jsonStr = JSON.stringify(res?.data || res, null, 2);
      setXmlModalContent({
        title: `MoH DHIS2 Communicable Disease Surveillance JSON (${currentPeriod})`,
        content: jsonStr
      });
    } catch {
      setXmlModalContent({
        title: `MoH DHIS2 JSON Export (${currentPeriod})`,
        content: `{\n  "dataSet": "DS_MOH_COMMUNICABLE_DISEASE_SURVEILLANCE",\n  "period": "${currentPeriod}"\n}`
      });
    }
  };

  const handleViewClaimXml = async (claim: ElectronicClaim) => {
    try {
      const res: any = await api.eclaim.getClaimXml(claim.id);
      const xml = res?.data?.xml || claim.xmlPayload || 'XML unavailable';
      setXmlModalContent({
        title: `ANSI ASC X12 / 837P XML Claim: ${claim.claimNumber}`,
        content: xml
      });
    } catch {
      setXmlModalContent({
        title: `Claim XML: ${claim.claimNumber}`,
        content: claim.xmlPayload || 'XML generation fallback'
      });
    }
  };

  const handleViewClaimFhir = async (claim: ElectronicClaim) => {
    try {
      const res: any = await api.eclaim.getClaimFhir(claim.id);
      const jsonStr = JSON.stringify(res?.data || claim.fhirJsonPayload || res, null, 2);
      setXmlModalContent({
        title: `FHIR R4 Claim Resource JSON: ${claim.claimNumber}`,
        content: jsonStr
      });
    } catch {
      setXmlModalContent({
        title: `FHIR JSON: ${claim.claimNumber}`,
        content: JSON.stringify(claim.fhirJsonPayload || { resourceType: 'Claim' }, null, 2)
      });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pb-16">
      {/* Top Header */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-stone-900">
                  {isKh ? 'ការទាមទារធានារ៉ាប់រង & ជំងឺឆ្លង MoH' : 'Electronic Claims & MoH Disease Surveillance'}
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  ANSI 837P XML
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  FHIR R4
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  DHIS2 Surveillance
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {isKh
                  ? 'ទម្រង់ទាមទារសំណងធានារ៉ាប់រងស្តង់ដារអន្តរជាតិ និងការរាយការណ៍ជំងឺឆ្លងតាមកាលវិភាគទៅក្រសួងសុខាភិបាល'
                  : 'Electronic claim clearinghouse interface for private insurers/NSSF and MoH communicable disease reporting'}
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('CLAIMS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'CLAIMS'
                  ? 'bg-white text-teal-800 shadow-xs font-bold border border-stone-200/60'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{isKh ? 'ទាមទារធានារ៉ាប់រង' : 'Insurance e-Claims'}</span>
              <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 text-[10px]">
                {claims.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('SURVEILLANCE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'SURVEILLANCE'
                  ? 'bg-white text-teal-800 shadow-xs font-bold border border-stone-200/60'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{isKh ? 'ជំងឺឆ្លង MoH DHIS2' : 'MoH Surveillance'}</span>
              <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-700 text-[10px]">
                {cases.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('VALIDATOR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'VALIDATOR'
                  ? 'bg-white text-teal-800 shadow-xs font-bold border border-stone-200/60'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{isKh ? 'ផ្ទៀងផ្ទាត់កូដ XML' : 'XML & Schema Diagnostics'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        {/* TAB 1: INSURANCE e-CLAIMS */}
        {activeTab === 'CLAIMS' && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-600">{isKh ? 'ក្រុមហ៊ុន៖' : 'Insurer:'}</span>
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
                  {['ALL', 'FORTE', 'PRUDENTIAL', 'AIA', 'MANULIFE', 'INFINITY', 'NSSF'].map((ins) => (
                    <button
                      key={ins}
                      onClick={() => setInsurerFilter(ins)}
                      className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                        insurerFilter === ins
                          ? 'bg-white text-teal-800 font-bold shadow-xs border border-stone-200/60'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {ins}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadData}
                  className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 shadow-xs"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowNewClaimModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isKh ? 'បង្កើតសំណុំទាមទារថ្មី' : 'Create Electronic Claim'}</span>
                </button>
              </div>
            </div>

            {/* Claims Master-Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Claims List (6 cols) */}
              <div className="lg:col-span-6 space-y-3">
                {filteredClaims.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-stone-200 text-center text-xs text-stone-400">
                    {isKh ? 'មិនមានសំណុំរឿងទាមទារធានារ៉ាប់រងទេ' : 'No electronic claims found for this filter.'}
                  </div>
                ) : (
                  filteredClaims.map((claim) => {
                    const isSelected = selectedClaim?.id === claim.id;
                    const isSettled = claim.status === 'SETTLED';
                    const isApproved = claim.status === 'PRE_APPROVED';
                    const isSubmitted = claim.status === 'SUBMITTED';

                    return (
                      <div
                        key={claim.id}
                        onClick={() => setSelectedClaim(claim)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs ${
                          isSelected
                            ? 'border-teal-500 ring-2 ring-teal-100'
                            : 'border-stone-200 hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                              {claim.claimNumber}
                            </span>
                            <span className="font-bold text-sm text-stone-900">{claim.patientName}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isSettled
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isApproved
                                ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                : isSubmitted
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {claim.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-stone-100 text-xs">
                          <div>
                            <span className="text-stone-400 block text-[10px]">Insurer</span>
                            <span className="font-bold text-stone-800">{claim.insurer}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">Claimed (USD)</span>
                            <span className="font-bold text-teal-700 font-mono">
                              ${claim.totalClaimedUsd.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[10px]">Patient Share</span>
                            <span className="font-bold text-stone-600 font-mono">
                              ${claim.patientShareUsd.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
                          <span className="truncate max-w-[280px]">
                            Primary: {claim.diagnosisCodes?.[0]?.name || 'Diagnosis Pending'}
                          </span>
                          <span className="font-mono text-[10px] text-stone-400">
                            {new Date(claim.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Claim Detail & XML/FHIR Inspector (6 cols) */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
                {selectedClaim ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-stone-900">{selectedClaim.claimNumber}</span>
                          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                            {selectedClaim.claimType}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Policy: {selectedClaim.policyNumber} | Member ID: {selectedClaim.memberId}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleViewClaimXml(selectedClaim)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-stone-200"
                          title="View ANSI 837P XML"
                        >
                          <FileCode className="w-3.5 h-3.5 text-teal-600" />
                          <span>XML</span>
                        </button>
                        <button
                          onClick={() => handleViewClaimFhir(selectedClaim)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-stone-200"
                          title="View FHIR R4 JSON"
                        >
                          <Code className="w-3.5 h-3.5 text-indigo-600" />
                          <span>FHIR</span>
                        </button>
                      </div>
                    </div>

                    {/* Financial Summary Card */}
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-white rounded-lg border border-stone-200/60">
                        <span className="text-[10px] text-stone-500 block">Total Billed</span>
                        <span className="font-bold text-stone-900 font-mono text-sm">
                          ${selectedClaim.totalBilledUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2 bg-teal-50 rounded-lg border border-teal-200/60">
                        <span className="text-[10px] text-teal-800 block">Claimed (Insurer)</span>
                        <span className="font-bold text-teal-800 font-mono text-sm">
                          ${selectedClaim.totalClaimedUsd.toFixed(2)}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-stone-200/60">
                        <span className="text-[10px] text-stone-500 block">Patient Co-Pay</span>
                        <span className="font-bold text-stone-700 font-mono text-sm">
                          ${selectedClaim.patientShareUsd.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Batch Hash & Transaction Ref */}
                    {selectedClaim.batchHash && (
                      <div className="p-3 bg-stone-900 text-white rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider">
                            Electronic Batch Hash (SHA-256)
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            Txn: {selectedClaim.transactionReference}
                          </span>
                        </div>
                        <div className="font-mono text-[9px] text-stone-300 break-all">
                          {selectedClaim.batchHash}
                        </div>
                      </div>
                    )}

                    {/* Itemized Claim Lines */}
                    <div>
                      <h4 className="text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                        {isKh ? 'មុខទំនិញ/សេវាកម្មទាមទារ' : 'Itemized Claim Lines'}
                      </h4>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {selectedClaim.items?.map((it, idx) => (
                          <div
                            key={it.id || idx}
                            className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-stone-900">
                                <span className="font-mono text-teal-700 mr-1.5">{it.serviceCode}</span>
                                {it.description}
                              </div>
                              <div className="text-[11px] text-stone-500 mt-0.5">
                                Qty: {it.quantity} x ${it.unitPriceUsd.toFixed(2)} | Co-Pay: ${it.coPayUsd.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-teal-800 font-mono block">
                                ${it.coveredAmountUsd.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                Total: ${it.totalPriceUsd.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Adjudication Status & Notes */}
                    {selectedClaim.adjudicationNotes && (
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                        <span className="font-bold block text-[11px]">Insurer Adjudication Notice:</span>
                        <p className="mt-0.5 text-[11px] leading-relaxed">{selectedClaim.adjudicationNotes}</p>
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center gap-2">
                      {selectedClaim.status === 'DRAFT' || selectedClaim.status === 'VALIDATED' ? (
                        <button
                          onClick={() => handleSubmitClaim(selectedClaim.id)}
                          className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isKh ? 'បញ្ជូនទៅ Clearinghouse' : 'Submit Claim to Insurer'}</span>
                        </button>
                      ) : null}

                      {/* Adjudication Simulator Buttons */}
                      <button
                        onClick={() => handleAdjudicate('PRE_APPROVED')}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all"
                      >
                        {isKh ? 'អនុម័តបឋម' : 'Pre-Approve'}
                      </button>
                      <button
                        onClick={() => handleAdjudicate('SETTLED')}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all"
                      >
                        {isKh ? 'ទូទាត់សំណង' : 'Settle'}
                      </button>
                      <button
                        onClick={() => handleAdjudicate('REJECTED')}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-xl text-xs font-bold transition-all"
                      >
                        {isKh ? 'បដិសេធ' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-stone-400 text-xs">
                    {isKh ? 'សូមជ្រើសរើសសំណុំទាមទារដើម្បីពិនិត្យលម្អិត' : 'Select an electronic claim to preview details.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MoH DISEASE SURVEILLANCE */}
        {activeTab === 'SURVEILLANCE' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  {isKh
                    ? 'ប្រព័ន្ធតាមដានជំងឺឆ្លង និងរាយការណ៍រោគរាតត្បាត MoH Cambodia'
                    : 'Ministry of Health Communicable Disease Surveillance & DHIS2 Reporting'}
                </h2>
                <p className="text-xs text-stone-500">
                  {isKh
                    ? 'កត់ត្រាករណីជំងឺឆ្លងជាកំហិត និងទាញយកទម្រង់រាយការណ៍ស្តង់ដារ DHIS2 XML / JSON'
                    : 'Mandatory communicable disease surveillance conforming to MoH CDC guidelines'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-stone-200 text-xs">
                  <span className="font-semibold text-stone-600">Period:</span>
                  <select
                    value={currentPeriod}
                    onChange={(e) => setCurrentPeriod(e.target.value)}
                    className="font-mono font-bold text-teal-800 focus:outline-none bg-transparent"
                  >
                    <option value="2026-W42">2026-W42 (Current Week)</option>
                    <option value="2026-W41">2026-W41</option>
                    <option value="2026-M10">2026-M10 (October 2026)</option>
                    <option value="2026-M09">2026-M09 (September 2026)</option>
                  </select>
                </div>

                <button
                  onClick={handleExportDhis2Xml}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-200 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isKh ? 'ទាញយក DHIS2 XML' : 'DHIS2 XML'}</span>
                </button>

                <button
                  onClick={handleExportDhis2Json}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold border border-stone-200 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{isKh ? 'ទាញយក DHIS2 JSON' : 'DHIS2 JSON'}</span>
                </button>

                <button
                  onClick={() => setShowNewCaseModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isKh ? 'កត់ត្រាករណីជំងឺឆ្លង' : 'Record Case'}</span>
                </button>
              </div>
            </div>

            {/* Disease Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {diseases.slice(0, 4).map((d) => {
                const count = cases.filter((c) => c.diseaseCode === d.code).length;
                return (
                  <div key={d.code} className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {d.code}
                      </span>
                      <span className="text-[10px] text-stone-400 font-bold">{d.category}</span>
                    </div>
                    <h3 className="font-bold text-stone-900 text-xs mt-1 truncate">{d.englishName}</h3>
                    <div className="text-[11px] text-stone-500 truncate">{d.khmerName}</div>
                    <div className="mt-2 text-right">
                      <span className="text-xl font-bold font-mono text-stone-900">{count}</span>
                      <span className="text-[10px] text-stone-400 ml-1">cases</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Surveillance Case Registry Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <span className="text-xs font-bold text-stone-800">
                  {isKh ? 'កំណត់ត្រាករណីជំងឺឆ្លងសម្រាប់វដ្ត៖' : 'Communicable Disease Cases for Period:'} {currentPeriod}
                </span>
                <span className="text-xs font-mono text-stone-500">{cases.length} cases registered</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 text-stone-500 border-b border-stone-200 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Case ID</th>
                      <th className="px-4 py-2.5">Condition / Disease</th>
                      <th className="px-4 py-2.5">Classification</th>
                      <th className="px-4 py-2.5">Lab Confirmation</th>
                      <th className="px-4 py-2.5">Age / Gender</th>
                      <th className="px-4 py-2.5">Province Code</th>
                      <th className="px-4 py-2.5">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {cases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                          {isKh ? 'មិនមានករណីជំងឺឆ្លងក្នុងវដ្តនេះទេ' : 'No surveillance cases found for this period.'}
                        </td>
                      </tr>
                    ) : (
                      cases.map((c) => (
                        <tr key={c.id} className="hover:bg-stone-50/50">
                          <td className="px-4 py-3 font-mono text-stone-600">{c.id}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-teal-700 mr-1.5 font-bold">{c.diseaseCode}</span>
                            <span className="font-semibold text-stone-900">{c.diseaseName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {c.caseType}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-stone-700">{c.laboratoryConfirmation}</td>
                          <td className="px-4 py-3">
                            {c.patientAge}y / {c.patientGender}
                          </td>
                          <td className="px-4 py-3 font-mono text-stone-600">{c.provinceCode}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-700">{c.outcome}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: XML & SCHEMA DIAGNOSTICS */}
        {activeTab === 'VALIDATOR' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {isKh ? 'ការវិភាគផ្ទៀងផ្ទាត់កូដ XML ធានារ៉ាប់រង & MoH' : 'XML & Schema Diagnostics Tool'}
              </h2>
              <p className="text-xs text-stone-500">
                {isKh
                  ? 'បញ្ចូលកូដ ANSI 837P XML ឬ MoH e-Claim XML ដើម្បីផ្ទៀងផ្ទាត់តាមស្តង់ដារក្រសួងសុខាភិបាល'
                  : 'Verify compliance against ANSI ASC X12 / 837P and MoH Cambodia electronic claim specifications'}
              </p>
            </div>

            <textarea
              rows={12}
              value={rawXmlToValidate}
              onChange={(e) => setRawXmlToValidate(e.target.value)}
              placeholder={
                isKh
                  ? 'បញ្ចូលកូដ XML នៅទីនេះ ដើម្បីធ្វើការផ្ទៀងផ្ទាត់...'
                  : 'Paste ANSI 837P or MoH electronic claim XML payload here...'
              }
              className="w-full text-xs font-mono p-4 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500 bg-stone-50 leading-relaxed"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (selectedClaim) {
                    setRawXmlToValidate(selectedClaim.xmlPayload || '');
                  }
                }}
                className="text-xs text-teal-700 font-bold hover:underline"
              >
                {isKh ? 'ផ្ទុកកូដ XML ពីសំណុំរឿងបច្ចុប្បន្ន' : 'Load XML from selected claim'}
              </button>

              <button
                onClick={handleValidateXml}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Code className="w-4 h-4" />
                <span>{isKh ? 'ផ្ទៀងផ្ទាត់កូដ XML' : 'Validate XML Schema'}</span>
              </button>
            </div>

            {/* Validation Result Box */}
            {validationOutput && (
              <div
                className={`p-4 rounded-xl text-xs ${
                  validationOutput.valid
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {validationOutput.valid ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>{isKh ? 'កូដ XML ស្របតាមស្តង់ដារ ១០០%' : 'XML Schema Validation Passed: 100% Compliant'}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span>{isKh ? 'រកឃើញកំហុសក្នុងការផ្ទៀងផ្ទាត់' : 'XML Schema Validation Errors Detected'}</span>
                    </>
                  )}
                </div>

                {!validationOutput.valid && validationOutput.errors && (
                  <ul className="mt-2 list-disc list-inside space-y-1 font-mono text-[11px] text-red-800">
                    {validationOutput.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Raw Payload Inspector Modal */}
      {xmlModalContent && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 shadow-2xl border border-stone-200 space-y-3 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900 truncate">{xmlModalContent.title}</h3>
              <button
                onClick={() => setXmlModalContent(null)}
                className="text-stone-400 hover:text-stone-700 font-bold"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <pre className="p-3 bg-stone-900 text-stone-100 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {xmlModalContent.content}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setXmlModalContent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-900 text-white"
              >
                {isKh ? 'បិទ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Claim Modal */}
      {showNewClaimModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900">
                {isKh ? 'បង្កើតសំណុំទាមទារអេឡិចត្រូនិក' : 'Create Electronic Claim'}
              </h3>
              <button onClick={() => setShowNewClaimModal(false)} className="text-stone-400 font-bold">
                ×
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-0.5">Insurer:</label>
                <select
                  value={newInsurer}
                  onChange={(e) => setNewInsurer(e.target.value as any)}
                  className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                >
                  <option value="FORTE">Forte Insurance</option>
                  <option value="PRUDENTIAL">Prudential Life Assurance</option>
                  <option value="AIA">AIA Cambodia</option>
                  <option value="MANULIFE">Manulife Cambodia</option>
                  <option value="INFINITY">Infinity General Insurance</option>
                  <option value="NSSF">NSSF (ប.ស.ស.)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-0.5">Patient Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Chea Sokunthea"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Policy Number:</label>
                  <input
                    type="text"
                    placeholder="FT-MED-9948"
                    value={newPolicyNum}
                    onChange={(e) => setNewPolicyNum(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Member ID:</label>
                  <input
                    type="text"
                    placeholder="MEM-8812"
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Billed Amount ($):</label>
                  <input
                    type="number"
                    value={newBilledAmount}
                    onChange={(e) => setNewBilledAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Covered Amount ($):</label>
                  <input
                    type="number"
                    value={newCoveredAmount}
                    onChange={(e) => setNewCoveredAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setShowNewClaimModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                {isKh ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateClaim}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isKh ? 'បង្កើត' : 'Create Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Surveillance Case Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900">
                {isKh ? 'កត់ត្រាករណីជំងឺឆ្លង MoH' : 'Record Communicable Disease Case'}
              </h3>
              <button onClick={() => setShowNewCaseModal(false)} className="text-stone-400 font-bold">
                ×
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-0.5">Condition / Disease:</label>
                <select
                  value={selectedDiseaseCode}
                  onChange={(e) => setSelectedDiseaseCode(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                >
                  {diseases.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.englishName} ({d.khmerName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Classification:</label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value as any)}
                    className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="SUSPECTED">Suspected</option>
                    <option value="PROBABLE">Probable</option>
                    <option value="CONFIRMED">Confirmed</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Lab Confirmation:</label>
                  <select
                    value={labMethod}
                    onChange={(e) => setLabMethod(e.target.value as any)}
                    className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="RDT">Rapid Diagnostic Test (RDT)</option>
                    <option value="PCR">RT-PCR</option>
                    <option value="SEROLOGY">Serology ELISA</option>
                    <option value="CULTURE">Bacterial Culture</option>
                    <option value="CLINICAL_ONLY">Clinical Symptoms Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Age:</label>
                  <input
                    type="number"
                    value={caseAge}
                    onChange={(e) => setCaseAge(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-stone-700 block mb-0.5">Gender:</label>
                  <select
                    value={caseGender}
                    onChange={(e) => setCaseGender(e.target.value as any)}
                    className="w-full p-2 border border-stone-300 rounded-xl bg-white"
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                {isKh ? 'បោះបង់' : 'Cancel'}
              </button>
              <button
                onClick={handleRecordCase}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isKh ? 'កត់ត្រា' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
