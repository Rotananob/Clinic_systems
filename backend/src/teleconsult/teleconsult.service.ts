import crypto from 'crypto';

export type RoomStatus = 'SCHEDULED' | 'WAITING' | 'IN_CALL' | 'COMPLETED' | 'CANCELLED';
export type ParticipantRole = 'DOCTOR' | 'PATIENT';
export type SignalType = 'offer' | 'answer' | 'ice-candidate';

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface Participant {
  role: ParticipantRole;
  name: string;
  connected: boolean;
  joinedAt?: string;
  audioMuted: boolean;
  videoMuted: boolean;
  isScreenSharing: boolean;
}

export interface ChatMessage {
  id: string;
  senderRole: ParticipantRole;
  senderName: string;
  message: string;
  timestamp: string;
}

export interface SignalingPayload {
  id: string;
  roomId: string;
  senderRole: ParticipantRole;
  type: SignalType;
  payload: any;
  timestamp: string;
}

export interface TeleconsultRoom {
  id: string;
  roomCode: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  scheduledAt: string;
  status: RoomStatus;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  clinicalNotes: string;
  prescriptionId?: string;
  participants: {
    DOCTOR: Participant | null;
    PATIENT: Participant | null;
  };
  chatMessages: ChatMessage[];
  signals: SignalingPayload[];
}

export interface EPrescriptionItem {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

export interface DigitalSignatureStamp {
  algorithm: string;
  signatureHash: string;
  signerDoctorId: string;
  signerDoctorName: string;
  licenseNumber: string;
  signedAt: string;
  valid: boolean;
}

export interface DigitalEPrescription {
  id: string;
  prescriptionNumber: string;
  teleconsultRoomId?: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  doctorLicenseNumber: string;
  clinicName: string;
  clinicAddress: string;
  diagnosis: string;
  items: EPrescriptionItem[];
  issuedAt: string;
  expiresAt: string;
  digitalSignature: DigitalSignatureStamp;
  qrPayload: string;
  qrVerificationUrl: string;
  dispenseStatus: 'PENDING' | 'DISPENSED' | 'EXPIRED';
  dispensedAt?: string;
  dispensedPharmacy?: string;
}

export class TeleconsultService {
  rooms: Map<string, TeleconsultRoom>;
  prescriptions: Map<string, DigitalEPrescription>;
  private signatureSecret: string;

  constructor() {
    this.rooms = new Map();
    this.prescriptions = new Map();
    this.signatureSecret = process.env.TELECONSULT_SIGNATURE_SECRET || 'cambodia-clinic-eprescription-sig-key-2026';
    this.seedInitialData();
  }

