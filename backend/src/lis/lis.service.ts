import { NotFoundException, BadRequestException } from '@nestjs/common';

export type SpecimenTubeType =
  | 'EDTA_LAVENDER'
  | 'SERUM_RED_GOLD'
  | 'SODIUM_CITRATE_BLUE'
  | 'HEPARIN_GREEN'
  | 'FLUORIDE_GREY'
  | 'URINE_STERILE';

export type LabOrderStatus =
  | 'ORDERED'
  | 'COLLECTED'
  | 'IN_ANALYZER'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'CANCELLED';

export type AnalyteFlag = 'NORMAL' | 'LOW' | 'HIGH' | 'PANIC_CRITICAL' | 'DELTA_ALERT';

export interface AnalyteReference {
  code: string;
  nameEn: string;
  nameKh: string;
  unit: string;
  minNormal: number;
  maxNormal: number;
  panicLow?: number;
  panicHigh?: number;
  maxDeltaPercent?: number;
}

export interface AnalyteResult {
  code: string;
  nameEn: string;
  nameKh: string;
  value: number;
  unit: string;
  minNormal: number;
  maxNormal: number;
  flag: AnalyteFlag;
  deltaPercent?: number;
  previousValue?: number;
  panicAlert: boolean;
}

export interface SpecimenAccession {
  accessionNumber: string;
  barcode: string;
  patientId: string;
  patientName: string;
  tubeType: SpecimenTubeType;
  tubeNameKh: string;
  tubeNameEn: string;
  collectedAt: string;
  phlebotomist: string;
}

export interface LabOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  panelCode: string;
  panelNameEn: string;
  panelNameKh: string;
  specimen: SpecimenAccession;
  analyzerModel?: string;
  analyzerProtocol: 'ASTM_E1394' | 'HL7_V2_ORU' | 'MANUAL_ENTRY';
  status: LabOrderStatus;
  results: AnalyteResult[];
  hasPanicValue: boolean;
  hasDeltaAlert: boolean;
  orderingDoctor: string;
  verifyingPathologist?: string;
  verifiedAt?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export const STANDARD_ANALYTES: Record<string, AnalyteReference> = {
  // Complete Blood Count (CBC)
  WBC: {
    code: 'WBC',
    nameEn: 'White Blood Cell Count',
    nameKh: 'គ្រាប់ឈាមស',
    unit: '10^9/L',
    minNormal: 4.0,
    maxNormal: 10.0,
    panicLow: 1.5,
    panicHigh: 30.0,
    maxDeltaPercent: 50,
  },
  RBC: {
    code: 'RBC',
    nameEn: 'Red Blood Cell Count',
    nameKh: 'គ្រាប់ឈាមក្រហម',
    unit: '10^12/L',
    minNormal: 3.8,
    maxNormal: 5.8,
    panicLow: 2.0,
    panicHigh: 7.0,
    maxDeltaPercent: 30,
  },
  HGB: {
    code: 'HGB',
    nameEn: 'Hemoglobin',
    nameKh: 'អេម៉ូក្លូប៊ីន',
    unit: 'g/dL',
    minNormal: 12.0,
    maxNormal: 16.5,
    panicLow: 6.5,
    panicHigh: 20.0,
    maxDeltaPercent: 25,
  },
  HCT: {
    code: 'HCT',
    nameEn: 'Hematocrit',
    nameKh: 'សមាមាត្រកោសិកាឈាមក្រហម',
    unit: '%',
    minNormal: 36.0,
    maxNormal: 50.0,
    panicLow: 20.0,
    panicHigh: 60.0,
    maxDeltaPercent: 25,
  },
  PLT: {
    code: 'PLT',
    nameEn: 'Platelet Count',
    nameKh: 'ប្លាកែត',
    unit: '10^9/L',
    minNormal: 150,
    maxNormal: 450,
    panicLow: 25,
    panicHigh: 1000,
    maxDeltaPercent: 40,
  },
  // Clinical Biochemistry & Metabolic
  GLU: {
    code: 'GLU',
    nameEn: 'Fasting Blood Glucose',
    nameKh: 'ជាតិស្ករក្នុងឈាម',
    unit: 'mg/dL',
    minNormal: 70,
    maxNormal: 110,
    panicLow: 45,
    panicHigh: 400,
    maxDeltaPercent: 50,
  },
  CREA: {
    code: 'CREA',
    nameEn: 'Serum Creatinine',
    nameKh: 'ក្រេអាទីនីន',
    unit: 'mg/dL',
    minNormal: 0.6,
    maxNormal: 1.2,
    panicHigh: 5.0,
    maxDeltaPercent: 50,
  },
  K_PLUS: {
    code: 'K_PLUS',
    nameEn: 'Serum Potassium',
    nameKh: 'ប៉ូតាស្យូម',
    unit: 'mmol/L',
    minNormal: 3.5,
    maxNormal: 5.1,
    panicLow: 2.8,
    panicHigh: 6.5,
    maxDeltaPercent: 30,
  },
  ALT: {
    code: 'ALT',
    nameEn: 'Alanine Aminotransferase (SGPT)',
    nameKh: 'អង់ស៊ីមថ្លើម ALT',
    unit: 'U/L',
    minNormal: 7,
    maxNormal: 56,
    panicHigh: 500,
    maxDeltaPercent: 80,
  },
  HBA1C: {
    code: 'HBA1C',
    nameEn: 'Glycated Hemoglobin',
    nameKh: 'ជាតិស្ករមធ្យម ៣ខែ HbA1c',
    unit: '%',
    minNormal: 4.0,
    maxNormal: 5.6,
    panicHigh: 14.0,
    maxDeltaPercent: 30,
  },
};

