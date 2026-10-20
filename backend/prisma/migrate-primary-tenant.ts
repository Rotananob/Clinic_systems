import { PrismaClient, PlanTier, SubscriptionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function migrateToPrimaryMasterTenant() {
  console.log('=== Step 5: Primary Master Tenant Data Migration ===');

  // 1. Upsert Primary Master Tenant
  const primaryTenant = await prisma.tenant.upsert({
    where: { slug: 'rotana' },
    update: {
      planTier: PlanTier.ENTERPRISE_12,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      maxMonthlyPatients: -1,
      maxDailyKhqr: -1,
      maxStaffAccounts: -1,
      isActive: true,
    },
    create: {
      slug: 'rotana',
      clinicNameKh: 'គ្លីនិក រតនៈ',
      clinicNameEn: 'Rotana Medical Center',
      mohLicenseNumber: 'MOH-2026-KH-0899',
      clinicType: 'Polyclinic & Outpatient Specialized Center',
      phonePrimary: '012888999',
      phoneEmergency: '012000999',
      email: 'rotana@clinic.com',
      website: 'https://rotana-clinic.com',
      addressKh: 'រាជធានីភ្នំពេញ ព្រះរាជាណាចក្រកម្ពុជា',
      addressEn: 'Phnom Penh, Kingdom of Cambodia',
      bakongAccountId: process.env.BAKONG_ACCOUNT_ID || 'rotana_nob@aba',
      merchantName: 'ROTANA MEDICAL CENTER',
      merchantCity: 'Phnom Penh',
      planTier: PlanTier.ENTERPRISE_12,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      maxMonthlyPatients: -1, // Unlimited
      maxDailyKhqr: -1, // Unlimited
      maxStaffAccounts: -1, // Unlimited
      isActive: true,
    },
  });

  console.log(`Primary Master Tenant verified: ${primaryTenant.clinicNameEn} (ID: ${primaryTenant.id})`);

  // 2. Migrate existing orphaned records with zero data loss
  const usersUpdated = await prisma.user.updateMany({
    where: { tenantId: null },
    data: { tenantId: primaryTenant.id },
  });

  const patientsUpdated = await prisma.patient.updateMany({
    where: { tenantId: null },
    data: { tenantId: primaryTenant.id },
  });

  const visitsUpdated = await prisma.visit.updateMany({
    where: { tenantId: null },
    data: { tenantId: primaryTenant.id },
  });

  const prescriptionsUpdated = await prisma.prescription.updateMany({
    where: { tenantId: null },
    data: { tenantId: primaryTenant.id },
  });

  const invoicesUpdated = await prisma.invoice.updateMany({
    where: { tenantId: null },
    data: { tenantId: primaryTenant.id },
  });

  const followUpsUpdated = await prisma.followUp.updateMany({
    where: { tenantId: null },
    data: { tenantId: primaryTenant.id },
  });

  const auditLogsUpdated = await prisma.auditLog.updateMany({
    where: { tenantId: null },
    data: { tenantId: primaryTenant.id },
  });

  const documentsUpdated = await prisma.document.updateMany({
    where: { tenantId: null },
    data: { tenantId: primaryTenant.id },
  });

  const visitorLogsUpdated = await prisma.visitorLog.updateMany({
    where: { tenantId: null },
    data: { tenantId: primaryTenant.id },
  });

  // 3. Ensure initial subscription record exists
  const existingSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId: primaryTenant.id },
  });

  if (!existingSub) {
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 10); // 10 years master validity

    await prisma.tenantSubscription.create({
      data: {
        tenantId: primaryTenant.id,
        planTier: PlanTier.ENTERPRISE_12,
        amountUsd: 12.0,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: oneYearLater,
        paymentMethod: 'MASTER_PROVISION',
        invoiceNumber: 'INV-MASTER-0001',
        notes: 'Primary Master Owner SaaS Account - Unlimited Privileges',
      },
    });
    console.log('Created Primary Master Tenant Subscription record');
  }

  const summary = {
    tenantId: primaryTenant.id,
    slug: primaryTenant.slug,
    usersMigrated: usersUpdated.count,
    patientsMigrated: patientsUpdated.count,
    visitsMigrated: visitsUpdated.count,
    prescriptionsMigrated: prescriptionsUpdated.count,
    invoicesMigrated: invoicesUpdated.count,
    followUpsMigrated: followUpsUpdated.count,
    auditLogsMigrated: auditLogsUpdated.count,
    documentsMigrated: documentsUpdated.count,
    visitorLogsMigrated: visitorLogsUpdated.count,
  };

  console.log('Migration Completed with Zero Data Loss:');
  console.table(summary);
  return summary;
}

if (require.main === module) {
  migrateToPrimaryMasterTenant()
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
