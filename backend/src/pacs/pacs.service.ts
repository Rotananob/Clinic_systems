import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

export type PacsModality = 'DX' | 'CR' | 'US' | 'CT' | 'MR' | 'ES';
export type PacsStudyStatus = 'UNREAD' | 'IN_REVIEW' | 'REPORTED' | 'CRITICAL';

export interface PacsMeasurement {
  id: string;
  type: 'CALIPER' | 'CTR' | 'COBB_ANGLE' | 'ROI';
  value: number;
  unit: string;
  label: string;
  calculatedAt: string;
}

export interface DicomStudy {
  id: string;
  studyInstanceUid: string;
  seriesInstanceUid: string;
  sopInstanceUid: string;
  patientId: string;
  patientName: string;
  patientGender: 'M' | 'F' | 'OTHER';
  patientAge: number;
  modality: PacsModality;
  bodyPart: string;
  studyDate: string;
  studyTime: string;
  referringPhysician: string;
  radiologist: string;
  studyDescription: string;
  numberOfInstances: number;
  windowCenter: number;
  windowWidth: number;
  losslessEncryptedUri: string;
  thumbnailUri: string;
  findings: string;
  impression: string;
  status: PacsStudyStatus;
  cardiothoracicRatio?: number;
  cobbAngle?: number;
  measurements: PacsMeasurement[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RadiologistReportInput {
  findings: string;
  impression: string;
  status: 'REPORTED' | 'CRITICAL';
  radiologist: string;
  cardiothoracicRatio?: number;
  cobbAngle?: number;
  measurements?: PacsMeasurement[];
}

export interface CtrCalculationResult {
  cardiacWidthMm: number;
  thoracicWidthMm: number;
  ratio: number;
  interpretation: 'NORMAL' | 'BORDERLINE' | 'CARDIOMEGALY';
  clinicalNote: string;
}

export interface WindowLevelPreset {
  name: string;
  description: string;
  windowWidth: number;
  windowCenter: number;
  recommendedModalities: PacsModality[];
}

export const PACS_WINDOW_PRESETS: Record<string, WindowLevelPreset> = {
  CHEST_XRAY: {
    name: 'Chest X-Ray Standard',
    description: 'High contrast standard dynamic range for thoracic radiography',
    windowWidth: 4096,
    windowCenter: 2048,
    recommendedModalities: ['DX', 'CR'],
  },
  LUNG_PARENCHYMA: {
    name: 'Pulmonary / Lung Window',
    description: 'Visualizes pulmonary bronchi, infiltrates, nodules, and pneumothorax',
    windowWidth: 1500,
    windowCenter: -600,
    recommendedModalities: ['CT'],
  },
  MEDIASTINUM_SOFT_TISSUE: {
    name: 'Mediastinum & Soft Tissue',
    description: 'Delineates mediastinal lymph nodes, cardiac borders, and vascular structures',
    windowWidth: 350,
    windowCenter: 50,
    recommendedModalities: ['CT'],
  },
  BONE_CORTICAL: {
    name: 'Cortical Bone Window',
    description: 'High window width for osseous trabeculae, cortical fractures, and osteophytes',
    windowWidth: 2000,
    windowCenter: 350,
    recommendedModalities: ['CT', 'DX', 'CR'],
  },
  BRAIN_PARENCHYMA: {
    name: 'Brain Parenchyma',
    description: 'Narrow dynamic range differentiating gray matter from white matter and edema',
    windowWidth: 80,
    windowCenter: 40,
    recommendedModalities: ['CT'],
  },
  SUBDURAL_EPIDURAL: {
    name: 'Subdural / Epidural Blood Window',
    description: 'Differentiating hyperdense intracranial hemorrhage from adjacent calvarium',
    windowWidth: 150,
    windowCenter: 75,
    recommendedModalities: ['CT'],
  },
  ULTRASOUND_DEFAULT: {
    name: 'Ultrasound Dynamic Range',
    description: 'Linear echogenicity mapping for diagnostic sonography',
    windowWidth: 256,
    windowCenter: 128,
    recommendedModalities: ['US'],
  },
};

export class PacsService {
  private studies: Map<string, DicomStudy> = new Map();

  constructor() {
    this.seedDefaultStudies();
  }

  private seedDefaultStudies(): void {
    const defaultStudies: DicomStudy[] = [
      {
        id: 'study-001',
        studyInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.001',
        seriesInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.001.1',
        sopInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.001.1.1',
        patientId: 'PT-1001',
        patientName: 'KEO Sokha',
        patientGender: 'M',
        patientAge: 58,
        modality: 'DX',
        bodyPart: 'CHEST',
        studyDate: '2026-10-20',
        studyTime: '08:45',
        referringPhysician: 'Dr. CHAN Vanna',
        radiologist: 'Dr. TEP Somally',
        studyDescription: 'Chest PA Standing View with CTR Evaluation',
        numberOfInstances: 1,
        windowCenter: 2048,
        windowWidth: 4096,
        losslessEncryptedUri: 'pacs://encrypted/studies/20261021.001/image001.dcm',
        thumbnailUri: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=60',
        findings: 'Cardiac silhouette is mildly enlarged. Thoracic transverse diameter measures 295 mm, cardiac transverse diameter measures 165 mm (CTR = 0.56). Costophrenic angles are sharp. Both pulmonary hila are unremarkable. No active parenchymal infiltration or pneumothorax.',
        impression: 'Mild cardiomegaly without overt pulmonary congestion or active pleuroparenchymal disease.',
        status: 'REPORTED',
        cardiothoracicRatio: 0.56,
        measurements: [
          {
            id: 'meas-001',
            type: 'CTR',
            value: 0.56,
            unit: 'ratio',
            label: 'Cardiothoracic Ratio',
            calculatedAt: '2026-10-20T09:15:00Z',
          },
        ],
        tenantId: 'default-tenant',
        createdAt: '2026-10-20T08:50:00Z',
        updatedAt: '2026-10-20T09:15:00Z',
      },
      {
        id: 'study-002',
        studyInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.002',
        seriesInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.002.1',
        sopInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.002.1.1',
        patientId: 'PT-1002',
        patientName: 'CHHAY Bopha',
        patientGender: 'F',
        patientAge: 32,
        modality: 'US',
        bodyPart: 'ABDOMEN',
        studyDate: '2026-10-20',
        studyTime: '10:15',
        referringPhysician: 'Dr. RITH Sreynoch',
        radiologist: 'Dr. TEP Somally',
        studyDescription: 'Upper Abdominal Diagnostic Ultrasound',
        numberOfInstances: 14,
        windowCenter: 128,
        windowWidth: 256,
        losslessEncryptedUri: 'pacs://encrypted/studies/20261021.002/cine_loop.dcm',
        thumbnailUri: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=60',
        findings: 'Liver demonstrates homogenous acoustic parenchymal texture without focal solid or cystic space-occupying lesion. Gallbladder is well-distended with thin, smooth wall; lumen is anechoic without acoustic shadowing stones. Common bile duct measures 3.8 mm (normal). Spleen and bilateral kidneys are normal in size and corticomedullary differentiation.',
        impression: 'Normal upper abdominal ultrasound study. Cholelithiasis and choledocholithiasis ruled out.',
        status: 'REPORTED',
        measurements: [
          {
            id: 'meas-002',
            type: 'CALIPER',
            value: 3.8,
            unit: 'mm',
            label: 'Common Bile Duct Diameter',
            calculatedAt: '2026-10-20T10:35:00Z',
          },
        ],
        tenantId: 'default-tenant',
        createdAt: '2026-10-20T10:18:00Z',
        updatedAt: '2026-10-20T10:35:00Z',
      },
      {
        id: 'study-003',
        studyInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.003',
        seriesInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.003.1',
        sopInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.003.1.1',
        patientId: 'PT-1003',
        patientName: 'MENG Dara',
        patientGender: 'M',
        patientAge: 44,
        modality: 'CT',
        bodyPart: 'BRAIN',
        studyDate: '2026-10-20',
        studyTime: '11:30',
        referringPhysician: 'Dr. CHAN Vanna',
        radiologist: 'Pending Review',
        studyDescription: 'Non-Contrast Brain CT for Acute Thunderclap Headache',
        numberOfInstances: 64,
        windowCenter: 40,
        windowWidth: 80,
        losslessEncryptedUri: 'pacs://encrypted/studies/20261021.003/brain_series.dcm',
        thumbnailUri: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=600&auto=format&fit=crop&q=60',
        findings: 'Stat scan requested for acute thunderclap headache. Initial scout and volumetric series completed. Pending formal radiologist verification.',
        impression: 'Urgent scan awaiting radiologist interpretation.',
        status: 'UNREAD',
        measurements: [],
        tenantId: 'default-tenant',
        createdAt: '2026-10-20T11:35:00Z',
        updatedAt: '2026-10-20T11:35:00Z',
      },
      {
        id: 'study-004',
        studyInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.004',
        seriesInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.004.1',
        sopInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.004.1.1',
        patientId: 'PT-1004',
        patientName: 'HENG Piseth',
        patientGender: 'M',
        patientAge: 65,
        modality: 'CR',
        bodyPart: 'KNEE',
        studyDate: '2026-10-20',
        studyTime: '14:20',
        referringPhysician: 'Dr. RITH Sreynoch',
        radiologist: 'Dr. TEP Somally',
        studyDescription: 'Right Knee AP and Lateral Weight-Bearing Views',
        numberOfInstances: 2,
        windowCenter: 2048,
        windowWidth: 4096,
        losslessEncryptedUri: 'pacs://encrypted/studies/20261021.004/knee_radiography.dcm',
        thumbnailUri: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=60',
        findings: 'Right knee weight-bearing AP view shows moderate narrowing of the medial tibiofemoral joint compartment. Subchondral sclerosis and marginal osteophyte formation at the medial tibial plateau and femoral condyle. Lateral compartment and patellofemoral joint space are preserved. No intra-articular loose bodies or acute fractures.',
        impression: 'Moderate primary osteoarthritis of the right knee, Kellgren-Lawrence Grade 2 to 3.',
        status: 'REPORTED',
        measurements: [
          {
            id: 'meas-004',
            type: 'CALIPER',
            value: 2.1,
            unit: 'mm',
            label: 'Medial Joint Space',
            calculatedAt: '2026-10-20T14:45:00Z',
          },
        ],
        tenantId: 'default-tenant',
        createdAt: '2026-10-20T14:25:00Z',
        updatedAt: '2026-10-20T14:45:00Z',
      },
      {
        id: 'study-005',
        studyInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.005',
        seriesInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.005.1',
        sopInstanceUid: '1.2.840.10008.5.1.4.1.1.2.20261021.005.1.1',
        patientId: 'PT-1005',
        patientName: 'ORN Chenda',
        patientGender: 'F',
        patientAge: 27,
        modality: 'US',
        bodyPart: 'PELVIS',
        studyDate: '2026-10-20',
        studyTime: '15:10',
        referringPhysician: 'Dr. CHAN Vanna',
        radiologist: 'Dr. TEP Somally',
        studyDescription: 'Obstetric 1st Trimester Ultrasound Dating Exam',
        numberOfInstances: 8,
        windowCenter: 128,
        windowWidth: 256,
        losslessEncryptedUri: 'pacs://encrypted/studies/20261021.005/ob_dating.dcm',
        thumbnailUri: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=60',
        findings: 'Single intrauterine live gestation demonstrated. Crown-Rump Length (CRL) measures 48.2 mm, corresponding to 11 weeks and 4 days of gestational age. Fetal heart activity is regular at 162 beats per minute. Amniotic fluid volume is physiologic. Gestational sac is regular in contour with no retroplacental hematoma.',
        impression: 'Single viable intrauterine pregnancy at 11w4d by ultrasound biometry. Estimated Delivery Date (EDD) aligned with gestational milestones.',
        status: 'REPORTED',
        measurements: [
          {
            id: 'meas-005',
            type: 'CALIPER',
            value: 48.2,
            unit: 'mm',
            label: 'Crown-Rump Length (CRL)',
            calculatedAt: '2026-10-20T15:30:00Z',
          },
        ],
        tenantId: 'default-tenant',
        createdAt: '2026-10-20T15:15:00Z',
        updatedAt: '2026-10-20T15:30:00Z',
      },
    ];

    for (const study of defaultStudies) {
      this.studies.set(study.studyInstanceUid, study);
    }
  }

  public getAllStudies(
    tenantId: string,
    filters?: { modality?: string; status?: string; search?: string },
  ): DicomStudy[] {
    let result = Array.from(this.studies.values()).filter(
      (s) => s.tenantId === tenantId || s.tenantId === 'default-tenant',
    );

    if (filters?.modality && filters.modality !== 'ALL') {
      result = result.filter((s) => s.modality === filters.modality.toUpperCase());
    }

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((s) => s.status === filters.status.toUpperCase());
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.patientName.toLowerCase().includes(q) ||
          s.patientId.toLowerCase().includes(q) ||
          s.studyInstanceUid.toLowerCase().includes(q) ||
          s.bodyPart.toLowerCase().includes(q) ||
          s.studyDescription.toLowerCase().includes(q),
      );
    }

    return result.sort((a, b) => b.studyDate.localeCompare(a.studyDate));
  }

