import { NotFoundException, BadRequestException } from '@nestjs/common';

export type CareProtocolType =
  | 'POST_CONSULTATION_DAY1'
  | 'ANTIBIOTIC_ADHERENCE_DAY3'
  | 'CHRONIC_HYPERTENSION_WEEKLY'
  | 'LAB_FOLLOWUP_DAY7';

export type ProtocolChannel = 'TELEGRAM' | 'WHATSAPP' | 'SMS';
export type ThreadStatus = 'ACTIVE' | 'ESCALATED_RED_FLAG' | 'COMPLETED';

export interface ConciergeMessage {
  id: string;
  sender: 'CLINIC_BOT' | 'PATIENT' | 'DOCTOR';
  senderName: string;
  channel: ProtocolChannel;
  content: string;
  sentAt: string;
  isRedFlag: boolean;
}

export interface RedFlagAlert {
  id: string;
  threadId: string;
  patientId: string;
  patientName: string;
  symptomDetected: string;
  severity: 'URGENT' | 'CRITICAL';
  reportedAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface PatientCareThread {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  telegramChatId?: string;
  visitId: string;
  primaryDoctor: string;
  diagnosis: string;
  activeProtocol: CareProtocolType;
  channel: ProtocolChannel;
  adherenceScore: number; // 0 to 100 percentage
  adherenceDosesTotal: number;
  adherenceDosesConfirmed: number;
  status: ThreadStatus;
  lastActivityAt: string;
  messages: ConciergeMessage[];
  tenantId: string;
  createdAt: string;
}

// Red-flag clinical trigger keywords in Khmer and English
export const RED_FLAG_CLINICAL_KEYWORDS: Array<{
  keyword: string;
  symptom: string;
  severity: 'URGENT' | 'CRITICAL';
}> = [
  { keyword: 'ក្ដៅខ្លួនខ្លាំង', symptom: 'Severe High Fever (>39C)', severity: 'URGENT' },
  { keyword: 'ក្តៅខ្លួនខ្លាំង', symptom: 'Severe High Fever (>39C)', severity: 'URGENT' },
  { keyword: 'ពិបាកដកដង្ហើម', symptom: 'Acute Respiratory Distress / Dyspnea', severity: 'CRITICAL' },
  { keyword: 'ឈឺទ្រូងខ្លាំង', symptom: 'Severe Acute Chest Pain', severity: 'CRITICAL' },
  { keyword: 'ក្អួតឈាម', symptom: 'Hematemesis (Vomiting Blood)', severity: 'CRITICAL' },
  { keyword: 'កន្ទួលរមាស់', symptom: 'Severe Allergic Drug Eruption / Urticaria', severity: 'URGENT' },
  { keyword: 'សន្លប់', symptom: 'Syncope / Loss of Consciousness', severity: 'CRITICAL' },
  { keyword: 'shortness of breath', symptom: 'Acute Respiratory Distress', severity: 'CRITICAL' },
  { keyword: 'chest pain', symptom: 'Acute Coronary Syndrome Suspicion', severity: 'CRITICAL' },
  { keyword: 'high fever', symptom: 'Persistent High Pyrexia', severity: 'URGENT' },
  { keyword: 'allergic rash', symptom: 'Drug Induced Cutaneous Reaction', severity: 'URGENT' },
  { keyword: 'vomiting blood', symptom: 'Upper Gastrointestinal Bleeding', severity: 'CRITICAL' },
];

export class ConciergeService {
  private threads: Map<string, PatientCareThread> = new Map();
  private redFlags: Map<string, RedFlagAlert> = new Map();

  constructor() {
    this.seedDefaultThreads();
  }

