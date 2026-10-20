export interface ExpenseEntry {
  id: string;
  date: string;
  category: 'RENT' | 'UTILITIES' | 'SALARIES' | 'SUPPLIES' | 'MAINTENANCE' | 'MARKETING' | 'OTHER';
  description: string;
  amountUsd: number;
  amountKhr: number;
  receiptRef: string;
  paymentMethod: 'CASH' | 'KHQR' | 'BANK_TRANSFER';
  approvedBy: string;
  createdAt: string;
}

export interface DoctorCommissionRule {
  doctorId: string;
  doctorName: string;
  specialty: string;
  consultationSplitPct: number;
  procedureSplitPct: number;
  labReferralPct: number;
  fixedAllowanceMonthlyUsd: number;
  bankAccountBakong?: string;
}

export interface ClinicalActivity {
  id: string;
  date: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  type: 'CONSULTATION' | 'PROCEDURE' | 'LAB_ORDER' | 'IPD_CARE';
  serviceName: string;
  chargeAmountUsd: number;
  drugCostUsd: number;
  consumableCostUsd: number;
  invoiceId: string;
}

export interface CommissionStatement {
  statementId: string;
  period: string; // YYYY-MM
  doctorId: string;
  doctorName: string;
  specialty: string;
  totalPatients: number;
  totalChargesUsd: number;
  consultationFeeTotalUsd: number;
  consultationCommissionUsd: number;
  procedureFeeTotalUsd: number;
  procedureCommissionUsd: number;
  labFeeTotalUsd: number;
  labCommissionUsd: number;
  fixedAllowanceUsd: number;
  totalCommissionUsd: number;
  totalCommissionKhr: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentRef?: string;
}

export interface PnlStatement {
  period: string;
  exchangeRate: number;
  revenue: {
    consultationUsd: number;
    pharmacyUsd: number;
    labUsd: number;
    proceduresUsd: number;
    ipdUsd: number;
    totalRevenueUsd: number;
    totalRevenueKhr: number;
  };
  cogs: {
    drugsWholesaleUsd: number;
    labReagentsUsd: number;
    consumablesUsd: number;
    totalCogsUsd: number;
    totalCogsKhr: number;
  };
  grossProfit: {
    amountUsd: number;
    amountKhr: number;
    marginPct: number;
  };
  opex: {
    doctorCommissionsUsd: number;
    staffSalariesUsd: number;
    rentUtilitiesUsd: number;
    clinicOverheadsUsd: number;
    totalOpexUsd: number;
    totalOpexKhr: number;
  };
  netOperatingIncome: {
    amountUsd: number;
    amountKhr: number;
    marginPct: number;
  };
}

export interface CreateExpenseDto {
  date?: string;
  category: 'RENT' | 'UTILITIES' | 'SALARIES' | 'SUPPLIES' | 'MAINTENANCE' | 'MARKETING' | 'OTHER';
  description: string;
  amountUsd: number;
  receiptRef?: string;
  paymentMethod?: 'CASH' | 'KHQR' | 'BANK_TRANSFER';
  approvedBy: string;
}

export class FinanceService {
  private readonly exchangeRate = 4100;