  public getStudyByUid(studyInstanceUid: string, tenantId: string): DicomStudy {
    const study = this.studies.get(studyInstanceUid);
    if (!study) {
      throw new NotFoundException(`DICOM study with UID ${studyInstanceUid} not found`);
    }
    if (study.tenantId !== tenantId && study.tenantId !== 'default-tenant') {
      throw new NotFoundException(`Access denied to DICOM study ${studyInstanceUid}`);
    }
    return study;
  }

  public calculateCardiothoracicRatio(cardiacWidthMm: number, thoracicWidthMm: number): CtrCalculationResult {
    if (cardiacWidthMm <= 0 || thoracicWidthMm <= 0) {
      throw new BadRequestException('Cardiac and thoracic diameters must be greater than zero millimeters');
    }
    if (cardiacWidthMm >= thoracicWidthMm) {
      throw new BadRequestException('Cardiac diameter cannot exceed or equal total internal thoracic diameter');
    }

    const rawRatio = cardiacWidthMm / thoracicWidthMm;
    const ratio = Math.round(rawRatio * 100) / 100;

    let interpretation: 'NORMAL' | 'BORDERLINE' | 'CARDIOMEGALY' = 'NORMAL';
    let clinicalNote = 'Cardiothoracic ratio is within normal clinical limits (less than or equal to 0.50).';

    if (ratio > 0.55) {
      interpretation = 'CARDIOMEGALY';
      clinicalNote = 'Definite cardiomegaly detected (CTR exceeds 0.55). Recommend echocardiographic correlation for chamber enlargement.';
    } else if (ratio > 0.50) {
      interpretation = 'BORDERLINE';
      clinicalNote = 'Borderline cardiac enlargement (CTR between 0.50 and 0.55). Correlate with patient habitus and inspiratory effort.';
    }

    return {
      cardiacWidthMm,
      thoracicWidthMm,
      ratio,
      interpretation,
      clinicalNote,
    };
  }

