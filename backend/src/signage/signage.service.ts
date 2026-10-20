import { NotFoundException, BadRequestException } from '@nestjs/common';

export type QueueDepartment =
  | 'TRIAGE'
  | 'CONSULTATION'
  | 'LABORATORY'
  | 'IMAGING'
  | 'PHARMACY'
  | 'CASHIER';

export type QueueStation =
  | 'ROOM_1'
  | 'ROOM_2'
  | 'ROOM_3'
  | 'ROOM_US'
  | 'STATION_LAB'
  | 'STATION_PHARMACY'
  | 'STATION_CASHIER';

export type TicketStatus = 'WAITING' | 'CALLING' | 'IN_SERVICE' | 'COMPLETED' | 'NO_SHOW';
export type TicketPriority = 'NORMAL' | 'URGENT_EMERGENCY' | 'ELDERLY_PREGNANT';

export interface QueueTicket {
  id: string;
  ticketNumber: string;
  patientId: string;
  patientName: string;
  department: QueueDepartment;
  station: QueueStation;
  stationDisplayNameKh: string;
  stationDisplayNameEn: string;
  status: TicketStatus;
  priority: TicketPriority;
  calledAt?: string;
  speechTextKh: string;
  speechTextEn: string;
  waitTimeMinutes: number;
  assignedStaff?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicBroadcastAnnouncement {
  id: string;
  titleKh: string;
  titleEn: string;
  contentKh: string;
  contentEn: string;
  priority: 'NORMAL' | 'IMPORTANT';
  active: boolean;
}

export const STATION_NAMES: Record<QueueStation, { kh: string; en: string }> = {
  ROOM_1: { kh: 'បន្ទប់ពិគ្រោះលេខ ១', en: 'Consultation Room 1' },
  ROOM_2: { kh: 'បន្ទប់ពិគ្រោះលេខ ២', en: 'Consultation Room 2' },
  ROOM_3: { kh: 'បន្ទប់ពិគ្រោះលេខ ៣', en: 'Consultation Room 3' },
  ROOM_US: { kh: 'បន្ទប់អេកូសាស្ត្រ & ថតកាំរស្មី', en: 'Ultrasound & Imaging Suite' },
  STATION_LAB: { kh: 'មន្ទីរពិសោធន៍វេជ្ជសាស្ត្រ', en: 'Clinical Laboratory Station' },
  STATION_PHARMACY: { kh: 'បញ្ជរបើកថ្នាំឱសថស្ថាន', en: 'Pharmacy Dispensing Counter' },
  STATION_CASHIER: { kh: 'បញ្ជរបង់ប្រាក់ & គិតលុយ', en: 'Cashier & Payment Counter' },
};

export class SignageService {
  private tickets: Map<string, QueueTicket> = new Map();
  private announcements: ClinicBroadcastAnnouncement[] = [];

  constructor() {
    this.seedDefaultQueue();
    this.seedAnnouncements();
  }