  private seedDefaultThreads(): void {
    const defaultThread: PatientCareThread = {
      id: 'thread-001',
      patientId: 'PT-1001',
      patientName: 'KEO Sokha',
      patientPhone: '+85512849102',
      telegramChatId: '84910291',
      visitId: 'vis-1001',
      primaryDoctor: 'Dr. CHAN Vanna',
      diagnosis: 'Essential hypertension with mild cardiomegaly',
      activeProtocol: 'POST_CONSULTATION_DAY1',
      channel: 'TELEGRAM',
      adherenceScore: 100,
      adherenceDosesTotal: 4,
      adherenceDosesConfirmed: 4,
      status: 'ACTIVE',
      lastActivityAt: '2026-10-20T14:30:00Z',
      createdAt: '2026-10-20T09:00:00Z',
      tenantId: 'default-tenant',
      messages: [
        {
          id: 'msg-001',
          sender: 'CLINIC_BOT',
          senderName: 'Clinic Concierge Bot',
          channel: 'TELEGRAM',
          content: 'ជម្រាបសួរលោក KEO Sokha! នេះជាសារសួរសុខទុក្ខពីគ្លីនិក បន្ទាប់ពីលោកបានមកពិនិត្យកាលពីម្សិលមិញ។ តើលោកបានលេបថ្នាំ Amlodipine 5mg តាមការណែនាំរបស់វេជ្ជបណ្ឌិត CHAN Vanna ហើយឬនៅ?',
          sentAt: '2026-10-20T09:05:00Z',
          isRedFlag: false,
        },
        {
          id: 'msg-002',
          sender: 'PATIENT',
          senderName: 'KEO Sokha',
          channel: 'TELEGRAM',
          content: 'បាទ ខ្ញុំបានលេបរួចរាល់ហើយនៅពេលព្រឹក។ សម្ពាធឈាមវាស់ឃើញ 130/85 អត់មានវិលមុខទេ។',
          sentAt: '2026-10-20T09:40:00Z',
          isRedFlag: false,
        },
        {
          id: 'msg-003',
          sender: 'DOCTOR',
          senderName: 'Dr. CHAN Vanna',
          channel: 'TELEGRAM',
          content: 'ល្អណាស់លោកពូ! សម្ពាធឈាមនេះមានស្ថិរភាពល្អហើយ។ សូមបន្តលេបថ្នាំទៀងទាត់រៀងរាល់ព្រឹក និងកាត់បន្ថយអាហារប្រៃ។',
          sentAt: '2026-10-20T10:15:00Z',
          isRedFlag: false,
        },
      ],
    };

    const redFlagThread: PatientCareThread = {
      id: 'thread-002',
      patientId: 'PT-1002',
      patientName: 'CHHAY Bopha',
      patientPhone: '+85598214950',
      telegramChatId: '98214950',
      visitId: 'vis-1002',
      primaryDoctor: 'Dr. RITH Sreynoch',
      diagnosis: 'Acute bacterial gastroenteritis',
      activeProtocol: 'ANTIBIOTIC_ADHERENCE_DAY3',
      channel: 'WHATSAPP',
      adherenceScore: 67,
      adherenceDosesTotal: 6,
      adherenceDosesConfirmed: 4,
      status: 'ESCALATED_RED_FLAG',
      lastActivityAt: '2026-10-20T16:15:00Z',
      createdAt: '2026-10-18T11:00:00Z',
      tenantId: 'default-tenant',
      messages: [
        {
          id: 'msg-101',
          sender: 'CLINIC_BOT',
          senderName: 'Clinic Concierge Bot',
          channel: 'WHATSAPP',
          content: 'Hello CHHAY Bopha! This is your Day 3 antibiotic reminder for Ciprofloxacin 500mg. Have you completed your midday dose?',
          sentAt: '2026-10-20T13:00:00Z',
          isRedFlag: false,
        },
        {
          id: 'msg-102',
          sender: 'PATIENT',
          senderName: 'CHHAY Bopha',
          channel: 'WHATSAPP',
          content: 'លោកគ្រូពេទ្យ ខ្ញុំលេបថ្នាំរួចស្រាប់តែចេញ កន្ទួលរមាស់ ពេញខ្លួន និងក្តៅខ្លួនខ្លាំង។ ខ្ញុំគួរធ្វើម៉េច?',
          sentAt: '2026-10-20T16:10:00Z',
          isRedFlag: true,
        },
      ],
    };

    const sampleAlert: RedFlagAlert = {
      id: 'alert-001',
      threadId: 'thread-002',
      patientId: 'PT-1002',
      patientName: 'CHHAY Bopha',
      symptomDetected: 'Severe Allergic Drug Eruption / Urticaria, Severe High Fever (>39C)',
      severity: 'URGENT',
      reportedAt: '2026-10-20T16:10:00Z',
      acknowledged: false,
    };

    this.threads.set(defaultThread.id, defaultThread);
    this.threads.set(redFlagThread.id, redFlagThread);
    this.redFlags.set(sampleAlert.id, sampleAlert);
  }

