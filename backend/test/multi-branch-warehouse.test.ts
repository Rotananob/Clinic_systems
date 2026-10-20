import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { WarehouseService } from '../src/warehouse/warehouse.service.ts';

describe('Phase 6: Multi-Branch Chain & Central Warehouse Engine Suite', () => {
  let warehouseService: WarehouseService;
  const mockPrisma: any = {};

  beforeEach(() => {
    warehouseService = new WarehouseService(mockPrisma);
  });

  it('should list all initial clinic branches and central warehouse with proper metadata', () => {
    const branches = warehouseService.getAllBranches();
    assert.equal(branches.length >= 4, true);

    const hq = branches.find((b) => b.branchCode === 'BR-HQ');
    assert.ok(hq);
    assert.equal(hq.isWarehouse, true);
    assert.equal(hq.nameEn, 'Rotana Central Medical Depot & HQ');

    const tk = branches.find((b) => b.branchCode === 'BR-TK');
    assert.ok(tk);
    assert.equal(tk.isWarehouse, false);
  });

  it('should retrieve a branch by its id or code', () => {
    const branch = warehouseService.getBranchById('branch-bkk');
    assert.equal(branch.branchCode, 'BR-BKK');
    assert.equal(branch.nameEn, 'Rotana Clinic BKK1');

    assert.throws(
      () => warehouseService.getBranchById('non-existent-branch'),
      /not found/i,
    );
  });

  it('should compute Central HQ Warehouse executive metrics with USD and KHR valuations', () => {
    const overview = warehouseService.getHqWarehouseOverview();
    assert.ok(overview.totalValuationUsd > 0);
    assert.equal(overview.totalValuationKhr, Math.round(overview.totalValuationUsd * 4100));
    assert.ok(overview.totalStockUnits > 0);
    assert.ok(overview.branchesCount >= 4);

    // Verify branch breakdown presence
    const hqSummary = overview.branchBreakdown.find((b) => b.branchCode === 'BR-HQ');
    assert.ok(hqSummary);
    assert.ok(hqSummary.totalStockUnits > 500);

    // Verify low stock detection
    assert.equal(Array.isArray(overview.lowStockBatches), true);
    const lowStockItem = overview.lowStockBatches.find((b) => b.medicineId === 'med-ns-500');
    assert.ok(lowStockItem);
    assert.equal(lowStockItem.quantity <= 20, true);
  });

  it('should classify expiration radar into 30, 60, and 90 day FEFO alerts', () => {
    const { batches, summary } = warehouseService.getExpiringBatches(undefined, 90);

    assert.ok(summary.totalExpiring > 0);
    assert.ok(summary.within30DaysCount >= 1); // Ceftriaxone in HQ
    assert.ok(summary.within60DaysCount >= 1); // Omeprazole in HQ
    assert.ok(summary.within90DaysCount >= 1); // Amoxicillin in HQ

    // Verify FEFO sort order: each subsequent batch has expirationDate >= previous
    for (let i = 0; i < batches.length - 1; i++) {
      const currentExp = new Date(batches[i].expirationDate).getTime();
      const nextExp = new Date(batches[i + 1].expirationDate).getTime();
      assert.ok(
        currentExp <= nextExp,
        `FEFO order violated: ${batches[i].expirationDate} > ${batches[i + 1].expirationDate}`,
      );
    }
  });

  it('should reject inter-branch transfer when source and target branches are identical', () => {
    assert.throws(
      () =>
        warehouseService.createTransfer({
          sourceBranchId: 'branch-hq',
          targetBranchId: 'branch-hq',
          items: [{ batchId: 'batch-1', quantity: 10 }],
        }),
      /Source and target branches cannot be the same/i,
    );
  });

  it('should reject inter-branch transfer when requested quantity exceeds available stock', () => {
    assert.throws(
      () =>
        warehouseService.createTransfer({
          sourceBranchId: 'branch-hq',
          targetBranchId: 'branch-tk',
          items: [{ batchId: 'batch-1', quantity: 999999 }],
        }),
      /Insufficient stock/i,
    );
  });

  it('should create a draft transfer manifest with unique code and barcode', () => {
    const transfer = warehouseService.createTransfer({
      sourceBranchId: 'branch-hq',
      targetBranchId: 'branch-sr',
      notes: 'Monthly batch replenishment for Siem Reap clinic',
      items: [{ batchId: 'batch-1', quantity: 50 }],
    });

    assert.ok(transfer.id);
    assert.ok(transfer.transferCode.startsWith('TRF-'));
    assert.equal(transfer.manifestBarcode, transfer.transferCode.replace(/-/g, ''));
    assert.equal(transfer.status, 'DRAFT');
    assert.equal(transfer.totalUnits, 50);
    assert.equal(transfer.items.length, 1);
  });

  it('should dispatch transfer with barcode confirmation and deduct source stock', () => {
    const batchesBefore = warehouseService.getInventoryBatches('branch-hq');
    const pcmBatch = batchesBefore.find((b) => b.id === 'batch-1');
    assert.ok(pcmBatch);
    const initialQty = pcmBatch.quantity;

    const transfer = warehouseService.createTransfer({
      sourceBranchId: 'branch-hq',
      targetBranchId: 'branch-bkk',
      items: [{ batchId: 'batch-1', quantity: 30 }],
    });

    // Attempt dispatch with invalid barcode
    assert.throws(
      () => warehouseService.dispatchTransfer(transfer.id, 'Chivorn Meng', 'INVALID_BARCODE'),
      /barcode/i,
    );

    // Dispatch with valid barcode
    const dispatched = warehouseService.dispatchTransfer(
      transfer.id,
      'Chivorn Meng',
      transfer.manifestBarcode,
    );
    assert.equal(dispatched.status, 'IN_TRANSIT');
    assert.equal(dispatched.dispatchedBy, 'Chivorn Meng');
    assert.ok(dispatched.dispatchedAt);

    // Verify stock deducted
    const batchesAfter = warehouseService.getInventoryBatches('branch-hq');
    const pcmAfter = batchesAfter.find((b) => b.id === 'batch-1');
    assert.equal(pcmAfter.quantity, initialQty - 30);
  });

  it('should perform inbound barcode scanning verification, detect discrepancies, and credit destination stock', () => {
    // We use the seeded in-transit transfer: 'TRF-2026-0098'
    const seedTransfer = warehouseService.getTransferById('TRF-2026-0098');
    assert.equal(seedTransfer.status, 'IN_TRANSIT');

    // Attempt receive with mismatched barcode scan
    assert.throws(
      () =>
        warehouseService.verifyAndReceiveTransfer(seedTransfer.id, {
          receivedBy: 'Pharmacist - Srey Neat',
          scannedManifestBarcode: 'WRONG_BARCODE_SCAN',
          items: [],
        }),
      /Verification barcode mismatch/i,
    );

    // Perform successful inbound verification with 1 missing box discrepancy
    const received = warehouseService.verifyAndReceiveTransfer(seedTransfer.id, {
      receivedBy: 'Pharmacist - Srey Neat',
      scannedManifestBarcode: seedTransfer.manifestBarcode,
      discrepancyNote: 'Outer carton slightly wet; 1 vial broken during transport',
      items: [
        {
          batchNumber: 'BAT-AMX-2402',
          scannedBarcode: '8841001002',
          verifiedQuantity: 49, // Dispatched 50, received 49
        },
      ],
    });

    assert.equal(received.status, 'RECEIVED');
    assert.equal(received.receivedBy, 'Pharmacist - Srey Neat');
    assert.ok(received.receivedAt);
    assert.ok(received.discrepancyNote.includes('Dispatched 50, Received 49'));

    // Check that target branch (branch-tk) has the new stock credited
    const tkBatches = warehouseService.getInventoryBatches('branch-tk');
    const amxBatch = tkBatches.find((b) => b.batchNumber === 'BAT-AMX-2402');
    assert.ok(amxBatch);
    assert.equal(amxBatch.quantity, 49);
  });

  it('should reject receipt of a transfer that is not IN_TRANSIT', () => {
    const draft = warehouseService.createTransfer({
      sourceBranchId: 'branch-hq',
      targetBranchId: 'branch-tk',
      items: [{ batchId: 'batch-1', quantity: 10 }],
    });

    assert.throws(
      () =>
        warehouseService.verifyAndReceiveTransfer(draft.id, {
          receivedBy: 'Nurse Sophea',
          scannedManifestBarcode: draft.manifestBarcode,
          items: [],
        }),
      /Only transfers in IN_TRANSIT status can be received/i,
    );
  });
});