  private expenses: ExpenseEntry[] = [
    {
      id: 'EXP-101',
      date: '2026-10-01',
      category: 'RENT',
      description: 'Clinic Building Monthly Lease Phnom Penh Branch',
      amountUsd: 1500.0,
      amountKhr: 1500.0 * 4100,
      receiptRef: 'RCP-LEASE-202610',
      paymentMethod: 'BANK_TRANSFER',
      approvedBy: 'Dr. Seng Chanthou',
      createdAt: '2026-10-01T08:00:00Z'
    },
    {
      id: 'EXP-102',
      date: '2026-10-05',
      category: 'UTILITIES',
      description: 'Electricity and Clean Water Utility Bills EDC',
      amountUsd: 380.0,
      amountKhr: 380.0 * 4100,
      receiptRef: 'EDC-BILL-77291',
      paymentMethod: 'KHQR',
      approvedBy: 'Accountant Sokha',
      createdAt: '2026-10-05T10:30:00Z'
    },
    {
      id: 'EXP-103',
      date: '2026-10-10',
      category: 'SUPPLIES',
      description: 'Disposable Syringes, Gloves and Antiseptic Consumables',
      amountUsd: 420.0,
      amountKhr: 420.0 * 4100,
      receiptRef: 'INV-MEDSUP-449',
      paymentMethod: 'KHQR',
      approvedBy: 'Dr. Seng Chanthou',
      createdAt: '2026-10-10T14:15:00Z'
    },
    {
      id: 'EXP-104',
      date: '2026-10-15',
      category: 'SALARIES',
      description: 'Mid-Month Support Staff and Nursing Payroll Advance',
      amountUsd: 1200.0,
      amountKhr: 1200.0 * 4100,
      receiptRef: 'PAY-STAFF-10A',
      paymentMethod: 'BANK_TRANSFER',
      approvedBy: 'Dr. Seng Chanthou',
      createdAt: '2026-10-15T09:00:00Z'
    }
  ];

  private doctorRules: DoctorCommissionRule[] = [
    {
      doctorId: 'DOC-101',
      doctorName: 'Dr. Seng Chanthou',
      specialty: 'Internal Medicine',
      consultationSplitPct: 70, // 70% doctor, 30% clinic
      procedureSplitPct: 60,
      labReferralPct: 10,
      fixedAllowanceMonthlyUsd: 300,
      bankAccountBakong: 'seng_chanthou@bk'
    },
    {
      doctorId: 'DOC-102',
      doctorName: 'Dr. Chea Sovann',
      specialty: 'Pediatrics',
      consultationSplitPct: 65,
      procedureSplitPct: 50,
      labReferralPct: 10,
      fixedAllowanceMonthlyUsd: 250,
      bankAccountBakong: 'chea_sovann@bk'
    },
    {
      doctorId: 'DOC-103',
      doctorName: 'Dr. Heng Rotha',
      specialty: 'Radiology and Ultrasound',
      consultationSplitPct: 60,
      procedureSplitPct: 70, // Higher for ultrasound specialist
      labReferralPct: 15,
      fixedAllowanceMonthlyUsd: 400,
      bankAccountBakong: 'heng_rotha@bk'
    }
  ];

  private activities: ClinicalActivity[] = [
    {
      id: 'ACT-001',
      date: '2026-10-02',
      doctorId: 'DOC-101',
      patientId: 'PT-1001',
      patientName: 'Keo Samnang',
      type: 'CONSULTATION',
      serviceName: 'Specialist Internal Medicine Consultation',
      chargeAmountUsd: 25.0,
      drugCostUsd: 0,
      consumableCostUsd: 2.0,
      invoiceId: 'INV-202610-001'
    },
    {
      id: 'ACT-002',
      date: '2026-10-02',
      doctorId: 'DOC-101',
      patientId: 'PT-1001',
      patientName: 'Keo Samnang',
      type: 'PROCEDURE',
      serviceName: 'Electrocardiogram (ECG) 12-Lead',
      chargeAmountUsd: 15.0,
      drugCostUsd: 0,
      consumableCostUsd: 3.0,
      invoiceId: 'INV-202610-001'
    },
    {
      id: 'ACT-003',
      date: '2026-10-02',
      doctorId: 'DOC-101',
      patientId: 'PT-1001',
      patientName: 'Keo Samnang',
      type: 'LAB_ORDER',
      serviceName: 'Full Blood Count (CBC) and Lipid Profile',
      chargeAmountUsd: 20.0,
      drugCostUsd: 0,
      consumableCostUsd: 5.0,
      invoiceId: 'INV-202610-001'
    },
    {
      id: 'ACT-004',
      date: '2026-10-04',
      doctorId: 'DOC-102',
      patientId: 'PT-1002',
      patientName: 'Sok Vicheka',
      type: 'CONSULTATION',
      serviceName: 'General Pediatric Consultation',
      chargeAmountUsd: 20.0,
      drugCostUsd: 0,
      consumableCostUsd: 1.5,
      invoiceId: 'INV-202610-002'
    },
    {
      id: 'ACT-005',
      date: '2026-10-06',
      doctorId: 'DOC-103',
      patientId: 'PT-1003',
      patientName: 'Chan Monika',
      type: 'PROCEDURE',
      serviceName: 'Abdominal and Pelvic Ultrasound Scan',
      chargeAmountUsd: 35.0,
      drugCostUsd: 0,
      consumableCostUsd: 4.0,
      invoiceId: 'INV-202610-003'
    },
    {
      id: 'ACT-006',
      date: '2026-10-08',
      doctorId: 'DOC-101',
      patientId: 'PT-1004',
      patientName: 'Vong Dara',
      type: 'CONSULTATION',
      serviceName: 'Hypertension and Chronic Care Follow-up',
      chargeAmountUsd: 25.0,
      drugCostUsd: 0,
      consumableCostUsd: 2.0,
      invoiceId: 'INV-202610-004'
    },
    {
      id: 'ACT-007',
      date: '2026-10-12',
      doctorId: 'DOC-101',
      patientId: 'PT-1005',
      patientName: 'Chorn Rithy',
      type: 'PROCEDURE',
      serviceName: 'Minor Surgical Wound Debridement & Suturing',
      chargeAmountUsd: 50.0,
      drugCostUsd: 5.0,
      consumableCostUsd: 10.0,
      invoiceId: 'INV-202610-005'
    }
  ];