  public triggerProtocol(
    patientId: string,
    patientName: string,
    patientPhone: string,
    visitId: string,
    primaryDoctor: string,
    diagnosis: string,
    protocolType: CareProtocolType,
    channel: ProtocolChannel,
    tenantId: string,
  ): PatientCareThread {
    const threadId = `thread-${Date.now()}`;
    const now = new Date().toISOString();

    let initialMessage = '';
    switch (protocolType) {
      case 'POST_CONSULTATION_DAY1':
        initialMessage = `ជម្រាបសួរ ${patientName}! នេះជាសារសួរសុខទុក្ខពីគ្លីនិក។ តើស្ថានភាពសុខភាពរបស់លោកអ្នកមានភាពប្រសើរឡើងយ៉ាងណាដែរ បន្ទាប់ពីការពិគ្រោះជំងឺ?`;
        break;
      case 'ANTIBIOTIC_ADHERENCE_DAY3':
        initialMessage = `សួស្តី ${patientName}! នេះជាការរំលឹកលេបថ្នាំផ្សះថ្ងៃទី៣។ សូមបន្តលេបថ្នាំឱ្យគ្រប់ចំនួនកំណត់ ដើម្បីបង្ការភាពស៊ាំនឹងថ្នាំ។`;
        break;
      case 'CHRONIC_HYPERTENSION_WEEKLY':
        initialMessage = `ជម្រាបសួរ ${patientName}! សូមកត់ត្រា និងផ្ញើសម្ពាធឈាមជាមធ្យមប្រចាំសប្តាហ៍របស់លោកអ្នកជូនវេជ្ជបណ្ឌិតពិនិត្យតាមដាន។`;
        break;
      case 'LAB_FOLLOWUP_DAY7':
        initialMessage = `សួស្តី ${patientName}! សូមអញ្ជើញមកពិនិត្យឈាម និងតាមដានរោគវិនិច្ឆ័យម្តងទៀតតាមកាលកំណត់។`;
        break;
    }

    const newThread: PatientCareThread = {
      id: threadId,
      patientId,
      patientName,
      patientPhone,
      visitId,
      primaryDoctor,
      diagnosis,
      activeProtocol: protocolType,
      channel,
      adherenceScore: 100,
      adherenceDosesTotal: 1,
      adherenceDosesConfirmed: 1,
      status: 'ACTIVE',
      lastActivityAt: now,
      tenantId: tenantId || 'default-tenant',
      createdAt: now,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'CLINIC_BOT',
          senderName: 'Clinic Concierge Bot',
          channel,
          content: initialMessage,
          sentAt: now,
          isRedFlag: false,
        },
      ],
    };

