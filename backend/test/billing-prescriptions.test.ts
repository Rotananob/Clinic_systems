import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

interface PrescriptionItem {
  medicineName: string;
  quantity: number;
  unitPrice: number;
}

export function computeOutpatientInvoice(consultationFee: number, items: PrescriptionItem[]): {
  subtotalConsultation: number;
  subtotalPharmacy: number;
  totalUsd: number;
  totalKhr: number;
} {
  const subtotalPharmacy = items.reduce((acc, item) => {
    return acc + (item.quantity * item.unitPrice);
  }, 0);

  const totalUsd = Math.round((consultationFee + subtotalPharmacy) * 100) / 100;
  // Standard clinical exchange rate in Cambodia: 4,100 KHR / USD
  const totalKhr = Math.round(totalUsd * 4100);

  return {
    subtotalConsultation: consultationFee,
    subtotalPharmacy: Math.round(subtotalPharmacy * 100) / 100,
    totalUsd,
    totalKhr,
  };
}

describe('Billing & Multi-Item Prescription Invoice Calculation Test Suite', () => {
  it('should compute exact totals for consultation fee and pharmacy dispensed items', () => {
    const consultationFee = 15.00;
    const items: PrescriptionItem[] = [
      { medicineName: 'Amoxicillin 500mg', quantity: 20, unitPrice: 0.25 }, // $5.00
      { medicineName: 'Paracetamol 500mg', quantity: 10, unitPrice: 0.10 }, // $1.00
      { medicineName: 'Cetirizine 10mg', quantity: 10, unitPrice: 0.15 },   // $1.50
    ];

    const invoice = computeOutpatientInvoice(consultationFee, items);

    assert.equal(invoice.subtotalConsultation, 15.00);
    assert.equal(invoice.subtotalPharmacy, 7.50);
    assert.equal(invoice.totalUsd, 22.50);
    assert.equal(invoice.totalKhr, 92250);
  });

  it('should handle zero pharmacy items correctly (consultation-only visit)', () => {
    const invoice = computeOutpatientInvoice(20.00, []);
    assert.equal(invoice.subtotalConsultation, 20.00);
    assert.equal(invoice.subtotalPharmacy, 0);
    assert.equal(invoice.totalUsd, 20.00);
    assert.equal(invoice.totalKhr, 82000);
  });
});