  private commissionStatements: CommissionStatement[] = [
    {
      statementId: 'CMS-202609-DOC101',
      period: '2026-09',
      doctorId: 'DOC-101',
      doctorName: 'Dr. Seng Chanthou',
      specialty: 'Internal Medicine',
      totalPatients: 84,
      totalChargesUsd: 2850.0,
      consultationFeeTotalUsd: 1650.0,
      consultationCommissionUsd: 1155.0, // 70% of 1650
      procedureFeeTotalUsd: 800.0,
      procedureCommissionUsd: 480.0, // 60% of 800
      labFeeTotalUsd: 400.0,
      labCommissionUsd: 40.0, // 10% of 400
      fixedAllowanceUsd: 300.0,
      totalCommissionUsd: 1975.0,
      totalCommissionKhr: 1975.0 * 4100,
      status: 'PAID',
      approvedBy: 'Executive Board',
      approvedAt: '2026-10-01T09:00:00Z',
      paidAt: '2026-10-02T11:30:00Z',
      paymentMethod: 'BAKONG_KHQR',
      paymentRef: 'TXN-BK-99182301'
    }
  ];

  getExchangeRate(): number {
    return this.exchangeRate;
  }

  getDoctorRules(): DoctorCommissionRule[] {
    return [...this.doctorRules];
  }

  getDoctorRuleById(doctorId: string): DoctorCommissionRule | undefined {
    return this.doctorRules.find(r => r.doctorId === doctorId);
  }

  updateDoctorRule(doctorId: string, updates: Partial<DoctorCommissionRule>): DoctorCommissionRule {
    const idx = this.doctorRules.findIndex(r => r.doctorId === doctorId);
    if (idx === -1) {
      const newRule: DoctorCommissionRule = {
        doctorId,
        doctorName: updates.doctorName || 'Doctor ' + doctorId,
        specialty: updates.specialty || 'General Practitioner',
        consultationSplitPct: updates.consultationSplitPct ?? 70,
        procedureSplitPct: updates.procedureSplitPct ?? 50,
        labReferralPct: updates.labReferralPct ?? 10,
        fixedAllowanceMonthlyUsd: updates.fixedAllowanceMonthlyUsd ?? 0,
        bankAccountBakong: updates.bankAccountBakong
      };
      this.doctorRules.push(newRule);
      return newRule;
    }
    this.doctorRules[idx] = { ...this.doctorRules[idx], ...updates };
    return this.doctorRules[idx];
  }