  private seedInitialData() {
    const seedRoom1: TeleconsultRoom = {
      id: 'tc-room-001',
      roomCode: 'CAM-TC-8891',
      appointmentId: 'apt-tc-101',
      patientId: 'p-1001',
      patientName: 'Chea Sokunthea',
      doctorId: 'doc-001',
      doctorName: 'Dr. Chea Rathana',
      specialty: 'Internal Medicine',
      scheduledAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: 'WAITING',
      durationSeconds: 0,
      clinicalNotes: '',
      participants: {
        DOCTOR: null,
        PATIENT: {
          role: 'PATIENT',
          name: 'Chea Sokunthea',
          connected: true,
          joinedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          audioMuted: false,
          videoMuted: false,
          isScreenSharing: false
        }
      },
      chatMessages: [
        {
          id: 'chat-001',
          senderRole: 'PATIENT',
          senderName: 'Chea Sokunthea',
          message: 'Hello Doctor, I have joined the teleconsult waiting room.',
          timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString()
        }
      ],
      signals: []
    };

    const seedRoom2: TeleconsultRoom = {
      id: 'tc-room-002',
      roomCode: 'CAM-TC-9942',
      appointmentId: 'apt-tc-102',
      patientId: 'p-1002',
      patientName: 'Khem Sovann',
      doctorId: 'doc-002',
      doctorName: 'Dr. Seng Vicheka',
      specialty: 'General Practice',
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: 'SCHEDULED',
      durationSeconds: 0,
      clinicalNotes: '',
      participants: {
        DOCTOR: null,
        PATIENT: null
      },
      chatMessages: [],
      signals: []
    };

    this.rooms.set(seedRoom1.id, seedRoom1);
    this.rooms.set(seedRoom2.id, seedRoom2);

    // Seed a completed digital prescription
    const rxDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const expiryDate = new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString();
    const rxItems: EPrescriptionItem[] = [
      {
        id: 'item-rx-01',
        medicationName: 'Amoxicillin + Clavulanic Acid 625mg',
        dosage: '1 tablet',
        frequency: 'Every 12 hours (Twice daily)',
        duration: '7 days',
        quantity: 14,
        instructions: 'Take after meals with a full glass of water'
      },
      {
        id: 'item-rx-02',
        medicationName: 'Paracetamol 500mg',
        dosage: '1-2 tablets',
        frequency: 'Every 6 hours as needed for fever or pain',
        duration: '5 days',
        quantity: 20,
        instructions: 'Do not exceed 4000mg per 24 hours'
      }
    ];

    const rxHash = this.computeSignatureHash(
      'ep-rx-001',
      'p-1001',
      'MOH-MED-44912',
      rxDate,
      rxItems
    );

    const seedRx: DigitalEPrescription = {
      id: 'ep-rx-001',
      prescriptionNumber: 'EP-2026-0041',
      teleconsultRoomId: 'tc-room-past',
      patientId: 'p-1001',
      patientName: 'Chea Sokunthea',
      patientAge: 34,
      patientGender: 'Female',
      doctorId: 'doc-001',
      doctorName: 'Dr. Chea Rathana',
      doctorLicenseNumber: 'MOH-MED-44912',
      clinicName: 'Preah Monivong Family Clinic',
      clinicAddress: 'Building 14, St 271, Sangkat Boeung Tumpun, Phnom Penh',
      diagnosis: 'Acute Bacterial Sinusitis (J01.90)',
      items: rxItems,
      issuedAt: rxDate,
      expiresAt: expiryDate,
      digitalSignature: {
        algorithm: 'SHA256withHMAC-Ed25519Compatible',
        signatureHash: rxHash,
        signerDoctorId: 'doc-001',
        signerDoctorName: 'Dr. Chea Rathana',
        licenseNumber: 'MOH-MED-44912',
        signedAt: rxDate,
        valid: true
      },
      qrPayload: `EP-RX|id:ep-rx-001|lic:MOH-MED-44912|sig:${rxHash.slice(0, 16)}`,
      qrVerificationUrl: `https://clinic.domain.kh/verify/prescription?id=ep-rx-001&hash=${rxHash}`,
      dispenseStatus: 'PENDING'
    };

    this.prescriptions.set(seedRx.id, seedRx);
  }

  getIceServers(): IceServerConfig[] {
    const customTurnUrl = process.env.TELECONSULT_TURN_URL;
    const customTurnUser = process.env.TELECONSULT_TURN_USERNAME;
    const customTurnCred = process.env.TELECONSULT_TURN_CREDENTIAL;

    const servers: IceServerConfig[] = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ];

    if (customTurnUrl) {
      servers.push({
        urls: customTurnUrl,
        username: customTurnUser || 'clinic_turn_guest',
        credential: customTurnCred || 'clinic_turn_secret'
      });
    }

    return servers;
  }