  private seedDefaultQueue(): void {
    const defaultTickets: QueueTicket[] = [
      {
        id: 'tkt-001',
        ticketNumber: 'A-101',
        patientId: 'PT-1001',
        patientName: 'KEO Sokha',
        department: 'CONSULTATION',
        station: 'ROOM_1',
        stationDisplayNameKh: 'បន្ទប់ពិគ្រោះលេខ ១',
        stationDisplayNameEn: 'Consultation Room 1',
        status: 'CALLING',
        priority: 'NORMAL',
        calledAt: '2026-10-20T10:15:00Z',
        speechTextKh: 'សូមអញ្ជើញ អ្នកជំងឺលេខ A-101 ចូលទៅកាន់ បន្ទប់ពិគ្រោះលេខ ១',
        speechTextEn: 'Calling ticket A-101 to Consultation Room 1',
        waitTimeMinutes: 8,
        assignedStaff: 'Dr. CHAN Vanna',
        tenantId: 'default-tenant',
        createdAt: '2026-10-20T10:05:00Z',
        updatedAt: '2026-10-20T10:15:00Z',
      },
      {
        id: 'tkt-002',
        ticketNumber: 'A-102',
        patientId: 'PT-1002',
        patientName: 'CHHAY Bopha',
        department: 'CONSULTATION',
        station: 'ROOM_2',
        stationDisplayNameKh: 'បន្ទប់ពិគ្រោះលេខ ២',
        stationDisplayNameEn: 'Consultation Room 2',
        status: 'WAITING',
        priority: 'NORMAL',
        speechTextKh: 'សូមអញ្ជើញ អ្នកជំងឺលេខ A-102 ចូលទៅកាន់ បន្ទប់ពិគ្រោះលេខ ២',
        speechTextEn: 'Calling ticket A-102 to Consultation Room 2',
        waitTimeMinutes: 14,
        assignedStaff: 'Dr. RITH Sreynoch',
        tenantId: 'default-tenant',
        createdAt: '2026-10-20T10:01:00Z',
        updatedAt: '2026-10-20T10:01:00Z',
      },
      {
        id: 'tkt-003',
        ticketNumber: 'L-201',
        patientId: 'PT-1003',
        patientName: 'MENG Dara',
        department: 'LABORATORY',
        station: 'STATION_LAB',
        stationDisplayNameKh: 'មន្ទីរពិសោធន៍វេជ្ជសាស្ត្រ',
        stationDisplayNameEn: 'Clinical Laboratory Station',
        status: 'CALLING',
        priority: 'NORMAL',
        calledAt: '2026-10-20T10:12:00Z',
        speechTextKh: 'សូមអញ្ជើញ អ្នកជំងឺលេខ L-201 ចូលទៅកាន់ មន្ទីរពិសោធន៍វេជ្ជសាស្ត្រ',
        speechTextEn: 'Calling ticket L-201 to Clinical Laboratory Station',
        waitTimeMinutes: 6,
        assignedStaff: 'Lab Technician',
        tenantId: 'default-tenant',
        createdAt: '2026-10-20T10:06:00Z',
        updatedAt: '2026-10-20T10:12:00Z',
      },
      {
        id: 'tkt-004',
        ticketNumber: 'P-301',
        patientId: 'PT-1004',
        patientName: 'HENG Piseth',
        department: 'PHARMACY',
        station: 'STATION_PHARMACY',
        stationDisplayNameKh: 'បញ្ជរបើកថ្នាំឱសថស្ថាន',
        stationDisplayNameEn: 'Pharmacy Dispensing Counter',
        status: 'WAITING',
        priority: 'ELDERLY_PREGNANT',
        speechTextKh: 'សូមអញ្ជើញ អ្នកជំងឺលេខ P-301 ចូលទៅកាន់ បញ្ជរបើកថ្នាំឱសថស្ថាន',
        speechTextEn: 'Calling ticket P-301 to Pharmacy Dispensing Counter',
        waitTimeMinutes: 11,
        assignedStaff: 'Pharmacist',
        tenantId: 'default-tenant',
        createdAt: '2026-10-20T10:04:00Z',
        updatedAt: '2026-10-20T10:04:00Z',
      },
      {
        id: 'tkt-005',
        ticketNumber: 'U-401',
        patientId: 'PT-1005',
        patientName: 'ORN Chenda',
        department: 'IMAGING',
        station: 'ROOM_US',
        stationDisplayNameKh: 'បន្ទប់អេកូសាស្ត្រ & ថតកាំរស្មី',
        stationDisplayNameEn: 'Ultrasound & Imaging Suite',
        status: 'WAITING',
        priority: 'NORMAL',
        speechTextKh: 'សូមអញ្ជើញ អ្នកជំងឺលេខ U-401 ចូលទៅកាន់ បន្ទប់អេកូសាស្ត្រ & ថតកាំរស្មី',
        speechTextEn: 'Calling ticket U-401 to Ultrasound & Imaging Suite',
        waitTimeMinutes: 5,
        assignedStaff: 'Dr. TEP Somally',
        tenantId: 'default-tenant',
        createdAt: '2026-10-20T10:10:00Z',
        updatedAt: '2026-10-20T10:10:00Z',
      },
    ];

    for (const t of defaultTickets) {
      this.tickets.set(t.id, t);
    }
  }

  private seedAnnouncements(): void {
    this.announcements = [
      {
        id: 'ann-01',
        titleKh: 'ការការពារជំងឺគ្រុនឈាមរដូវវស្សា',
        titleEn: 'Rainy Season Dengue Prevention Notice',
        contentKh: 'សូមលោកអ្នកលុបបំបាត់ទឹកដក់ជុំវិញគេហដ្ឋាន និងគេងក្នុងមុងដើម្បីបង្ការជំងឺគ្រុនឈាម។ បើមានអាការៈក្តៅខ្លួនលើសពី ២ ថ្ងៃ សូមមកពិគ្រោះជាបន្ទាន់។',
        contentEn: 'Please eliminate stagnant water reservoirs and sleep under bed nets. Seek immediate consultation if high fever persists over 48 hours.',
        priority: 'IMPORTANT',
        active: true,
      },
      {
        id: 'ann-02',
        titleKh: 'ម៉ោងបម្រើសេវាកម្មគ្លីនិក',
        titleEn: 'Clinic Operating Hours Notice',
        contentKh: 'គ្លីនិកបើកបម្រើសេវា ២៤ ម៉ោង ជារៀងរាល់ថ្ងៃ សម្រាប់ផ្នែកសង្គ្រោះបន្ទាន់ និងពិគ្រោះជំងឺទូទៅ។',
        contentEn: 'Our clinic provides 24/7 round-the-clock emergency care and comprehensive outpatient medical consultations.',
        priority: 'NORMAL',
        active: true,
      },
    ];
  }

