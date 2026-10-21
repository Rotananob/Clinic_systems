import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { TeleconsultService } from '../src/teleconsult/teleconsult.service.ts';

describe('Phase 16: Teleconsultation WebRTC Video Call & Digital e-Prescription with QR Signature', () => {
  let service: TeleconsultService;

  beforeEach(() => {
    service = new TeleconsultService();
  });

  it('should return standard STUN servers and support custom TURN configuration', () => {
    const servers = service.getIceServers();
    assert.ok(servers.length >= 1);
    assert.ok(String(servers[0].urls).includes('stun:'));
  });

  it('should list seeded teleconsult rooms and allow filtering', () => {
    const allRooms = service.listRooms();
    assert.ok(allRooms.length >= 2);

    const waitingRooms = service.listRooms({ status: 'WAITING' });
    assert.ok(waitingRooms.some(r => r.status === 'WAITING'));

    const p1Rooms = service.listRooms({ patientId: 'p-1001' });
    assert.ok(p1Rooms.length > 0);
    assert.equal(p1Rooms[0].patientId, 'p-1001');
  });

  it('should create a teleconsultation room with generated code', () => {
    const room = service.createRoom({
      patientId: 'p-2005',
      patientName: 'Meas Vanna',
      doctorId: 'doc-003',
      doctorName: 'Dr. Kim Sanh',
      specialty: 'Cardiology'
    });

    assert.ok(room.id);
    assert.match(room.roomCode, /^CAM-TC-\d{4}$/);
    assert.equal(room.patientName, 'Meas Vanna');
    assert.equal(room.status, 'SCHEDULED');
    assert.equal(room.participants.DOCTOR, null);
    assert.equal(room.participants.PATIENT, null);
  });

  it('should manage room lifecycle: doctor and patient join, transition to IN_CALL, and update media state', () => {
    const room = service.createRoom({
      patientId: 'p-test',
      patientName: 'Test Patient'
    });

    // Patient joins
    const roomAfterPatient = service.joinRoom(room.id, {
      role: 'PATIENT',
      name: 'Test Patient'
    });
    assert.equal(roomAfterPatient.status, 'WAITING');
    assert.equal(roomAfterPatient.participants.PATIENT?.connected, true);

    // Doctor joins -> transitions to IN_CALL
    const roomAfterDoctor = service.joinRoom(room.id, {
      role: 'DOCTOR',
      name: 'Dr. Specialist'
    });
    assert.equal(roomAfterDoctor.status, 'IN_CALL');
    assert.ok(roomAfterDoctor.startedAt);

    // Toggle mute and screen share
    service.updateMediaState(room.id, 'DOCTOR', { audioMuted: true, isScreenSharing: true });
    assert.equal(service.getRoom(room.id)?.participants.DOCTOR?.audioMuted, true);
    assert.equal(service.getRoom(room.id)?.participants.DOCTOR?.isScreenSharing, true);
  });

  it('should exchange WebRTC signaling messages (offer, answer, ice-candidate)', () => {
    const room = service.createRoom({ patientId: 'p-sig' });

    const offer = service.postSignal(room.id, {
      senderRole: 'PATIENT',
      type: 'offer',
      payload: { sdp: 'v=0\r\no=patient 1234 2 IN IP4 127.0.0.1...' }
    });
    assert.ok(offer.id);
    assert.equal(offer.type, 'offer');

    const doctorSignals = service.getSignals(room.id, undefined, 'DOCTOR');
    assert.equal(doctorSignals.length, 1);
    assert.equal(doctorSignals[0].type, 'offer');

    const answer = service.postSignal(room.id, {
      senderRole: 'DOCTOR',
      type: 'answer',
      payload: { sdp: 'v=0\r\no=doctor 5678 2 IN IP4 127.0.0.1...' }
    });
    assert.equal(answer.type, 'answer');

    const patientSignals = service.getSignals(room.id, undefined, 'PATIENT');
    assert.equal(patientSignals.length, 1);
    assert.equal(patientSignals[0].type, 'answer');
  });

  it('should handle in-call chat messaging', () => {
    const room = service.createRoom({ patientId: 'p-chat' });

    const msg = service.sendChatMessage(room.id, {
      senderRole: 'DOCTOR',
      senderName: 'Dr. Chea Rathana',
      message: 'Can you please adjust your camera towards your throat?'
    });

    assert.ok(msg.id);
    assert.ok(msg.message.includes('camera towards your throat'));

    const chatHistory = service.getChatMessages(room.id);
    assert.equal(chatHistory.length, 1);
    assert.equal(chatHistory[0].senderRole, 'DOCTOR');
  });

  it('should end teleconsultation call and calculate duration seconds', () => {
    const room = service.createRoom({ patientId: 'p-end' });
    service.joinRoom(room.id, { role: 'PATIENT', name: 'Patient' });
    service.joinRoom(room.id, { role: 'DOCTOR', name: 'Doctor' });

    const endedRoom = service.endCall(room.id, 'Patient has seasonal allergic rhinitis. Prescribed antihistamine.');
    assert.equal(endedRoom.status, 'COMPLETED');
    assert.ok(endedRoom.endedAt);
    assert.ok(endedRoom.clinicalNotes.includes('allergic rhinitis'));
    assert.ok(endedRoom.durationSeconds >= 0);
    assert.equal(endedRoom.participants.DOCTOR?.connected, false);
  });

  it('should generate digitally signed e-prescription with cryptographic hash and QR payload', () => {
    const rx = service.createEPrescription({
      patientId: 'p-1001',
      patientName: 'Chea Sokunthea',
      doctorId: 'doc-001',
      doctorName: 'Dr. Chea Rathana',
      doctorLicenseNumber: 'MOH-MED-44912',
      diagnosis: 'Acute Bronchitis (J20.9)',
      items: [
        {
          id: 'item-01',
          medicationName: 'Azithromycin 500mg',
          dosage: '1 tablet daily',
          frequency: 'Once a day',
          duration: '3 days',
          quantity: 3,
          instructions: 'Take 1 hour before or 2 hours after meals'
        }
      ]
    });

    assert.ok(rx.id);
    assert.match(rx.prescriptionNumber, /^EP-\d{4}-\d{4}$/);
    assert.ok(rx.digitalSignature.signatureHash);
    assert.equal(rx.digitalSignature.signatureHash.length, 64); // 256-bit SHA256 hex string
    assert.equal(rx.digitalSignature.valid, true);
    assert.ok(rx.qrVerificationUrl.includes('/verify/prescription'));
    assert.equal(rx.dispenseStatus, 'PENDING');
  });

  it('should verify valid e-prescription and detect tampering or invalid signature', () => {
    const rx = service.createEPrescription({
      patientId: 'p-1002',
      doctorLicenseNumber: 'MOH-MED-55001',
      items: [
        {
          id: 'rx-itm-1',
          medicationName: 'Cefixime 200mg',
          dosage: '1 capsule',
          frequency: 'Twice daily',
          duration: '5 days',
          quantity: 10,
          instructions: 'Take with food'
        }
      ]
    });

    // Valid check
    const validCheck = service.verifyEPrescription(rx.id, rx.digitalSignature.signatureHash);
    assert.equal(validCheck.valid, true);
    assert.equal(validCheck.prescription?.prescriptionNumber, rx.prescriptionNumber);

    // Tampered signature
    const tamperedCheck = service.verifyEPrescription(rx.id, 'tampered-fake-signature-hash-12345');
    assert.equal(tamperedCheck.valid, false);
    assert.ok(tamperedCheck.reason?.includes('tampered'));

    // Unknown ID
    const notFoundCheck = service.verifyEPrescription('non-existent-rx', rx.digitalSignature.signatureHash);
    assert.equal(notFoundCheck.valid, false);
  });

  it('should record pharmacy dispensing and prevent duplicate dispensing', () => {
    const rx = service.createEPrescription({
      patientId: 'p-dispense',
      items: [
        {
          id: 'rx-disp-1',
          medicationName: 'Ibuprofen 400mg',
          dosage: '1 tab',
          frequency: 'TDS',
          duration: '3 days',
          quantity: 9,
          instructions: 'After food'
        }
      ]
    });

    const dispensed = service.dispenseEPrescription(rx.id, 'U-Care Pharmacy Central Phnom Penh');
    assert.equal(dispensed.dispenseStatus, 'DISPENSED');
    assert.equal(dispensed.dispensedPharmacy, 'U-Care Pharmacy Central Phnom Penh');
    assert.ok(dispensed.dispensedAt);

    // Duplicate dispensing attempt should throw
    assert.throws(() => {
      service.dispenseEPrescription(rx.id, 'Another Pharmacy');
    }, /already been dispensed/);
  });
});
