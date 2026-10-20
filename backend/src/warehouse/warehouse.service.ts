import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';

export type TransferStatus = 'DRAFT' | 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
export type ExpirySeverity = 'CRITICAL_EXPIRED' | 'CRITICAL_30_DAYS' | 'WARNING_60_DAYS' | 'NOTICE_90_DAYS' | 'HEALTHY';

export interface Branch {
  id: string;
  branchCode: string;
  nameEn: string;
  nameKh: string;
  isWarehouse: boolean;
  phone: string;
  addressEn: string;
  addressKh: string;
  status: 'ACTIVE' | 'INACTIVE';
  managerName?: string;
}

export interface InventoryBatch {
  id: string;
  branchId: string;
  medicineId: string;
  medicineName: string;
  genericName: string;
  sku: string;
  batchNumber: string;
  barcode: string;
  quantity: number;
  unit: string;
  costPriceUsd: number;
  salePriceUsd: number;
  manufacturingDate: string;
  expirationDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DEPLETED' | 'QUARANTINE';
  daysUntilExpiration: number;
  expirySeverity: ExpirySeverity;
}

export interface TransferItem {
  id: string;
  medicineId: string;
  medicineName: string;
  sku: string;
  batchNumber: string;
  barcode: string;
  requestedQty: number;
  dispatchedQty: number;
  receivedQty?: number;
  unit: string;
  expirationDate: string;
  unitCostUsd: number;
}

export interface StockTransferManifest {
  id: string;
  transferCode: string;
  manifestBarcode: string;
  sourceBranchId: string;
  sourceBranchNameEn: string;
  targetBranchId: string;
  targetBranchNameEn: string;
  status: TransferStatus;
  notes?: string;
  discrepancyNote?: string;
  dispatchedBy?: string;
  dispatchedAt?: string;
  receivedBy?: string;
  receivedAt?: string;
  createdAt: string;
  items: TransferItem[];
  totalUnits: number;
  totalValuationUsd: number;
}

export interface CreateTransferDto {
  sourceBranchId: string;
  targetBranchId: string;
  notes?: string;
  autoDispatch?: boolean;
  dispatchedBy?: string;
  items: Array<{
    batchId: string;
    quantity: number;
  }>;
}

export interface InboundVerificationDto {
  receivedBy: string;
  scannedManifestBarcode: string;
  items: Array<{
    batchNumber: string;
    scannedBarcode: string;
    verifiedQuantity: number;
  }>;
  discrepancyNote?: string;
}

export interface HqWarehouseOverview {
  totalValuationUsd: number;
  totalValuationKhr: number;
  totalStockUnits: number;
  totalBatchesCount: number;
  branchesCount: number;
  transfersInTransitCount: number;
  expiryAlerts: {
    expiredCount: number;
    within30DaysCount: number;
    within60DaysCount: number;
    within90DaysCount: number;
    healthyCount: number;
  };
  lowStockBatches: InventoryBatch[];
  branchBreakdown: Array<{
    branchId: string;
    branchCode: string;
    nameEn: string;
    nameKh: string;
    isWarehouse: boolean;
    totalStockUnits: number;
    valuationUsd: number;
    batchesCount: number;
    criticalAlertsCount: number;
  }>;
}

export class WarehouseService {
  private readonly prisma: PrismaService;