export class LisService {
  private orders: Map<string, LabOrder> = new Map();
  private historicalResults: Map<string, Record<string, number>> = new Map();

  constructor() {
    this.seedDefaultLabOrders();
  }

  private seedDefaultLabOrders(): void {
    // Seed historical baseline for patient PT-1001
    this.historicalResults.set('PT-1001', {
      WBC: 6.8,
      RBC: 4.6,
      HGB: 13.8,
      HCT: 41.2,
      PLT: 240,
      GLU: 95,
      CREA: 0.9,
      K_PLUS: 4.2,
    });

    const defaultOrder: LabOrder = {
      id: 'ord-101',
      orderNumber: 'LAB-20261020-001',
      patientId: 'PT-1001',
      patientName: 'KEO Sokha',
      panelCode: 'CBC_5DIFF',
      panelNameEn: 'Complete Blood Count (5-Part Differential)',
      panelNameKh: 'វិភាគគ្រាប់ឈាមពេញលេញ (CBC)',
      specimen: {
        accessionNumber: 'ACC-20261020-8801',
        barcode: '8801202610201001',
        patientId: 'PT-1001',
        patientName: 'KEO Sokha',
        tubeType: 'EDTA_LAVENDER',
        tubeNameKh: 'បំពង់ក្បាលស្វាយ EDTA',
        tubeNameEn: 'EDTA K2 Lavender Tube',
        collectedAt: '2026-10-20T08:30:00Z',
        phlebotomist: 'Meas Channa',
      },
      analyzerModel: 'Mindray BC-5000 Auto Hematology',
      analyzerProtocol: 'ASTM_E1394',
      status: 'VERIFIED',
      results: [
        {
          code: 'WBC',
          nameEn: 'White Blood Cell Count',
          nameKh: 'គ្រាប់ឈាមស',
          value: 7.2,
          unit: '10^9/L',
          minNormal: 4.0,
          maxNormal: 10.0,
          flag: 'NORMAL',
          deltaPercent: 5.9,
          previousValue: 6.8,
          panicAlert: false,
        },
        {
          code: 'HGB',
          nameEn: 'Hemoglobin',
          nameKh: 'អេម៉ូក្លូប៊ីន',
          value: 13.5,
          unit: 'g/dL',
          minNormal: 12.0,
          maxNormal: 16.5,
          flag: 'NORMAL',
          deltaPercent: -2.2,
          previousValue: 13.8,
          panicAlert: false,
        },
        {
          code: 'PLT',
          nameEn: 'Platelet Count',
          nameKh: 'ប្លាកែត',
          value: 235,
          unit: '10^9/L',
          minNormal: 150,
          maxNormal: 450,
          flag: 'NORMAL',
          deltaPercent: -2.1,
          previousValue: 240,
          panicAlert: false,
        },
      ],
      hasPanicValue: false,
      hasDeltaAlert: false,
      orderingDoctor: 'Dr. CHAN Vanna',
      verifyingPathologist: 'Dr. SOK Piseth (Pathologist)',
      verifiedAt: '2026-10-20T09:15:00Z',
      tenantId: 'default-tenant',
      createdAt: '2026-10-20T08:15:00Z',
      updatedAt: '2026-10-20T09:15:00Z',
    };

    this.orders.set(defaultOrder.id, defaultOrder);
  }