  public calculateCobbAngle(upperEndplateSlopeDeg: number, lowerEndplateSlopeDeg: number): {
    cobbAngleDeg: number;
    severity: 'NORMAL' | 'MILD_SCOLIOSIS' | 'MODERATE_SCOLIOSIS' | 'SEVERE_SCOLIOSIS';
    clinicalNote: string;
  } {
    const cobbAngleDeg = Math.round(Math.abs(upperEndplateSlopeDeg - lowerEndplateSlopeDeg) * 10) / 10;

    let severity: 'NORMAL' | 'MILD_SCOLIOSIS' | 'MODERATE_SCOLIOSIS' | 'SEVERE_SCOLIOSIS' = 'NORMAL';
    let clinicalNote = 'No structural scoliotic spinal curvature (Cobb angle less than 10 degrees).';

    if (cobbAngleDeg >= 40) {
      severity = 'SEVERE_SCOLIOSIS';
      clinicalNote = 'Severe spinal scoliosis (Cobb angle 40 degrees or greater). Surgical orthopedic consultation indicated.';
    } else if (cobbAngleDeg >= 25) {
      severity = 'MODERATE_SCOLIOSIS';
      clinicalNote = 'Moderate scoliosis (Cobb angle 25 to 39 degrees). Orthotic bracing and active physiotherapy recommended.';
    } else if (cobbAngleDeg >= 10) {
      severity = 'MILD_SCOLIOSIS';
      clinicalNote = 'Mild scoliosis (Cobb angle 10 to 24 degrees). Recommend follow-up serial radiography in 6 months.';
    }

    return {
      cobbAngleDeg,
      severity,
      clinicalNote,
    };
  }