  public getLiveQueueBoard(tenantId: string): {
    callingTickets: QueueTicket[];
    waitingTickets: QueueTicket[];
    recentCompleted: QueueTicket[];
    announcements: ClinicBroadcastAnnouncement[];
    totalWaiting: number;
    totalServedToday: number;
  } {
    const all = Array.from(this.tickets.values()).filter(
      (t) => t.tenantId === tenantId || t.tenantId === 'default-tenant',
    );

    const calling = all
      .filter((t) => t.status === 'CALLING')
      .sort((a, b) => (b.calledAt || '').localeCompare(a.calledAt || ''));

    const waiting = all
      .filter((t) => t.status === 'WAITING')
      .sort((a, b) => {
        // Priority sort: URGENT first, then ELDERLY, then FIFO wait time
        const priorityOrder: Record<TicketPriority, number> = {
          URGENT_EMERGENCY: 0,
          ELDERLY_PREGNANT: 1,
          NORMAL: 2,
        };
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        return a.createdAt.localeCompare(b.createdAt);
      });

    const recentCompleted = all
      .filter((t) => t.status === 'COMPLETED')
      .slice(-5)
      .reverse();

    return {
      callingTickets: calling,
      waitingTickets: waiting,
      recentCompleted,
      announcements: this.announcements.filter((a) => a.active),
      totalWaiting: waiting.length,
      totalServedToday: 42,
    };
  }

  public callTicket(
    ticketId: string,
    station: QueueStation,
    staffName?: string,
  ): QueueTicket {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Queue ticket ${ticketId} not found.`);
    }

    const stationNames = STATION_NAMES[station] || {
      kh: 'បន្ទប់ពិគ្រោះ',
      en: 'Consultation Station',
    };

    const now = new Date().toISOString();
    ticket.status = 'CALLING';
    ticket.station = station;
    ticket.stationDisplayNameKh = stationNames.kh;
    ticket.stationDisplayNameEn = stationNames.en;
    ticket.calledAt = now;
    ticket.updatedAt = now;
    if (staffName) ticket.assignedStaff = staffName;

    ticket.speechTextKh = `សូមអញ្ជើញ អ្នកជំងឺលេខ ${ticket.ticketNumber} ចូលទៅកាន់ ${stationNames.kh}`;
    ticket.speechTextEn = `Calling ticket ${ticket.ticketNumber} to ${stationNames.en}`;

    this.tickets.set(ticketId, ticket);
    return ticket;
  }

  public completeTicket(ticketId: string): QueueTicket {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Queue ticket ${ticketId} not found.`);
    }

    ticket.status = 'COMPLETED';
    ticket.updatedAt = new Date().toISOString();
    this.tickets.set(ticketId, ticket);
    return ticket;
  }

  public issueKioskTicket(
    patientName: string,
    department: QueueDepartment,
    priority: TicketPriority = 'NORMAL',
    tenantId = 'default-tenant',
  ): QueueTicket {
    const count = this.tickets.size + 1;
    let prefix = 'A';
    if (department === 'LABORATORY') prefix = 'L';
    else if (department === 'PHARMACY') prefix = 'P';
    else if (department === 'IMAGING') prefix = 'U';
    else if (department === 'CASHIER') prefix = 'C';

    const ticketNumber = `${prefix}-${100 + count}`;
    const station: QueueStation = department === 'LABORATORY'
      ? 'STATION_LAB'
      : department === 'PHARMACY'
      ? 'STATION_PHARMACY'
      : department === 'IMAGING'
      ? 'ROOM_US'
      : department === 'CASHIER'
      ? 'STATION_CASHIER'
      : 'ROOM_1';

    const stationNames = STATION_NAMES[station];
    const now = new Date().toISOString();

    const newTicket: QueueTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber,
      patientId: `PT-${1000 + count}`,
      patientName: patientName.trim(),
      department,
      station,
      stationDisplayNameKh: stationNames.kh,
      stationDisplayNameEn: stationNames.en,
      status: 'WAITING',
      priority,
      speechTextKh: `សូមអញ្ជើញ អ្នកជំងឺលេខ ${ticketNumber} ចូលទៅកាន់ ${stationNames.kh}`,
      speechTextEn: `Calling ticket ${ticketNumber} to ${stationNames.en}`,
      waitTimeMinutes: 0,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    this.tickets.set(newTicket.id, newTicket);
    return newTicket;
  }
}
