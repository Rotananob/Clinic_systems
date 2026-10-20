import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { DentalService, DentalChart, ToothState } from './dental.service.js';

@Controller('dental')
export class DentalController {
  dentalService: DentalService;

  constructor(dentalService: DentalService) {
    this.dentalService = dentalService;
  }

  @Get('procedures')
  getProcedures() {
    return {
      success: true,
      data: this.dentalService.getProceduresList()
    };
  }

  @Get('patients/:patientId/chart')
  getDentalChart(@Param('patientId') patientId: string) {
    return {
      success: true,
      data: this.dentalService.getDentalChart(patientId)
    };
  }

  @Post('patients/:patientId/chart')
  saveDentalChart(
    @Param('patientId') patientId: string,
    @Body() updates: Partial<DentalChart>
  ) {
    return {
      success: true,
      data: this.dentalService.saveDentalChart(patientId, updates)
    };
  }

  @Put('patients/:patientId/teeth/:toothNumber')
  updateToothCondition(
    @Param('patientId') patientId: string,
    @Param('toothNumber') toothNumber: string,
    @Body() data: Partial<ToothState>
  ) {
    const num = parseInt(toothNumber, 10);
    return {
      success: true,
      data: this.dentalService.updateToothCondition(patientId, num, data)
    };
  }

  @Get('patients/:patientId/plans')
  getTreatmentPlans(@Param('patientId') patientId: string) {
    return {
      success: true,
      data: this.dentalService.getTreatmentPlans(patientId)
    };
  }

  @Post('patients/:patientId/plans')
  createTreatmentPlan(
    @Param('patientId') patientId: string,
    @Body() data: any
  ) {
    return {
      success: true,
      data: this.dentalService.createTreatmentPlan(patientId, data)
    };
  }

  @Put('plans/:planId/items/:itemId')
  updateTreatmentItemStatus(
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Body('status') status: 'DONE' | 'CANCELLED'
  ) {
    return {
      success: true,
      data: this.dentalService.updateTreatmentItemStatus(planId, itemId, status)
    };
  }
}
