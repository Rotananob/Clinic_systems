import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DentalService, DentalChart, ToothState } from './dental.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Dental & Odontogram')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dental')
export class DentalController {
  constructor(private readonly dentalService: DentalService) {}

  @ApiOperation({ summary: 'Get dental procedures catalog' })
  @Roles(Role.ADMIN, Role.DOCTOR, Role.STAFF, Role.RECEPTIONIST, Role.CASHIER)
  @Get('procedures')
  getProcedures() {
    return {
      success: true,
      data: this.dentalService.getProceduresList()
    };
  }

  @ApiOperation({ summary: 'Get patient dental chart' })
  @Roles(Role.ADMIN, Role.DOCTOR, Role.STAFF)
  @Get('patients/:patientId/chart')
  getDentalChart(@Param('patientId') patientId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return {
      success: true,
      data: this.dentalService.getDentalChart(patientId, tenantId)
    };
  }

  @ApiOperation({ summary: 'Save patient dental chart' })
  @Roles(Role.ADMIN, Role.DOCTOR)
  @Post('patients/:patientId/chart')
  saveDentalChart(
    @Param('patientId') patientId: string,
    @Body() updates: Partial<DentalChart>,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return {
      success: true,
      data: this.dentalService.saveDentalChart(patientId, updates, tenantId)
    };
  }

  @ApiOperation({ summary: 'Update condition of a single tooth' })
  @Roles(Role.ADMIN, Role.DOCTOR)
  @Put('patients/:patientId/teeth/:toothNumber')
  updateToothCondition(
    @Param('patientId') patientId: string,
    @Param('toothNumber') toothNumber: string,
    @Body() data: Partial<ToothState>,
    @Req() req: any,
  ) {
    const num = parseInt(toothNumber, 10);
    const tenantId = req.user?.tenantId;
    return {
      success: true,
      data: this.dentalService.updateToothCondition(patientId, num, data, tenantId)
    };
  }

  @ApiOperation({ summary: 'Get patient treatment plans' })
  @Roles(Role.ADMIN, Role.DOCTOR, Role.STAFF, Role.CASHIER)
  @Get('patients/:patientId/plans')
  getTreatmentPlans(@Param('patientId') patientId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    return {
      success: true,
      data: this.dentalService.getTreatmentPlans(patientId, tenantId)
    };
  }

  @ApiOperation({ summary: 'Create treatment plan' })
  @Roles(Role.ADMIN, Role.DOCTOR)
  @Post('patients/:patientId/plans')
  createTreatmentPlan(
    @Param('patientId') patientId: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return {
      success: true,
      data: this.dentalService.createTreatmentPlan(patientId, data, tenantId)
    };
  }

  @ApiOperation({ summary: 'Update treatment item status' })
  @Roles(Role.ADMIN, Role.DOCTOR, Role.STAFF, Role.CASHIER)
  @Put('plans/:planId/items/:itemId')
  updateTreatmentItemStatus(
    @Param('planId') planId: string,
    @Param('itemId') itemId: string,
    @Body('status') status: 'DONE' | 'CANCELLED',
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    return {
      success: true,
      data: this.dentalService.updateTreatmentItemStatus(planId, itemId, status, tenantId)
    };
  }
}