  calculateCommission(doctorId: string, period: string): CommissionStatement {
    const rule = this.getDoctorRuleById(doctorId);
    if (!rule) {
      throw new Error(`Doctor rule not found for doctor ID: ${doctorId}`);
    }

    const doctorActivities = this.activities.filter(a => {
      const matchesDoc = a.doctorId === doctorId;
      const matchesPeriod = a.date.startsWith(period);
      return matchesDoc && matchesPeriod;
    });

    const uniquePatients = new Set(doctorActivities.map(a => a.patientId)).size;

    let totalChargesUsd = 0;
    let consultationFeeTotalUsd = 0;
    let procedureFeeTotalUsd = 0;
    let labFeeTotalUsd = 0;

    for (const act of doctorActivities) {
      totalChargesUsd += act.chargeAmountUsd;
      if (act.type === 'CONSULTATION') {
        consultationFeeTotalUsd += act.chargeAmountUsd;
      } else if (act.type === 'PROCEDURE') {
        procedureFeeTotalUsd += act.chargeAmountUsd;
      } else if (act.type === 'LAB_ORDER') {
        labFeeTotalUsd += act.chargeAmountUsd;
      }
    }

    const consultationCommissionUsd = Math.round((consultationFeeTotalUsd * (rule.consultationSplitPct / 100)) * 100) / 100;
    const procedureCommissionUsd = Math.round((procedureFeeTotalUsd * (rule.procedureSplitPct / 100)) * 100) / 100;
    const labCommissionUsd = Math.round((labFeeTotalUsd * (rule.labReferralPct / 100)) * 100) / 100;
    const fixedAllowanceUsd = rule.fixedAllowanceMonthlyUsd;

    const totalCommissionUsd = Math.round((consultationCommissionUsd + procedureCommissionUsd + labCommissionUsd + fixedAllowanceUsd) * 100) / 100;
    const totalCommissionKhr = Math.round(totalCommissionUsd * this.exchangeRate);

    const statementId = `CMS-${period.replace('-', '')}-${doctorId.replace('-', '')}`;

    const statement: CommissionStatement = {
      statementId,
      period,
      doctorId,
      doctorName: rule.doctorName,
      specialty: rule.specialty,
      totalPatients: uniquePatients,
      totalChargesUsd: Math.round(totalChargesUsd * 100) / 100,
      consultationFeeTotalUsd: Math.round(consultationFeeTotalUsd * 100) / 100,
      consultationCommissionUsd,
      procedureFeeTotalUsd: Math.round(procedureFeeTotalUsd * 100) / 100,
      procedureCommissionUsd,
      labFeeTotalUsd: Math.round(labFeeTotalUsd * 100) / 100,
      labCommissionUsd,
      fixedAllowanceUsd,
      totalCommissionUsd,
      totalCommissionKhr,
      status: 'DRAFT'
    };

    const existingIdx = this.commissionStatements.findIndex(s => s.statementId === statementId);
    if (existingIdx !== -1) {
      if (this.commissionStatements[existingIdx].status !== 'PAID') {
        this.commissionStatements[existingIdx] = statement;
      }
      return this.commissionStatements[existingIdx];
    } else {
      this.commissionStatements.push(statement);
      return statement;
    }
  }

  getCommissionStatements(filter?: { doctorId?: string; period?: string }): CommissionStatement[] {
    return this.commissionStatements.filter(s => {
      if (filter?.doctorId && s.doctorId !== filter.doctorId) return false;
      if (filter?.period && s.period !== filter.period) return false;
      return true;
    });
  }

  getCommissionStatementById(statementId: string): CommissionStatement | undefined {
    return this.commissionStatements.find(s => s.statementId === statementId);
  }

  approveCommissionStatement(statementId: string, approvedBy: string): CommissionStatement {
    const statement = this.getCommissionStatementById(statementId);
    if (!statement) {
      throw new Error(`Statement not found: ${statementId}`);
    }
    if (statement.status === 'PAID') {
      throw new Error(`Statement is already paid: ${statementId}`);
    }
    statement.status = 'APPROVED';
    statement.approvedBy = approvedBy;
    statement.approvedAt = new Date().toISOString();
    return statement;
  }