    this.threads.set(threadId, newThread);
    return newThread;
  }

  public processInboundMessage(
    threadId: string,
    senderName: string,
    content: string,
  ): {
    thread: PatientCareThread;
    isRedFlag: boolean;
    detectedSymptoms: string[];
    alert?: RedFlagAlert;
  } {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new NotFoundException(`Care thread ${threadId} not found.`);
    }

    const lower = content.toLowerCase();
    const detectedKeywords: Array<{ symptom: string; severity: 'URGENT' | 'CRITICAL' }> = [];

    for (const item of RED_FLAG_CLINICAL_KEYWORDS) {
      if (lower.includes(item.keyword.toLowerCase())) {
        detectedKeywords.push({ symptom: item.symptom, severity: item.severity });
      }
    }

    const isRedFlag = detectedKeywords.length > 0;
    const now = new Date().toISOString();

    const newMessage: ConciergeMessage = {
      id: `msg-${Date.now()}`,
      sender: 'PATIENT',
      senderName,
      channel: thread.channel,
      content,
      sentAt: now,
      isRedFlag,
    };

    thread.messages.push(newMessage);
    thread.lastActivityAt = now;

    let alert: RedFlagAlert | undefined;

    if (isRedFlag) {
      thread.status = 'ESCALATED_RED_FLAG';
      const hasCritical = detectedKeywords.some((k) => k.severity === 'CRITICAL');
      const severity = hasCritical ? 'CRITICAL' : 'URGENT';
      const symptomSummary = Array.from(new Set(detectedKeywords.map((k) => k.symptom))).join(', ');

      alert = {
        id: `alert-${Date.now()}`,
        threadId: thread.id,
        patientId: thread.patientId,
        patientName: thread.patientName,
        symptomDetected: symptomSummary,
        severity,
        reportedAt: now,
        acknowledged: false,
      };

      this.redFlags.set(alert.id, alert);
    }

    this.threads.set(threadId, thread);

    return {
      thread,
      isRedFlag,
      detectedSymptoms: detectedKeywords.map((k) => k.symptom),
      alert,
    };
  }

  public sendDoctorReply(threadId: string, doctorName: string, replyText: string): PatientCareThread {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new NotFoundException(`Care thread ${threadId} not found.`);
    }

    if (!replyText || replyText.trim().length === 0) {
      throw new BadRequestException('Doctor reply content cannot be empty.');
    }

    const now = new Date().toISOString();
    const replyMessage: ConciergeMessage = {
      id: `msg-${Date.now()}`,
      sender: 'DOCTOR',
      senderName: doctorName,
      channel: thread.channel,
      content: replyText.trim(),
      sentAt: now,
      isRedFlag: false,
    };

    thread.messages.push(replyMessage);
    thread.lastActivityAt = now;
    this.threads.set(threadId, thread);
    return thread;
  }

  public recordDoseConfirmation(threadId: string, confirmed: boolean): PatientCareThread {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new NotFoundException(`Care thread ${threadId} not found.`);
    }

    thread.adherenceDosesTotal += 1;
    if (confirmed) {
      thread.adherenceDosesConfirmed += 1;
    }

    thread.adherenceScore = Math.round(
      (thread.adherenceDosesConfirmed / thread.adherenceDosesTotal) * 100,
    );

    thread.lastActivityAt = new Date().toISOString();
    this.threads.set(threadId, thread);
    return thread;
  }

  public getThreads(
    tenantId: string,
    filters?: { status?: string; protocol?: string; search?: string },
  ): PatientCareThread[] {
    let result = Array.from(this.threads.values()).filter(
      (t) => t.tenantId === tenantId || t.tenantId === 'default-tenant',
    );

    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter((t) => t.status === filters.status);
    }

    if (filters?.protocol && filters.protocol !== 'ALL') {
      result = result.filter((t) => t.activeProtocol === filters.protocol);
    }

    if (filters?.search && filters.search.trim().length > 0) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.patientName.toLowerCase().includes(q) ||
          t.patientId.toLowerCase().includes(q) ||
          t.diagnosis.toLowerCase().includes(q) ||
          t.primaryDoctor.toLowerCase().includes(q),
      );
    }

    return result.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  }

  public getPendingRedFlags(tenantId: string): RedFlagAlert[] {
    return Array.from(this.redFlags.values()).filter((a) => !a.acknowledged);
  }

  public acknowledgeRedFlag(alertId: string, doctorName: string): RedFlagAlert {
    const alert = this.redFlags.get(alertId);
    if (!alert) {
      throw new NotFoundException(`Red flag alert ${alertId} not found.`);
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = doctorName;
    alert.acknowledgedAt = new Date().toISOString();
    this.redFlags.set(alertId, alert);
    return alert;
  }
}
