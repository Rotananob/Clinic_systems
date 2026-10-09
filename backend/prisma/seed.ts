import { PrismaClient, Role, Gender, VisitStatus, PrescriptionStatus, InvoiceStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Clinic Database Seeding ---');

  // 1. Seed Roles & Users with Production-Grade High Entropy Passwords (bcrypt 12 rounds)
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@DemoClinic#2026';
  const doctorPassword = process.env.SEED_DOCTOR_PASSWORD || 'Doctor@DemoClinic#2026';
  const receptionPassword = process.env.SEED_RECEPTIONIST_PASSWORD || 'Reception@DemoClinic#2026';
  const cashierPassword = process.env.SEED_CASHIER_PASSWORD || 'Cashier@DemoClinic#2026';
  const pharmacyPassword = process.env.SEED_PHARMACIST_PASSWORD || 'Pharmacy@DemoClinic#2026';

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const doctorHash = await bcrypt.hash(doctorPassword, 12);
  const receptionHash = await bcrypt.hash(receptionPassword, 12);
  const cashierHash = await bcrypt.hash(cashierPassword, 12);
  const pharmacyHash = await bcrypt.hash(pharmacyPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: { passwordHash: adminHash },
    create: {
      email: 'admin@clinic.com',
      passwordHash: adminHash,
      fullNameEn: 'Dr. Heng Rotana',
      fullNameKh: 'លោកវេជ្ជបណ្ឌិត ហេង រតនា',
      role: Role.ADMIN,
      phone: '012998877',
      isActive: true,
    },
  });

  const doctor = await prisma.user.upsert({
    where: { email: 'doctor.sok@clinic.com' },
    update: { passwordHash: doctorHash },
    create: {
      email: 'doctor.sok@clinic.com',
      passwordHash: doctorHash,
      fullNameEn: 'Dr. Sok Chantha',
      fullNameKh: 'លោកវេជ្ជបណ្ឌិត សុខ ចាន់ថា',
      role: Role.DOCTOR,
      phone: '010887766',
      isActive: true,
    },
  });

  const receptionist = await prisma.user.upsert({
    where: { email: 'reception@clinic.com' },
    update: { passwordHash: receptionHash },
    create: {
      email: 'reception@clinic.com',
      passwordHash: receptionHash,
      fullNameEn: 'Meas Bopha',
      fullNameKh: 'កញ្ញា មាស បុប្ផា',
      role: Role.RECEPTIONIST,
      phone: '098112233',
      isActive: true,
    },
  });

  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@clinic.com' },
    update: { passwordHash: cashierHash },
    create: {
      email: 'cashier@clinic.com',
      passwordHash: cashierHash,
      fullNameEn: 'Keo Vanna',
      fullNameKh: 'លោក កែវ វណ្ណា',
      role: Role.CASHIER,
      phone: '077554433',
      isActive: true,
    },
  });

  const pharmacist = await prisma.user.upsert({
    where: { email: 'pharmacy@clinic.com' },
    update: { passwordHash: pharmacyHash },
    create: {
      email: 'pharmacy@clinic.com',
      passwordHash: pharmacyHash,
      fullNameEn: 'Srun Vichheka',
      fullNameKh: 'កញ្ញា ស្រ៊ុន វិច្ឆិកា',
      role: Role.PHARMACIST,
      phone: '089443322',
      isActive: true,
    },
  });

  console.log('Seeded Users with Ultra-Secure Passwords: Admin, Doctor, Receptionist, Cashier, Pharmacist');

  // 2. Seed Realistic Sample Patients
  const patient1 = await prisma.patient.upsert({
    where: { patientCode: 'PAT-2026-0001' },
    update: {},
    create: {
      patientCode: 'PAT-2026-0001',
      nameEn: 'Chea Sambath',
      nameKh: 'ជា សម្បត្តិ',
      gender: Gender.MALE,
      dob: new Date('1988-05-14'),
      phone: '012345678',
      nationalId: '010203040',
      address: 'Street 271, Boeng Tumpun, Phnom Penh',
      bloodType: 'O+',
      allergies: 'Penicillin',
      emergencyContactName: 'Chea Sophea (Wife)',
      emergencyContactPhone: '012987654',
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { patientCode: 'PAT-2026-0002' },
    update: {},
    create: {
      patientCode: 'PAT-2026-0002',
      nameEn: 'Ly Kolap',
      nameKh: 'លី កុលាប',
      gender: Gender.FEMALE,
      dob: new Date('1995-11-20'),
      phone: '0978899001',
      nationalId: '020304050',
      address: 'Toul Kork, Phnom Penh',
      bloodType: 'A+',
      allergies: 'None',
      emergencyContactName: 'Ly Dara (Brother)',
      emergencyContactPhone: '0978899002',
    },
  });

  console.log('Seeded Patients: PAT-2026-0001, PAT-2026-0002');

  // 3. Seed Visit & Medical Record
  const visit1 = await prisma.visit.upsert({
    where: { visitCode: 'VST-2026-0001' },
    update: {},
    create: {
      visitCode: 'VST-2026-0001',
      patientId: patient1.id,
      doctorId: doctor.id,
      reason: 'Persistent fever and sore throat for 3 days',
      symptoms: 'High fever, fatigue, throat irritation',
      bloodPressure: '120/80',
      heartRate: 78,
      temperature: 38.5,
      weightKg: 68.5,
      heightCm: 172.0,
      diagnosis: 'Acute Pharyngitis (បំពង់កឡើងក្រហម)',
      notes: 'Prescribed antibiotics and antipyretics. Rest advised for 3 days.',
      status: VisitStatus.COMPLETED,
      consultationFee: 10.00,
    },
  });

  await prisma.medicalRecord.upsert({
    where: { visitId: visit1.id },
    update: {},
    create: {
      visitId: visit1.id,
      patientId: patient1.id,
      physicalExam: 'Erythematous posterior pharynx, no exudate, clear lungs on auscultation.',
      assessment: 'Acute viral or early bacterial pharyngitis without respiratory distress.',
      treatmentPlan: 'Hydration, Amoxicillin-Clavulanate 625mg PO BID x 7d, Paracetamol 500mg PO PRN.',
      notes: 'Advised return if dyspnea occurs or fever persists beyond 48 hours.',
    },
  });

  // 4. Seed Prescription & Items
  const prescription1 = await prisma.prescription.upsert({
    where: { prescriptionCode: 'RX-2026-0001' },
    update: {},
    create: {
      prescriptionCode: 'RX-2026-0001',
      visitId: visit1.id,
      patientId: patient1.id,
      doctorId: doctor.id,
      status: PrescriptionStatus.DISPENSED,
      totalAmount: 15.50,
      notes: 'Take medicine strictly according to prescription.',
      items: {
        create: [
          {
            medicineName: 'Amoxicillin-Clavulanate 625mg',
            dosage: '625mg',
            frequency: '2 times daily after food (ព្រឹក-ល្ងាច)',
            duration: '7 days',
            quantity: 14,
            unitPrice: 0.75,
            subtotal: 10.50,
            instructions: 'Complete full course even if symptoms improve',
          },
          {
            medicineName: 'Paracetamol 500mg',
            dosage: '500mg',
            frequency: 'Every 6 hours if fever > 38C (ពេលក្តៅខ្លួន)',
            duration: '3 days',
            quantity: 10,
            unitPrice: 0.50,
            subtotal: 5.00,
            instructions: 'Do not exceed 4g per 24 hours',
          },
        ],
      },
    },
  });

  // 5. Seed Invoice & Settled KHQR Payment
  const invoice1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-0001' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-0001',
      visitId: visit1.id,
      patientId: patient1.id,
      totalAmount: 25.50, // 10 fee + 15.50 meds
      discount: 0.00,
      payableAmount: 25.50,
      currency: 'USD',
      status: InvoiceStatus.PAID,
      paymentMethod: PaymentMethod.KHQR,
      cashierId: cashier.id,
      paidAt: new Date(),
      transactions: {
        create: {
          tranId: 'KHQR-2026-0001',
          qrString: '00020101021229640016rotana_clinic@aba013210100222019777977790214KHQR-2026-0001520459995303840540525.505802KH5913Rotana Clinic6010Phnom Penh6304E3A1',
          md5: 'd41d8cd98f00b204e9800998ecf8427e',
          currency: 'USD',
          amount: 25.50,
          status: PaymentStatus.SUCCESS,
          deeplinkUrl: 'abapay://checkout?tran_id=KHQR-2026-0001',
          verifiedAt: new Date(),
        },
      },
    },
  });

  console.log('Seeded Prescription RX-2026-0001 & Paid Invoice INV-2026-0001');
  console.log('--- Database Seeding Completed Successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
