import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FinanceService, CreateExpenseDto, DoctorCommissionRule } from './finance.service.js';

@Controller('finance')
export class FinanceController {
  financeService: FinanceService;

  constructor(financeService: FinanceService) {
    this.financeService = financeService;
  }

  @Get('summary')
  getFinancialSummary() {
    return {
      success: true,
      data: this.financeService.getFinancialSummaryMetrics()
    };
  }

  @Get('pnl')
  getPnlReport(@Query('period') period?: string) {
    const reportPeriod = period || '2026-10';
    return {
      success: true,
      data: this.financeService.generatePnlReport(reportPeriod)
    };
  }

  @Get('expenses')
  getExpenses(
    @Query('category') category?: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return {
      success: true,
      data: this.financeService.getExpenses({ category, startDate, endDate })
    };
  }

  @Post('expenses')
  createExpense(@Body() dto: CreateExpenseDto) {
    return {
      success: true,
      data: this.financeService.recordExpense(dto)
    };
  }

  @Delete('expenses/:id')
  deleteExpense(@Param('id') id: string) {
    const deleted = this.financeService.deleteExpense(id);
    return {
      success: deleted,
      message: deleted ? 'Expense record deleted successfully' : 'Expense record not found'
    };
  }

  @Get('commissions/rules')
  getDoctorRules() {
    return {
      success: true,
      data: this.financeService.getDoctorRules()
    };
  }

  @Put('commissions/rules/:doctorId')
  updateDoctorRule(
    @Param('doctorId') doctorId: string,
    @Body() updates: Partial<DoctorCommissionRule>
  ) {
    return {
      success: true,
      data: this.financeService.updateDoctorRule(doctorId, updates)
    };
  }

  @Get('commissions')
  getCommissionStatements(
    @Query('doctorId') doctorId?: string,
    @Query('period') period?: string
  ) {
    return {
      success: true,
      data: this.financeService.getCommissionStatements({ doctorId, period })
    };
  }

  @Post('commissions/calculate')
  calculateCommission(
    @Body('doctorId') doctorId: string,
    @Body('period') period: string
  ) {
    return {
      success: true,
      data: this.financeService.calculateCommission(doctorId, period || '2026-10')
    };
  }

  @Post('commissions/:id/approve')
  approveCommission(
    @Param('id') statementId: string,
    @Body('approvedBy') approvedBy: string
  ) {
    return {
      success: true,
      data: this.financeService.approveCommissionStatement(statementId, approvedBy || 'Authorized Manager')
    };
  }

  @Post('commissions/:id/payout')
  payoutCommission(
    @Param('id') statementId: string,
    @Body('paymentMethod') paymentMethod: string,
    @Body('paymentRef') paymentRef: string
  ) {
    return {
      success: true,
      data: this.financeService.payoutCommissionStatement(
        statementId,
        paymentMethod || 'BAKONG_KHQR',
        paymentRef || `TXN-BK-${Date.now().toString().slice(-8)}`
      )
    };
  }
}