  payoutCommissionStatement(
    statementId: string,
    paymentMethod: string,
    paymentRef: string
  ): CommissionStatement {
    const statement = this.getCommissionStatementById(statementId);
    if (!statement) {
      throw new Error(`Statement not found: ${statementId}`);
    }
    if (statement.status === 'PAID') {
      throw new Error(`Statement is already paid: ${statementId}`);
    }
    statement.status = 'PAID';
    statement.paymentMethod = paymentMethod;
    statement.paymentRef = paymentRef;
    statement.paidAt = new Date().toISOString();
    return statement;
  }

  recordExpense(dto: CreateExpenseDto): ExpenseEntry {
    const id = `EXP-${Date.now().toString().slice(-6)}`;
    const date = dto.date || new Date().toISOString().slice(0, 10);
    const amountUsd = Math.round(dto.amountUsd * 100) / 100;
    const amountKhr = Math.round(amountUsd * this.exchangeRate);

    const expense: ExpenseEntry = {
      id,
      date,
      category: dto.category,
      description: dto.description.trim(),
      amountUsd,
      amountKhr,
      receiptRef: dto.receiptRef || `RCP-${Date.now().toString().slice(-5)}`,
      paymentMethod: dto.paymentMethod || 'KHQR',
      approvedBy: dto.approvedBy,
      createdAt: new Date().toISOString()
    };

    this.expenses.push(expense);
    return expense;
  }

  getExpenses(filter?: { category?: string; startDate?: string; endDate?: string }): ExpenseEntry[] {
    return this.expenses.filter(e => {
      if (filter?.category && e.category !== filter.category) return false;
      if (filter?.startDate && e.date < filter.startDate) return false;
      if (filter?.endDate && e.date > filter.endDate) return false;
      return true;
    });
  }

  deleteExpense(id: string): boolean {
    const initialLen = this.expenses.length;
    this.expenses = this.expenses.filter(e => e.id !== id);
    return this.expenses.length < initialLen;
  }