  public saveRadiologistReport(
    studyInstanceUid: string,
    tenantId: string,
    input: RadiologistReportInput,
  ): DicomStudy {
    const study = this.getStudyByUid(studyInstanceUid, tenantId);

    if (!input.findings || input.findings.trim().length === 0) {
      throw new BadRequestException('Clinical radiological findings are required');
    }
    if (!input.impression || input.impression.trim().length === 0) {
      throw new BadRequestException('Diagnostic radiological impression is required');
    }
    if (!input.radiologist || input.radiologist.trim().length === 0) {
      throw new BadRequestException('Reporting radiologist or reading physician name is required');
    }

    study.findings = input.findings.trim();
    study.impression = input.impression.trim();
    study.radiologist = input.radiologist.trim();
    study.status = input.status;
    study.updatedAt = new Date().toISOString();

    if (input.cardiothoracicRatio !== undefined) {
      study.cardiothoracicRatio = input.cardiothoracicRatio;
    }
    if (input.cobbAngle !== undefined) {
      study.cobbAngle = input.cobbAngle;
    }
    if (input.measurements && input.measurements.length > 0) {
      study.measurements = input.measurements;
    }

    this.studies.set(studyInstanceUid, study);
    return study;
  }

  public uploadDicomStudy(
    tenantId: string,
    input: Partial<DicomStudy> & {
      patientId: string;
      patientName: string;
      modality: PacsModality;
      bodyPart: string;
      studyDescription: string;
    },
  ): DicomStudy {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    const randomHex = Math.random().toString(16).substring(2, 8);
    const studyUid = input.studyInstanceUid || `1.2.840.10008.5.1.4.1.1.2.${now.getTime()}.${randomHex}`;

    const newStudy: DicomStudy = {
      id: `study-${Date.now()}`,
      studyInstanceUid: studyUid,
      seriesInstanceUid: `${studyUid}.1`,
      sopInstanceUid: `${studyUid}.1.1`,
      patientId: input.patientId,
      patientName: input.patientName,
      patientGender: input.patientGender || 'OTHER',
      patientAge: input.patientAge || 0,
      modality: input.modality,
      bodyPart: input.bodyPart.toUpperCase(),
      studyDate: input.studyDate || dateStr,
      studyTime: input.studyTime || timeStr,
      referringPhysician: input.referringPhysician || 'Unassigned',
      radiologist: input.radiologist || 'Pending Review',
      studyDescription: input.studyDescription,
      numberOfInstances: input.numberOfInstances || 1,
      windowCenter: input.windowCenter || (input.modality === 'DX' || input.modality === 'CR' ? 2048 : 128),
      windowWidth: input.windowWidth || (input.modality === 'DX' || input.modality === 'CR' ? 4096 : 256),
      losslessEncryptedUri: input.losslessEncryptedUri || `pacs://encrypted/studies/${studyUid}/series1.dcm`,
      thumbnailUri: input.thumbnailUri || 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=60',
      findings: input.findings || 'Awaiting formal radiological examination.',
      impression: input.impression || 'Pending interpretation.',
      status: input.status || 'UNREAD',
      measurements: input.measurements || [],
      tenantId: tenantId || 'default-tenant',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.studies.set(studyUid, newStudy);
    return newStudy;
  }

  public getWindowPresets(modality?: string): WindowLevelPreset[] {
    const allPresets = Object.values(PACS_WINDOW_PRESETS);
    if (!modality || modality === 'ALL') {
      return allPresets;
    }
    const targetModality = modality.toUpperCase() as PacsModality;
    return allPresets.filter((preset) => preset.recommendedModalities.includes(targetModality));
  }
}