  private branches: Branch[] = [
    {
      id: 'branch-hq',
      branchCode: 'BR-HQ',
      nameEn: 'Rotana Central Medical Depot & HQ',
      nameKh: 'ឃ្លាំងឱសថកណ្តាលរតនា និងទីស្នាក់ការ',
      isWarehouse: true,
      phone: '023 880 101',
      addressEn: 'Building 12, Monivong Blvd, Phnom Penh',
      addressKh: 'អគារ ១២ មហាវិថីព្រះមុនីវង្ស រាជធានីភ្នំពេញ',
      status: 'ACTIVE',
      managerName: 'Chivorn Meng',
    },
    {
      id: 'branch-tk',
      branchCode: 'BR-TK',
      nameEn: 'Rotana Clinic Toul Kork',
      nameKh: 'គ្លីនិករតនា សាខាទួលគោក',
      isWarehouse: false,
      phone: '023 880 102',
      addressEn: 'St 315, Sangkat Boeng Kak 1, Khan Toul Kork, Phnom Penh',
      addressKh: 'ផ្លូវ ៣១៥ សង្កាត់បឹងកក់ ១ ខណ្ឌទួលគោក រាជធានីភ្នំពេញ',
      status: 'ACTIVE',
      managerName: 'Dr. Keo Samnang',
    },
    {
      id: 'branch-bkk',
      branchCode: 'BR-BKK',
      nameEn: 'Rotana Clinic BKK1',
      nameKh: 'គ្លីនិករតនា សាខាបឹងកេងកង',
      isWarehouse: false,
      phone: '023 880 103',
      addressEn: 'St 51 corner St 302, BKK1, Phnom Penh',
      addressKh: 'ផ្លូវ ៥១ កែងផ្លូវ ៣០២ បឹងកេងកង ១ រាជធានីភ្នំពេញ',
      status: 'ACTIVE',
      managerName: 'Dr. Sovannary Pich',
    },
    {
      id: 'branch-sr',
      branchCode: 'BR-SR',
      nameEn: 'Rotana Clinic Siem Reap',
      nameKh: 'គ្លីនិករតនា សាខាសៀមរាប',
      isWarehouse: false,
      phone: '063 960 104',
      addressEn: 'Sivutha Blvd, Svay Dangkum, Siem Reap',
      addressKh: 'មហាវិថីសីវត្ថា សង្កាត់ស្វាយដង្គំ ក្រុងសៀមរាប',
      status: 'ACTIVE',
      managerName: 'Dr. Chan Voleak',
    },
  ];