  generatePnlReport(period: string = '2026-10'): PnlStatement {
    // 1. Revenue
    let consultationUsd = 0;
    let labUsd = 0;
    let proceduresUsd = 0;
    let consumableCostsUsd = 0;

    for (const act of this.activities) {
      if (act.date.startsWith(period)) {
        if (act.type === 'CONSULTATION') consultationUsd += act.chargeAmountUsd;
        else if (act.type === 'PROCEDURE') proceduresUsd += act.chargeAmountUsd;
        else if (act.type === 'LAB_ORDER') labUsd += act.chargeAmountUsd;
        consumableCostsUsd += act.consumableCostUsd;
      }
    }

    // Baseline figures for pharmacy and IPD in standard month
    const pharmacyUsd = 3450.0;
    const ipdUsd = 1250.0;
    const totalRevenueUsd = Math.round((consultationUsd + pharmacyUsd + labUsd + proceduresUsd + ipdUsd) * 100) / 100;
    const totalRevenueKhr = Math.round(totalRevenueUsd * this.exchangeRate);

    // 2. Cost of Goods Sold (COGS)
    const drugsWholesaleUsd = 1680.0; // Wholesale cost of dispensed drugs (~48% of pharmacy sales)
    const labReagentsUsd = 280.0; // Reagent test consumables
    const consumablesUsd = Math.round((consumableCostsUsd + 150.0) * 100) / 100; // Syringes, dressings, IV sets
    const totalCogsUsd = Math.round((drugsWholesaleUsd + labReagentsUsd + consumablesUsd) * 100) / 100;
    const totalCogsKhr = Math.round(totalCogsUsd * this.exchangeRate);

    // 3. Gross Profit
    const grossProfitUsd = Math.round((totalRevenueUsd - totalCogsUsd) * 100) / 100;
    const grossProfitKhr = Math.round(grossProfitUsd * this.exchangeRate);
    const grossMarginPct = totalRevenueUsd > 0 ? Math.round((grossProfitUsd / totalRevenueUsd) * 1000) / 10 : 0;

    // 4. Operating Expenses (OPEX)
    let doctorCommissionsUsd = 0;
    for (const doc of this.doctorRules) {
      try {
        const stmt = this.calculateCommission(doc.doctorId, period);
        doctorCommissionsUsd += stmt.totalCommissionUsd;
      } catch {
        // Continue
      }
    }
    doctorCommissionsUsd = Math.round(doctorCommissionsUsd * 100) / 100;

    let periodExpensesUsd = 0;
    let rentUtilitiesUsd = 0;
    let staffSalariesUsd = 0;
    let clinicOverheadsUsd = 0;

    for (const exp of this.expenses) {
      if (exp.date.startsWith(period)) {
        periodExpensesUsd += exp.amountUsd;
        if (exp.category === 'RENT' || exp.category === 'UTILITIES') {
          rentUtilitiesUsd += exp.amountUsd;
        } else if (exp.category === 'SALARIES') {
          staffSalariesUsd += exp.amountUsd;
        } else {
          clinicOverheadsUsd += exp.amountUsd;
        }
      }
    }

    const totalOpexUsd = Math.round((doctorCommissionsUsd + periodExpensesUsd) * 100) / 100;
    const totalOpexKhr = Math.round(totalOpexUsd * this.exchangeRate);

    // 5. Net Operating Income (EBITDA)
    const netOperatingIncomeUsd = Math.round((grossProfitUsd - totalOpexUsd) * 100) / 100;
    const netOperatingIncomeKhr = Math.round(netOperatingIncomeUsd * this.exchangeRate);
    const netMarginPct = totalRevenueUsd > 0 ? Math.round((netOperatingIncomeUsd / totalRevenueUsd) * 1000) / 10 : 0;

    return {
      period,
      exchangeRate: this.exchangeRate,
      revenue: {
        consultationUsd: Math.round(consultationUsd * 100) / 100,
        pharmacyUsd,
        labUsd: Math.round(labUsd * 100) / 100,
        proceduresUsd: Math.round(proceduresUsd * 100) / 100,
        ipdUsd,
        totalRevenueUsd,
        totalRevenueKhr
      },
      cogs: {
        drugsWholesaleUsd,
        labReagentsUsd,
        consumablesUsd,
        totalCogsUsd,
        totalCogsKhr
      },
      grossProfit: {
        amountUsd: grossProfitUsd,
        amountKhr: grossProfitKhr,
        marginPct: grossMarginPct
      },
      opex: {
        doctorCommissionsUsd,
        staffSalariesUsd,
        rentUtilitiesUsd,
        clinicOverheadsUsd,
        totalOpexUsd,
        totalOpexKhr
      },
      netOperatingIncome: {
        amountUsd: netOperatingIncomeUsd,
        amountKhr: netOperatingIncomeKhr,
        marginPct: netMarginPct
      }
    };
  }

  getFinancialSummaryMetrics() {
    const pnl = this.generatePnlReport('2026-10');
    return {
      exchangeRate: this.exchangeRate,
      currentPeriod: '2026-10',
      totalRevenueUsd: pnl.revenue.totalRevenueUsd,
      totalRevenueKhr: pnl.revenue.totalRevenueKhr,
      grossProfitUsd: pnl.grossProfit.amountUsd,
      grossProfitMarginPct: pnl.grossProfit.marginPct,
      totalOpexUsd: pnl.opex.totalOpexUsd,
      netEbitdaUsd: pnl.netOperatingIncome.amountUsd,
      netEbitdaMarginPct: pnl.netOperatingIncome.marginPct,
      pendingCommissionsCount: this.commissionStatements.filter(s => s.status !== 'PAID').length,
      activeDoctorsCount: this.doctorRules.length,
      recentExpensesCount: this.expenses.length
    };
  }
}