  // Create new specimen accession and generate 12-digit barcode
  createAccession(
    patientId: string,
    patientName: string,
    panelCode: string,
    panelNameEn: string,
    panelNameKh: string,
    tubeType: SpecimenTubeType,
    orderingDoctor: string,
    phlebotomist: string,
    tenantId: string = 'default-tenant',
  ): LabOrder {
    const timestampStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const orderNumber = `LAB-${timestampStr}-${randSuffix.slice(0, 3)}`;
    const accessionNumber = `ACC-${timestampStr}-${randSuffix}`;
    const barcode = `${randSuffix}${timestampStr}${patientId.replace(/\D/g, '').padStart(4, '0')}`;

    const tubeDetails: Record<SpecimenTubeType, { kh: string; en: string }> = {
      EDTA_LAVENDER: { kh: 'បំពង់ក្បាលស្វាយ EDTA', en: 'EDTA K2 Lavender Tube' },
      SERUM_RED_GOLD: { kh: 'បំពង់ក្បាលក្រហម/មាស Serum', en: 'Clot Activator SST Gold/Red' },
      SODIUM_CITRATE_BLUE: { kh: 'បំពង់ក្បាលផ្ទៃមេឃ Coagulation', en: 'Sodium Citrate 3.2% Light Blue' },
      HEPARIN_GREEN: { kh: 'បំពង់ក្បាលបៃតង Heparin', en: 'Lithium Heparin Green' },
      FLUORIDE_GREY: { kh: 'បំពង់ក្បាលប្រផេះ Glucose', en: 'Sodium Fluoride Grey' },
      URINE_STERILE: { kh: 'កំប៉ុងទឹកនោមគ្មានមេរោគ', en: 'Sterile Urine Container' },
    };

    const newOrder: LabOrder = {
      id: `ord-${Date.now()}`,
      orderNumber,
      patientId,
      patientName,
      panelCode,
      panelNameEn,
      panelNameKh,
      specimen: {
        accessionNumber,
        barcode,
        patientId,
        patientName,
        tubeType,
        tubeNameKh: tubeDetails[tubeType]?.kh || 'បំពង់សំណាក',
        tubeNameEn: tubeDetails[tubeType]?.en || 'Specimen Tube',
        collectedAt: new Date().toISOString(),
        phlebotomist,
      },
      analyzerProtocol: 'MANUAL_ENTRY',
      status: 'COLLECTED',
      results: [],
      hasPanicValue: false,
      hasDeltaAlert: false,
      orderingDoctor,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  // Parse raw ASTM E1381/E1394 analyzer frames or HL7 v2 ORU^R01 message
  parseAnalyzerData(rawPacket: string): Array<{ code: string; value: number }> {
    const parsed: Array<{ code: string; value: number }> = [];

    // Protocol 1: ASTM E1394 (Mindray / Sysmex standard)
    // Frame format: R|1|^^^WBC|7.5|10^9/L|...
    if (rawPacket.includes('R|') || rawPacket.includes('H|')) {
      const lines = rawPacket.split(/[\r\n]+/);
      for (const line of lines) {
        if (line.startsWith('R|')) {
          const parts = line.split('|');
          if (parts.length >= 4) {
            const rawCode = parts[2].replace(/\^/g, '').trim().toUpperCase();
            const rawVal = parseFloat(parts[3]);
            if (!isNaN(rawVal)) {
              parsed.push({ code: rawCode, value: rawVal });
            }
          }
        }
      }
    }

    // Protocol 2: HL7 v2 ORU^R01 (Abbott Architect, Roche Cobas)
    // Segment format: OBX|1|NM|GLU^Glucose||98|mg/dL|...
    if (rawPacket.includes('OBX|')) {
      const lines = rawPacket.split(/[\r\n]+/);
      for (const line of lines) {
        if (line.startsWith('OBX|')) {
          const parts = line.split('|');
          if (parts.length >= 6) {
            const codeSubparts = parts[3].split('^');
            const code = (codeSubparts[0] || '').trim().toUpperCase();
            const val = parseFloat(parts[5]);
            if (!isNaN(val)) {
              parsed.push({ code, value: val });
            }
          }
        }
      }
    }

    return parsed;
  }

  // Ingest analyzer data, compute Delta Checks and Panic / Critical Flags
  ingestAnalyzerResults(
    orderId: string,
    payload: {
      rawProtocolPacket?: string;
      directAnalyteResults?: Array<{ code: string; value: number }>;
      analyzerModel?: string;
      protocol?: 'ASTM_E1394' | 'HL7_V2_ORU' | 'MANUAL_ENTRY';
    },
  ): LabOrder {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new NotFoundException(`Lab order ${orderId} not found`);
    }

    let parsedItems: Array<{ code: string; value: number }> = [];

    if (payload.directAnalyteResults && payload.directAnalyteResults.length > 0) {
      parsedItems = payload.directAnalyteResults;
    } else if (payload.rawProtocolPacket) {
      parsedItems = this.parseAnalyzerData(payload.rawProtocolPacket);
    }

    if (parsedItems.length === 0) {
      throw new BadRequestException('No valid analyte test results detected in payload');
    }

    const patientHistory = this.historicalResults.get(order.patientId) || {};
    let orderHasPanic = false;
    let orderHasDelta = false;

    const evaluatedResults: AnalyteResult[] = parsedItems.map((item) => {
      const ref = STANDARD_ANALYTES[item.code] || {
        code: item.code,
        nameEn: item.code,
        nameKh: item.code,
        unit: '',
        minNormal: 0,
        maxNormal: 9999,
      };

      const val = item.value;
      const prevVal = patientHistory[item.code];

      // Calculate Delta Check (%)
      let deltaPercent: number | undefined;
      let isDeltaAlert = false;
      if (prevVal !== undefined && prevVal > 0) {
        deltaPercent = parseFloat((((val - prevVal) / prevVal) * 100).toFixed(1));
        const maxDelta = ref.maxDeltaPercent ?? 40;
        if (Math.abs(deltaPercent) > maxDelta) {
          isDeltaAlert = true;
          orderHasDelta = true;
        }
      }

      // Check Panic / Critical Value
      let isPanic = false;
      if (ref.panicLow !== undefined && val <= ref.panicLow) {
        isPanic = true;
        orderHasPanic = true;
      }
      if (ref.panicHigh !== undefined && val >= ref.panicHigh) {
        isPanic = true;
        orderHasPanic = true;
      }

      // Determine Analyte Flag
      let flag: AnalyteFlag = 'NORMAL';
      if (isPanic) {
        flag = 'PANIC_CRITICAL';
      } else if (isDeltaAlert) {
        flag = 'DELTA_ALERT';
      } else if (val < ref.minNormal) {
        flag = 'LOW';
      } else if (val > ref.maxNormal) {
        flag = 'HIGH';
      }

      return {
        code: ref.code,
        nameEn: ref.nameEn,
        nameKh: ref.nameKh,
        value: val,
        unit: ref.unit,
        minNormal: ref.minNormal,
        maxNormal: ref.maxNormal,
        flag,
        deltaPercent,
        previousValue: prevVal,
        panicAlert: isPanic,
      };
    });

    order.results = evaluatedResults;
    order.status = 'PENDING_VERIFICATION';
    order.analyzerModel = payload.analyzerModel || 'Automated Laboratory Analyzer';
    order.analyzerProtocol = payload.protocol || (payload.rawProtocolPacket ? 'ASTM_E1394' : 'MANUAL_ENTRY');
    order.hasPanicValue = orderHasPanic;
    order.hasDeltaAlert = orderHasDelta;
    order.updatedAt = new Date().toISOString();

    this.orders.set(orderId, order);
    return order;
  }

  // Pathologist verification and electronic sign-off
  verifyAndReleaseOrder(
    orderId: string,
    pathologistName: string,
    notes?: string,
  ): LabOrder {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new NotFoundException(`Lab order ${orderId} not found`);
    }

    order.status = 'VERIFIED';
    order.verifyingPathologist = pathologistName;
    order.verifiedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    // Store verified results into historical baseline for future Delta checks
    const currentHist = this.historicalResults.get(order.patientId) || {};
    for (const r of order.results) {
      currentHist[r.code] = r.value;
    }
    this.historicalResults.set(order.patientId, currentHist);

    this.orders.set(orderId, order);
    return order;
  }

  // Get orders list
  listOrders(params?: {
    status?: string;
    patientId?: string;
    hasPanic?: boolean;
    tenantId?: string;
  }): LabOrder[] {
    let list = Array.from(this.orders.values());

    if (params?.tenantId) {
      list = list.filter((o) => o.tenantId === params.tenantId);
    }
    if (params?.status) {
      list = list.filter((o) => o.status === params.status);
    }
    if (params?.patientId) {
      list = list.filter((o) => o.patientId === params.patientId);
    }
    if (params?.hasPanic !== undefined) {
      list = list.filter((o) => o.hasPanicValue === params.hasPanic);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get single order
  getOrder(orderId: string): LabOrder {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new NotFoundException(`Lab order ${orderId} not found`);
    }
    return order;
  }

  // Get standard reference ranges
  getReferenceRanges(): Record<string, AnalyteReference> {
    return STANDARD_ANALYTES;
  }
}
