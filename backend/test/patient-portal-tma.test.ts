import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PortalService } from '../src/portal/portal.service.ts';
import { VisitStatus, InvoiceStatus, PrescriptionStatus } from '@prisma/client';

describe('Phase 5: Patient Telegram Mini App & Public Portal Suite', () => {
  const mockPrisma: any = {
    patient: {
      findFirst: async (args: any) => {
        const idQuery = args.where.OR;
        const matchesCode = idQuery.some((q: any) => q.patientCode?.equals === 'P-2026-0042');
        const matchesPhone = idQuery.some((q: any) => q.phone === '012345678');
        const matchesVisit = idQuery.some((q: any) => q.visits?.some?.visitCode?.equals === 'VST-2026-0099');

        if (!matchesCode && !matchesPhone && !matchesVisit) {
          return null;
        }

        const today = new Date();
        return {
          id: 'patient-uuid-1',
          patientCode: 'P-2026-0042',
          nameEn: 'Sokha Chan',
          nameKh: 'ចាន់ សុខា',
          gender: 'FEMALE',
          phone: '012345678',
          bloodType: 'O+',
          allergies: 'Penicillin',
          tenantId: 'rotana-tenant-uuid',
          tenant: {
            nameEn: 'Rotana Medical Center',
            nameKh: 'មជ្ឈមណ្ឌលវេជ្ជសាស្ត្រ រតនា',
            phonePrimary: '012 345 678',
            addressEn: 'Phnom Penh, Cambodia',
          },
          visits: [
            {
              id: 'visit-uuid-1',
              visitCode: 'VST-2026-0099',
              status: VisitStatus.WAITING,
              createdAt: today,
              doctor: { fullNameEn: 'Dr. Keo Samnang', fullNameKh: 'ដុកទ័រ កែវ សំណាង' },
            },
          ],
          prescriptions: [
            {
              id: 'rx-uuid-1',
              prescriptionCode: 'RX-2026-0012',
              status: PrescriptionStatus.PENDING,
              totalAmount: 18.5,
              createdAt: today,
              doctor: { fullNameEn: 'Dr. Keo Samnang' },
              items: [
                {
                  medicineName: 'Paracetamol',
                  dosage: '500mg',
                  frequency: '3 times daily after food',
                  duration: '5 days',
                  quantity: 15,
                  instructions: 'Take when fever exceeds 38C',
                },
              ],
            },
          ],
          invoices: [
            {
              id: 'inv-uuid-1',
              invoiceNumber: 'INV-2026-0050',
              totalAmount: 25.0,
              payableAmount: 25.0,
              status: InvoiceStatus.UNPAID,
              paymentMethod: 'KHQR',
              createdAt: today,
              qrString: '00020101021229370016bakong@aba0109123456785303840540525.005802KH6304ABCD',
            },
          ],
        };
      },
    },
    visit: {
      count: async (args: any) => {
        if (args.where.status === VisitStatus.WAITING && args.where.createdAt?.lt) {
          return 2; // 2 patients ahead
        }
        if (args.where.status === VisitStatus.WAITING) return 4;
        if (args.where.status === VisitStatus.IN_CONSULTATION) return 1;
        if (args.where.status === VisitStatus.COMPLETED) return 12;
        return 0;
      },
      findFirst: async (args: any) => {
        if (args.where.status === VisitStatus.IN_CONSULTATION) {
          return {
            visitCode: 'VST-2026-0097',
            doctor: { fullNameEn: 'Dr. Chea Sovann' },
          };
        }
        return null;
      },
    },
  };

  const portalService = new PortalService(mockPrisma);

  it('should search patient by patientCode and compute live queue position', async () => {
    const data = await portalService.getPatientPortalData('P-2026-0042');

    assert.equal(data.patient.patientCode, 'P-2026-0042');
    assert.equal(data.patient.nameEn, 'Sokha Chan');
    assert.equal(data.patient.allergies, 'Penicillin');

    assert.notEqual(data.activeQueue, null);
    assert.equal(data.activeQueue?.ticketCode, 'Q-099');
    assert.equal(data.activeQueue?.status, VisitStatus.WAITING);
    assert.equal(data.activeQueue?.patientsAhead, 2);
    assert.equal(data.activeQueue?.queuePosition, 3);
    assert.equal(data.activeQueue?.estimatedWaitMinutes, 24); // (2 ahead + 1) * 8 mins
  });

  it('should retrieve patient by phone number and include digital prescriptions and unpaid KHQR invoices', async () => {
    const data = await portalService.getPatientPortalData('012345678');

    assert.equal(data.prescriptions.length, 1);
    assert.equal(data.prescriptions[0].prescriptionCode, 'RX-2026-0012');
    assert.equal(data.prescriptions[0].items[0].medicineName, 'Paracetamol');

    assert.equal(data.invoices.length, 1);
    assert.equal(data.invoices[0].invoiceNumber, 'INV-2026-0050');
    assert.equal(data.invoices[0].status, InvoiceStatus.UNPAID);
    assert.equal(data.invoices[0].payableAmount, 25.0);
    assert.equal(data.invoices[0].khqrString?.includes('bakong@aba'), true);
  });

  it('should reject invalid or missing search queries gracefully', async () => {
    await assert.rejects(async () => {
      await portalService.getPatientPortalData('');
    }, /Identifier required/);

    await assert.rejects(async () => {
      await portalService.getPatientPortalData('NON_EXISTENT_9999');
    }, /No patient record found/);
  });

  it('should calculate live clinic queue summary for waiting room monitors', async () => {
    const queue = await portalService.getLiveClinicQueue('rotana-tenant-uuid');

    assert.equal(queue.currentlyServingTicket, 'Q-097');
    assert.equal(queue.currentlyServingDoctor, 'Dr. Chea Sovann');
    assert.equal(queue.totalWaitingCount, 4);
    assert.equal(queue.totalInConsultationCount, 1);
    assert.equal(queue.totalCompletedToday, 12);
    assert.equal(queue.averageWaitMinutes, 8);
  });

  it('should generate bilingual medication reminders with ZERO emojis', () => {
    const reminder = portalService.formatMedicationReminder({
      patientName: 'Sokha Chan',
      medicineName: 'Amoxicillin',
      dosage: '500mg',
      frequency: '3 times daily after meals',
      instructions: 'Complete 7-day antibiotic cycle',
      timeSlot: 'Afternoon (12:30 PM)',
      clinicName: 'Rotana Polyclinic',
    });

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
    assert.equal(emojiRegex.test(reminder), false, 'Medication reminder must contain ZERO emojis');
    assert.equal(reminder.includes('Amoxicillin'), true);
    assert.equal(reminder.includes('Sokha Chan'), true);
    assert.equal(reminder.includes('Afternoon'), true);
    assert.equal(reminder.includes('ការរំលឹកលេបថ្នាំ'), true);
  });

  it('should generate bilingual follow-up recall notifications with ZERO emojis', () => {
    const recall = portalService.formatFollowUpReminder({
      patientName: 'Sokha Chan',
      doctorName: 'Keo Samnang',
      clinicName: 'Rotana Polyclinic',
      appointmentDate: '24/10/2026',
      appointmentTime: '09:00 AM',
      reason: 'Blood pressure reassessment and lab review',
    });

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
    assert.equal(emojiRegex.test(recall), false, 'Appointment recall must contain ZERO emojis');
    assert.equal(recall.includes('Keo Samnang'), true);
    assert.equal(recall.includes('24/10/2026'), true);
    assert.equal(recall.includes('ការរំលឹកការណាត់ជួប'), true);
  });

  it('should generate instant queue turn call alerts with ZERO emojis', () => {
    const alert = portalService.formatQueueTurnAlert({
      patientName: 'Sokha Chan',
      ticketCode: 'Q-099',
      roomNumber: 'Consultation Room 2',
      doctorName: 'Keo Samnang',
      clinicName: 'Rotana Polyclinic',
    });

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/u;
    assert.equal(emojiRegex.test(alert), false, 'Queue turn alert must contain ZERO emojis');
    assert.equal(alert.includes('Q-099'), true);
    assert.equal(alert.includes('Consultation Room 2'), true);
    assert.equal(alert.includes('ជូនដំណឹងដល់វេនពិនិត្យ'), true);
  });
});