  listRooms(filters?: { status?: string; doctorId?: string; patientId?: string }): TeleconsultRoom[] {
    let list = Array.from(this.rooms.values());
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters?.doctorId) {
      list = list.filter((r) => r.doctorId === filters.doctorId);
    }
    if (filters?.patientId) {
      list = list.filter((r) => r.patientId === filters.patientId);
    }
    return list.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }

  getRoom(id: string): TeleconsultRoom | null {
    return this.rooms.get(id) || null;
  }

  createRoom(data: Partial<TeleconsultRoom>): TeleconsultRoom {
    const id = data.id || `tc-room-${Date.now().toString(36)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const roomCode = data.roomCode || `CAM-TC-${randomSuffix}`;

    const newRoom: TeleconsultRoom = {
      id,
      roomCode,
      appointmentId: data.appointmentId || `apt-${Date.now()}`,
      patientId: data.patientId || 'unknown-patient',
      patientName: data.patientName || 'Anonymous Patient',
      doctorId: data.doctorId || 'doc-001',
      doctorName: data.doctorName || 'Dr. On Duty',
      specialty: data.specialty || 'General Medicine',
      scheduledAt: data.scheduledAt || new Date().toISOString(),
      status: data.status || 'SCHEDULED',
      durationSeconds: 0,
      clinicalNotes: data.clinicalNotes || '',
      prescriptionId: data.prescriptionId,
      participants: {
        DOCTOR: null,
        PATIENT: null
      },
      chatMessages: [],
      signals: []
    };

    this.rooms.set(id, newRoom);
    return newRoom;
  }

  joinRoom(id: string, participantInfo: { role: ParticipantRole; name: string }): TeleconsultRoom {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error(`Teleconsult room ${id} not found`);
    }

    const participant: Participant = {
      role: participantInfo.role,
      name: participantInfo.name,
      connected: true,
      joinedAt: new Date().toISOString(),
      audioMuted: false,
      videoMuted: false,
      isScreenSharing: false
    };

    room.participants[participantInfo.role] = participant;

    // If both doctor and patient are connected, set status to IN_CALL and record startedAt
    if (room.participants.DOCTOR?.connected && room.participants.PATIENT?.connected) {
      room.status = 'IN_CALL';
      if (!room.startedAt) {
        room.startedAt = new Date().toISOString();
      }
    } else {
      if (room.status === 'SCHEDULED') {
        room.status = 'WAITING';
      }
    }

    return room;
  }

  leaveRoom(id: string, role: ParticipantRole): TeleconsultRoom {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error(`Teleconsult room ${id} not found`);
    }

    if (room.participants[role]) {
      room.participants[role]!.connected = false;
    }

    if (!room.participants.DOCTOR?.connected && !room.participants.PATIENT?.connected) {
      if (room.status === 'IN_CALL') {
        room.status = 'COMPLETED';
        room.endedAt = new Date().toISOString();
        if (room.startedAt) {
          const duration = Math.round(
            (new Date(room.endedAt).getTime() - new Date(room.startedAt).getTime()) / 1000
          );
          room.durationSeconds = Math.max(0, duration);
        }
      }
    }

    return room;
  }

  updateMediaState(
    id: string,
    role: ParticipantRole,
    state: { audioMuted?: boolean; videoMuted?: boolean; isScreenSharing?: boolean }
  ): TeleconsultRoom {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error(`Teleconsult room ${id} not found`);
    }

    const participant = room.participants[role];
    if (participant) {
      if (typeof state.audioMuted === 'boolean') {
        participant.audioMuted = state.audioMuted;
      }
      if (typeof state.videoMuted === 'boolean') {
        participant.videoMuted = state.videoMuted;
      }
      if (typeof state.isScreenSharing === 'boolean') {
        participant.isScreenSharing = state.isScreenSharing;
      }
    }

    return room;
  }

  postSignal(
    id: string,
    signalData: { senderRole: ParticipantRole; type: SignalType; payload: any }
  ): SignalingPayload {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error(`Teleconsult room ${id} not found`);
    }

    const signal: SignalingPayload = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      roomId: id,
      senderRole: signalData.senderRole,
      type: signalData.type,
      payload: signalData.payload,
      timestamp: new Date().toISOString()
    };

    room.signals.push(signal);
    return signal;
  }

  getSignals(id: string, since?: string, recipientRole?: ParticipantRole): SignalingPayload[] {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error(`Teleconsult room ${id} not found`);
    }

    let signals = room.signals;
    if (since) {
      const sinceDate = new Date(since).getTime();
      signals = signals.filter((s) => new Date(s.timestamp).getTime() > sinceDate);
    }

    if (recipientRole) {
      // Signals sent by opposite role
      const senderRole: ParticipantRole = recipientRole === 'DOCTOR' ? 'PATIENT' : 'DOCTOR';
      signals = signals.filter((s) => s.senderRole === senderRole);
    }

    return signals;
  }

  sendChatMessage(
    id: string,
    messageData: { senderRole: ParticipantRole; senderName: string; message: string }
  ): ChatMessage {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error(`Teleconsult room ${id} not found`);
    }

    const chatMsg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderRole: messageData.senderRole,
      senderName: messageData.senderName,
      message: messageData.message,
      timestamp: new Date().toISOString()
    };

    room.chatMessages.push(chatMsg);
    return chatMsg;
  }

  getChatMessages(id: string): ChatMessage[] {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error(`Teleconsult room ${id} not found`);
    }
    return room.chatMessages;
  }

  endCall(id: string, clinicalNotes?: string): TeleconsultRoom {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error(`Teleconsult room ${id} not found`);
    }

    room.status = 'COMPLETED';
    room.endedAt = new Date().toISOString();
    if (clinicalNotes !== undefined) {
      room.clinicalNotes = clinicalNotes;
    }
    if (room.startedAt) {
      const duration = Math.round(
        (new Date(room.endedAt).getTime() - new Date(room.startedAt).getTime()) / 1000
      );
      room.durationSeconds = Math.max(0, duration);
    } else {
      room.durationSeconds = 0;
    }

    if (room.participants.DOCTOR) {
      room.participants.DOCTOR.connected = false;
    }
    if (room.participants.PATIENT) {
      room.participants.PATIENT.connected = false;
    }

    return room;
  }

  private computeSignatureHash(
    id: string,
    patientId: string,
    licenseNumber: string,
    issuedAt: string,
    items: EPrescriptionItem[]
  ): string {
    const itemsDigest = items
      .map((it) => `${it.medicationName}:${it.dosage}:${it.quantity}`)
      .sort()
      .join('|');
    const rawPayload = `${id}::${patientId}::${licenseNumber}::${issuedAt}::${itemsDigest}`;
    return crypto.createHmac('sha256', this.signatureSecret).update(rawPayload).digest('hex');
  }

  createEPrescription(data: Partial<DigitalEPrescription>): DigitalEPrescription {
    const id = data.id || `ep-rx-${Date.now().toString(36)}`;
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const prescriptionNumber = data.prescriptionNumber || `EP-${year}-${randomSeq}`;

    const issuedAt = data.issuedAt || new Date().toISOString();
    const defaultExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const expiresAt = data.expiresAt || defaultExpiry;

    const patientId = data.patientId || 'unknown-patient';
    const doctorLicenseNumber = data.doctorLicenseNumber || 'MOH-MED-44912';
    const items = data.items || [];

    const signatureHash = this.computeSignatureHash(
      id,
      patientId,
      doctorLicenseNumber,
      issuedAt,
      items
    );

    const digitalSignature: DigitalSignatureStamp = {
      algorithm: 'SHA256withHMAC-Ed25519Compatible',
      signatureHash,
      signerDoctorId: data.doctorId || 'doc-001',
      signerDoctorName: data.doctorName || 'Dr. Chea Rathana',
      licenseNumber: doctorLicenseNumber,
      signedAt: issuedAt,
      valid: true
    };

    const qrPayload = `EP-RX|id:${id}|rxNum:${prescriptionNumber}|lic:${doctorLicenseNumber}|sig:${signatureHash.slice(0, 16)}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clinic.domain.kh';
    const qrVerificationUrl = `${baseUrl}/verify/prescription?id=${id}&sig=${signatureHash}`;

    const newPrescription: DigitalEPrescription = {
      id,
      prescriptionNumber,
      teleconsultRoomId: data.teleconsultRoomId,
      patientId,
      patientName: data.patientName || 'Chea Sokunthea',
      patientAge: data.patientAge || 30,
      patientGender: data.patientGender || 'Unspecified',
      doctorId: data.doctorId || 'doc-001',
      doctorName: data.doctorName || 'Dr. Chea Rathana',
      doctorLicenseNumber,
      clinicName: data.clinicName || 'Preah Monivong Family Clinic',
      clinicAddress: data.clinicAddress || 'Building 14, St 271, Sangkat Boeung Tumpun, Phnom Penh',
      diagnosis: data.diagnosis || 'Clinical Diagnosis Pending',
      items,
      issuedAt,
      expiresAt,
      digitalSignature,
      qrPayload,
      qrVerificationUrl,
      dispenseStatus: 'PENDING'
    };

    this.prescriptions.set(id, newPrescription);

    // If linked to room, update room's prescriptionId
    if (data.teleconsultRoomId) {
      const room = this.rooms.get(data.teleconsultRoomId);
      if (room) {
        room.prescriptionId = id;
      }
    }

    return newPrescription;
  }

  verifyEPrescription(
    id: string,
    signatureHash: string
  ): { valid: boolean; prescription?: DigitalEPrescription; reason?: string } {
    const rx = this.prescriptions.get(id);
    if (!rx) {
      return { valid: false, reason: 'Prescription not found in clinic registry' };
    }

    // Recompute hash to ensure anti-tamper
    const recomputedHash = this.computeSignatureHash(
      rx.id,
      rx.patientId,
      rx.doctorLicenseNumber,
      rx.issuedAt,
      rx.items
    );

    if (signatureHash !== recomputedHash && signatureHash !== rx.digitalSignature.signatureHash) {
      return {
        valid: false,
        reason: 'Cryptographic signature mismatch. Digital signature is invalid or tampered with.'
      };
    }

    // Check expiration
    if (new Date().getTime() > new Date(rx.expiresAt).getTime()) {
      return {
        valid: false,
        prescription: rx,
        reason: 'Prescription has expired.'
      };
    }

    return {
      valid: true,
      prescription: rx
    };
  }

  listEPrescriptions(patientId?: string): DigitalEPrescription[] {
    let list = Array.from(this.prescriptions.values());
    if (patientId) {
      list = list.filter((p) => p.patientId === patientId);
    }
    return list.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  getEPrescription(id: string): DigitalEPrescription | null {
    return this.prescriptions.get(id) || null;
  }

  dispenseEPrescription(id: string, pharmacyName: string): DigitalEPrescription {
    const rx = this.prescriptions.get(id);
    if (!rx) {
      throw new Error(`Prescription ${id} not found`);
    }

    if (rx.dispenseStatus === 'DISPENSED') {
      throw new Error(`Prescription ${id} has already been dispensed`);
    }

    rx.dispenseStatus = 'DISPENSED';
    rx.dispensedAt = new Date().toISOString();
    rx.dispensedPharmacy = pharmacyName;

    return rx;
  }
}