  private batches: InventoryBatch[] = [];
  private transfers: StockTransferManifest[] = [];
  private transferCounter = 100;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
    this.seedInitialInventory();
  }

  private seedInitialInventory() {
    const today = new Date();

    const addDays = (days: number): string => {
      const d = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    };

    const initialBatchesData: Array<Omit<InventoryBatch, 'id' | 'daysUntilExpiration' | 'expirySeverity'>> = [
      {
        branchId: 'branch-hq',
        medicineId: 'med-pcm-500',
        medicineName: 'Paracetamol 500mg Tablets',
        genericName: 'Paracetamol',
        sku: 'MED-PCM-500',
        batchNumber: 'BAT-PCM-2401',
        barcode: '8841001001',
        quantity: 1200,
        unit: 'Box (100 tabs)',
        costPriceUsd: 1.20,
        salePriceUsd: 2.50,
        manufacturingDate: addDays(-300),
        expirationDate: addDays(450),
        status: 'ACTIVE',
      },
      {
        branchId: 'branch-hq',
        medicineId: 'med-amx-500',
        medicineName: 'Amoxicillin 500mg Capsules',
        genericName: 'Amoxicillin',
        sku: 'MED-AMX-500',
        batchNumber: 'BAT-AMX-2402',
        barcode: '8841001002',
        quantity: 850,
        unit: 'Box (100 caps)',
        costPriceUsd: 3.50,
        salePriceUsd: 6.00,
        manufacturingDate: addDays(-200),
        expirationDate: addDays(75), // Within 90 days notice
        status: 'ACTIVE',
      },
      {
        branchId: 'branch-hq',
        medicineId: 'med-ctx-1g',
        medicineName: 'Ceftriaxone 1g Powder for Injection',
        genericName: 'Ceftriaxone',
        sku: 'MED-CTX-1G',
        batchNumber: 'BAT-CTX-2403',
        barcode: '8841001003',
        quantity: 420,
        unit: 'Vial',
        costPriceUsd: 4.00,
        salePriceUsd: 8.50,
        manufacturingDate: addDays(-400),
        expirationDate: addDays(25), // Critical within 30 days
        status: 'ACTIVE',
      },
      {
        branchId: 'branch-hq',
        medicineId: 'med-omp-20',
        medicineName: 'Omeprazole 20mg Delayed-Release',
        genericName: 'Omeprazole',
        sku: 'MED-OMP-20',
        batchNumber: 'BAT-OMP-2404',
        barcode: '8841001004',
        quantity: 600,
        unit: 'Box (28 caps)',
        costPriceUsd: 2.10,
        salePriceUsd: 4.80,
        manufacturingDate: addDays(-180),
        expirationDate: addDays(55), // Within 60 days warning
        status: 'ACTIVE',
      },
      {
        branchId: 'branch-hq',
        medicineId: 'med-azm-250',
        medicineName: 'Azithromycin 250mg Tablets',
        genericName: 'Azithromycin',
        sku: 'MED-AZM-250',
        batchNumber: 'BAT-AZM-2405',
        barcode: '8841001005',
        quantity: 350,
        unit: 'Box (6 tabs)',
        costPriceUsd: 3.20,
        salePriceUsd: 7.00,
        manufacturingDate: addDays(-100),
        expirationDate: addDays(360),
        status: 'ACTIVE',
      },
      {
        branchId: 'branch-tk',
        medicineId: 'med-pcm-500',
        medicineName: 'Paracetamol 500mg Tablets',
        genericName: 'Paracetamol',
        sku: 'MED-PCM-500',
        batchNumber: 'BAT-PCM-2401',
        barcode: '8841001001',
        quantity: 140,
        unit: 'Box (100 tabs)',
        costPriceUsd: 1.20,
        salePriceUsd: 2.50,
        manufacturingDate: addDays(-300),
        expirationDate: addDays(450),
        status: 'ACTIVE',
      },
      {
        branchId: 'branch-tk',
        medicineId: 'med-met-500',
        medicineName: 'Metformin 500mg Tablets',
        genericName: 'Metformin',
        sku: 'MED-MET-500',
        batchNumber: 'BAT-MET-2406',
        barcode: '8841001006',
        quantity: 80,
        unit: 'Box (100 tabs)',
        costPriceUsd: 2.00,
        salePriceUsd: 4.00,
        manufacturingDate: addDays(-350),
        expirationDate: addDays(-10), // Expired!
        status: 'EXPIRED',
      },
      {
        branchId: 'branch-bkk',
        medicineId: 'med-pcm-500',
        medicineName: 'Paracetamol 500mg Tablets',
        genericName: 'Paracetamol',
        sku: 'MED-PCM-500',
        batchNumber: 'BAT-PCM-2401',
        barcode: '8841001001',
        quantity: 90,
        unit: 'Box (100 tabs)',
        costPriceUsd: 1.20,
        salePriceUsd: 2.50,
        manufacturingDate: addDays(-300),
        expirationDate: addDays(450),
        status: 'ACTIVE',
      },
      {
        branchId: 'branch-bkk',
        medicineId: 'med-ns-500',
        medicineName: 'Normal Saline 0.9% IV Infusion',
        genericName: 'Sodium Chloride 0.9%',
        sku: 'MED-NS-500',
        batchNumber: 'BAT-NS-2407',
        barcode: '8841001007',
        quantity: 15, // Low stock threshold (<20)
        unit: 'Bottle (500ml)',
        costPriceUsd: 0.90,
        salePriceUsd: 3.00,
        manufacturingDate: addDays(-120),
        expirationDate: addDays(600),
        status: 'ACTIVE',
      },
      {
        branchId: 'branch-sr',
        medicineId: 'med-dic-50',
        medicineName: 'Diclofenac Potassium 50mg Tablets',
        genericName: 'Diclofenac',
        sku: 'MED-DIC-50',
        batchNumber: 'BAT-DIC-2408',
        barcode: '8841001008',
        quantity: 65,
        unit: 'Box (50 tabs)',
        costPriceUsd: 2.30,
        salePriceUsd: 5.50,
        manufacturingDate: addDays(-140),
        expirationDate: addDays(40), // Warning within 60 days
        status: 'ACTIVE',
      },
    ];

    this.batches = initialBatchesData.map((b, idx) => {
      const daysLeft = this.calculateDaysUntil(b.expirationDate);
      const severity = this.determineExpirySeverity(daysLeft);
      return {
        ...b,
        id: `batch-${idx + 1}`,
        daysUntilExpiration: daysLeft,
        expirySeverity: severity,
      };
    });

    // Seed one in-transit transfer demo
    const transferManifestCode = 'TRF-2026-0098';
    this.transfers.push({
      id: 'trf-seed-1',
      transferCode: transferManifestCode,
      manifestBarcode: `TRF20260098`,
      sourceBranchId: 'branch-hq',
      sourceBranchNameEn: 'Rotana Central Medical Depot & HQ',
      targetBranchId: 'branch-tk',
      targetBranchNameEn: 'Rotana Clinic Toul Kork',
      status: 'IN_TRANSIT',
      notes: 'Urgent antibiotic and IV replenishment for Toul Kork outpatient department',
      dispatchedBy: 'Warehouse Dispatcher - Chivorn',
      dispatchedAt: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(today.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      totalUnits: 50,
      totalValuationUsd: 175.00,
      items: [
        {
          id: 'trf-item-1',
          medicineId: 'med-amx-500',
          medicineName: 'Amoxicillin 500mg Capsules',
          sku: 'MED-AMX-500',
          batchNumber: 'BAT-AMX-2402',
          barcode: '8841001002',
          requestedQty: 50,
          dispatchedQty: 50,
          unit: 'Box (100 caps)',
          expirationDate: addDays(75),
          unitCostUsd: 3.50,
        },
      ],
    });
  }

  calculateDaysUntil(dateString: string): number {
    const target = new Date(dateString);
    const now = new Date();
    // Normalize to midnight UTC for date calculation
    const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
    const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.floor((utcTarget - utcNow) / (1000 * 60 * 60 * 24));
  }

  determineExpirySeverity(daysLeft: number): ExpirySeverity {
    if (daysLeft <= 0) return 'CRITICAL_EXPIRED';
    if (daysLeft <= 30) return 'CRITICAL_30_DAYS';
    if (daysLeft <= 60) return 'WARNING_60_DAYS';
    if (daysLeft <= 90) return 'NOTICE_90_DAYS';
    return 'HEALTHY';
  }

  getAllBranches(): Branch[] {
    return [...this.branches];
  }

  getBranchById(branchId: string): Branch {
    const branch = this.branches.find((b) => b.id === branchId || b.branchCode === branchId);
    if (!branch) {
      throw new NotFoundException(`Branch with identifier ${branchId} was not found.`);
    }
    return branch;
  }

  getInventoryBatches(branchId?: string): InventoryBatch[] {
    let list = this.batches;
    if (branchId) {
      list = list.filter((b) => b.branchId === branchId);
    }
    // Re-evaluate daysUntilExpiration dynamically
    return list.map((b) => {
      const days = this.calculateDaysUntil(b.expirationDate);
      return {
        ...b,
        daysUntilExpiration: days,
        expirySeverity: this.determineExpirySeverity(days),
      };
    });
  }

  getExpiringBatches(branchId?: string, thresholdDays = 90): {
    batches: InventoryBatch[];
    summary: {
      expiredCount: number;
      within30DaysCount: number;
      within60DaysCount: number;
      within90DaysCount: number;
      totalExpiring: number;
    };
  } {
    const all = this.getInventoryBatches(branchId);
    // Sort strictly by FEFO (First Expired First Out)
    const sorted = all.sort(
      (a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime(),
    );

    const expiringBatches = sorted.filter(
      (b) => b.daysUntilExpiration <= thresholdDays || b.expirySeverity === 'CRITICAL_EXPIRED',
    );

    const expiredCount = expiringBatches.filter((b) => b.daysUntilExpiration <= 0).length;
    const within30DaysCount = expiringBatches.filter(
      (b) => b.daysUntilExpiration > 0 && b.daysUntilExpiration <= 30,
    ).length;
    const within60DaysCount = expiringBatches.filter(
      (b) => b.daysUntilExpiration > 30 && b.daysUntilExpiration <= 60,
    ).length;
    const within90DaysCount = expiringBatches.filter(
      (b) => b.daysUntilExpiration > 60 && b.daysUntilExpiration <= 90,
    ).length;

    return {
      batches: expiringBatches,
      summary: {
        expiredCount,
        within30DaysCount,
        within60DaysCount,
        within90DaysCount,
        totalExpiring: expiringBatches.length,
      },
    };
  }

  createTransfer(dto: CreateTransferDto): StockTransferManifest {
    const sourceBranch = this.getBranchById(dto.sourceBranchId);
    const targetBranch = this.getBranchById(dto.targetBranchId);

    if (sourceBranch.id === targetBranch.id) {
      throw new BadRequestException('Source and target branches cannot be the same.');
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Transfer must contain at least one item.');
    }

    this.transferCounter++;
    const currentYear = new Date().getFullYear();
    const transferCode = `TRF-${currentYear}-${String(this.transferCounter).padStart(4, '0')}`;
    const manifestBarcode = transferCode.replace(/-/g, '');

    const transferItems: TransferItem[] = [];
    let totalUnits = 0;
    let totalValuationUsd = 0;

    for (const itemInput of dto.items) {
      const sourceBatch = this.batches.find(
        (b) => b.id === itemInput.batchId && b.branchId === sourceBranch.id,
      );

      if (!sourceBatch) {
        throw new NotFoundException(
          `Batch ${itemInput.batchId} not found in source branch ${sourceBranch.nameEn}.`,
        );
      }

      if (itemInput.quantity <= 0) {
        throw new BadRequestException('Transfer item quantity must be greater than zero.');
      }

      if (sourceBatch.quantity < itemInput.quantity) {
        throw new BadRequestException(
          `Insufficient stock in ${sourceBatch.medicineName} (${sourceBatch.batchNumber}). Available: ${sourceBatch.quantity}, Requested: ${itemInput.quantity}.`,
        );
      }

      const itemCost = sourceBatch.costPriceUsd * itemInput.quantity;
      totalUnits += itemInput.quantity;
      totalValuationUsd += itemCost;

      transferItems.push({
        id: `trf-item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        medicineId: sourceBatch.medicineId,
        medicineName: sourceBatch.medicineName,
        sku: sourceBatch.sku,
        batchNumber: sourceBatch.batchNumber,
        barcode: sourceBatch.barcode,
        requestedQty: itemInput.quantity,
        dispatchedQty: dto.autoDispatch ? itemInput.quantity : 0,
        unit: sourceBatch.unit,
        expirationDate: sourceBatch.expirationDate,
        unitCostUsd: sourceBatch.costPriceUsd,
      });

      if (dto.autoDispatch) {
        sourceBatch.quantity -= itemInput.quantity;
        if (sourceBatch.quantity === 0) {
          sourceBatch.status = 'DEPLETED';
        }
      }
    }

    const nowIso = new Date().toISOString();
    const manifest: StockTransferManifest = {
      id: `trf-${Date.now()}`,
      transferCode,
      manifestBarcode,
      sourceBranchId: sourceBranch.id,
      sourceBranchNameEn: sourceBranch.nameEn,
      targetBranchId: targetBranch.id,
      targetBranchNameEn: targetBranch.nameEn,
      status: dto.autoDispatch ? 'IN_TRANSIT' : 'DRAFT',
      notes: dto.notes,
      dispatchedBy: dto.autoDispatch ? (dto.dispatchedBy || 'HQ Central Dispatch') : undefined,
      dispatchedAt: dto.autoDispatch ? nowIso : undefined,
      createdAt: nowIso,
      items: transferItems,
      totalUnits,
      totalValuationUsd: Math.round(totalValuationUsd * 100) / 100,
    };

    this.transfers.unshift(manifest);
    return manifest;
  }

  dispatchTransfer(
    transferId: string,
    dispatchedBy: string,
    scannedBarcode?: string,
  ): StockTransferManifest {
    const transfer = this.transfers.find(
      (t) => t.id === transferId || t.transferCode === transferId || t.manifestBarcode === transferId,
    );

    if (!transfer) {
      throw new NotFoundException(`Transfer manifest ${transferId} was not found.`);
    }

    if (transfer.status !== 'DRAFT') {
      throw new BadRequestException(
        `Transfer is currently in status ${transfer.status} and cannot be dispatched.`,
      );
    }

    if (scannedBarcode && scannedBarcode !== transfer.manifestBarcode && scannedBarcode !== transfer.transferCode) {
      throw new BadRequestException(
        `Scanned barcode ${scannedBarcode} does not match transfer manifest ${transfer.manifestBarcode}.`,
      );
    }

    // Deduct stock from source branch
    for (const item of transfer.items) {
      const sourceBatch = this.batches.find(
        (b) =>
          b.branchId === transfer.sourceBranchId &&
          b.batchNumber === item.batchNumber &&
          b.medicineId === item.medicineId,
      );

      if (!sourceBatch || sourceBatch.quantity < item.requestedQty) {
        throw new BadRequestException(
          `Insufficient stock at dispatch time for ${item.medicineName} (Batch: ${item.batchNumber}).`,
        );
      }

      sourceBatch.quantity -= item.requestedQty;
      if (sourceBatch.quantity === 0) {
        sourceBatch.status = 'DEPLETED';
      }
      item.dispatchedQty = item.requestedQty;
    }

    transfer.status = 'IN_TRANSIT';
    transfer.dispatchedBy = dispatchedBy;
    transfer.dispatchedAt = new Date().toISOString();

    return transfer;
  }

  verifyAndReceiveTransfer(
    transferId: string,
    verification: InboundVerificationDto,
  ): StockTransferManifest {
    const transfer = this.transfers.find(
      (t) => t.id === transferId || t.transferCode === transferId || t.manifestBarcode === transferId,
    );

    if (!transfer) {
      throw new NotFoundException(`Transfer manifest ${transferId} was not found.`);
    }

    if (transfer.status !== 'IN_TRANSIT') {
      throw new BadRequestException(
        `Only transfers in IN_TRANSIT status can be received. Current status: ${transfer.status}.`,
      );
    }

    // Barcode verification guard
    const cleanScan = verification.scannedManifestBarcode.trim().toUpperCase();
    const validManifest = transfer.manifestBarcode.toUpperCase();
    const validCode = transfer.transferCode.toUpperCase();

    if (cleanScan !== validManifest && cleanScan !== validCode) {
      throw new BadRequestException(
        `Verification barcode mismatch: Scanned [${cleanScan}] does not match Manifest [${validManifest}].`,
      );
    }

    const discrepancies: string[] = [];

    // Credit stock into target branch
    for (const item of transfer.items) {
      const verified = verification.items?.find((v) => v.batchNumber === item.batchNumber);
      const receivedQty = verified !== undefined ? verified.verifiedQuantity : item.dispatchedQty;

      item.receivedQty = receivedQty;

      if (receivedQty !== item.dispatchedQty) {
        discrepancies.push(
          `${item.medicineName} (${item.batchNumber}): Dispatched ${item.dispatchedQty}, Received ${receivedQty}`,
        );
      }

      if (receivedQty > 0) {
        let destBatch = this.batches.find(
          (b) =>
            b.branchId === transfer.targetBranchId &&
            b.batchNumber === item.batchNumber &&
            b.medicineId === item.medicineId,
        );

        if (destBatch) {
          destBatch.quantity += receivedQty;
          if (destBatch.status === 'DEPLETED') {
            destBatch.status = 'ACTIVE';
          }
        } else {
          // Create new batch record at destination branch
          const daysLeft = this.calculateDaysUntil(item.expirationDate);
          destBatch = {
            id: `batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            branchId: transfer.targetBranchId,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            genericName: item.medicineName.split(' ')[0],
            sku: item.sku,
            batchNumber: item.batchNumber,
            barcode: item.barcode,
            quantity: receivedQty,
            unit: item.unit,
            costPriceUsd: item.unitCostUsd,
            salePriceUsd: item.unitCostUsd * 1.8,
            manufacturingDate: new Date().toISOString().split('T')[0],
            expirationDate: item.expirationDate,
            status: 'ACTIVE',
            daysUntilExpiration: daysLeft,
            expirySeverity: this.determineExpirySeverity(daysLeft),
          };
          this.batches.push(destBatch);
        }
      }
    }

    transfer.status = 'RECEIVED';
    transfer.receivedBy = verification.receivedBy;
    transfer.receivedAt = new Date().toISOString();

    if (discrepancies.length > 0 || verification.discrepancyNote) {
      const combined = [
        ...discrepancies,
        verification.discrepancyNote ? `Note: ${verification.discrepancyNote}` : '',
      ]
        .filter(Boolean)
        .join('; ');
      transfer.discrepancyNote = combined;
    }

    return transfer;
  }

  getAllTransfers(filters?: {
    branchId?: string;
    status?: TransferStatus;
  }): StockTransferManifest[] {
    let list = [...this.transfers];
    if (filters?.branchId) {
      list = list.filter(
        (t) => t.sourceBranchId === filters.branchId || t.targetBranchId === filters.branchId,
      );
    }
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status);
    }
    return list;
  }

  getTransferById(transferId: string): StockTransferManifest {
    const transfer = this.transfers.find(
      (t) => t.id === transferId || t.transferCode === transferId || t.manifestBarcode === transferId,
    );
    if (!transfer) {
      throw new NotFoundException(`Stock transfer ${transferId} was not found.`);
    }
    return transfer;
  }

  getHqWarehouseOverview(): HqWarehouseOverview {
    const exchangeRateKhr = 4100;
    const allBatches = this.getInventoryBatches();

    let totalValuationUsd = 0;
    let totalStockUnits = 0;

    for (const b of allBatches) {
      if (b.status === 'ACTIVE') {
        totalValuationUsd += b.quantity * b.costPriceUsd;
        totalStockUnits += b.quantity;
      }
    }

    const expiring = this.getExpiringBatches();
    const lowStockBatches = allBatches.filter((b) => b.quantity > 0 && b.quantity <= 20);
    const transfersInTransit = this.transfers.filter((t) => t.status === 'IN_TRANSIT').length;

    const branchBreakdown = this.branches.map((br) => {
      const branchBatches = allBatches.filter((b) => b.branchId === br.id);
      let brValuation = 0;
      let brUnits = 0;
      let criticalAlerts = 0;

      for (const b of branchBatches) {
        if (b.status === 'ACTIVE') {
          brValuation += b.quantity * b.costPriceUsd;
          brUnits += b.quantity;
        }
        if (b.expirySeverity === 'CRITICAL_EXPIRED' || b.expirySeverity === 'CRITICAL_30_DAYS') {
          criticalAlerts++;
        }
      }

      return {
        branchId: br.id,
        branchCode: br.branchCode,
        nameEn: br.nameEn,
        nameKh: br.nameKh,
        isWarehouse: br.isWarehouse,
        totalStockUnits: brUnits,
        valuationUsd: Math.round(brValuation * 100) / 100,
        batchesCount: branchBatches.length,
        criticalAlertsCount: criticalAlerts,
      };
    });

    return {
      totalValuationUsd: Math.round(totalValuationUsd * 100) / 100,
      totalValuationKhr: Math.round(totalValuationUsd * exchangeRateKhr),
      totalStockUnits,
      totalBatchesCount: allBatches.length,
      branchesCount: this.branches.length,
      transfersInTransitCount: transfersInTransit,
      expiryAlerts: {
        expiredCount: expiring.summary.expiredCount,
        within30DaysCount: expiring.summary.within30DaysCount,
        within60DaysCount: expiring.summary.within60DaysCount,
        within90DaysCount: expiring.summary.within90DaysCount,
        healthyCount: allBatches.length - expiring.summary.totalExpiring,
      },
      lowStockBatches,
      branchBreakdown,
    };
  }
}
