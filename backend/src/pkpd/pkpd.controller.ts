import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { PkPdService } from './pkpd.service.ts';
import type { PatientAnthropometrics, TdmDrugCode, MeasuredSerumLevel } from './pkpd.types.ts';

@Controller('pkpd')
export class PkPdController {
  constructor(private readonly pkpdService: PkPdService) {}

  @Get('drugs')
  getDrugLibrary() {
    return this.pkpdService.getDrugLibrary();
  }

  @Get('drugs/:code')
  getDrugByCode(@Param('code') code: string) {
    try {
      return this.pkpdService.getDrugByCode(code.toUpperCase() as TdmDrugCode);
    } catch {
      throw new NotFoundException(`Drug ${code} not supported`);
    }
  }

  @Post('biometrics')
  @HttpCode(HttpStatus.OK)
  calculateBiometrics(@Body() patient: PatientAnthropometrics) {
    if (!patient.actualWeightKg || !patient.heightCm || !patient.ageYears) {
      throw new BadRequestException('Patient age, weight, and height are required');
    }
    return this.pkpdService.calculateBiometrics(patient);
  }

  @Post('optimize')
  @HttpCode(HttpStatus.OK)
  optimizeDosing(
    @Body()
    dto: {
      drugCode: TdmDrugCode;
      patient: PatientAnthropometrics;
    }
  ) {
    if (!dto.drugCode || !dto.patient) {
      throw new BadRequestException('drugCode and patient anthropometrics are required');
    }
    try {
      return this.pkpdService.optimizeDosing(dto.drugCode, dto.patient);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post('bayesian-fit')
  @HttpCode(HttpStatus.OK)
  runBayesianFit(
    @Body()
    dto: {
      drugCode: TdmDrugCode;
      patient: PatientAnthropometrics;
      currentDoseMg: number;
      intervalHours: number;
      measuredLevels: MeasuredSerumLevel[];
    }
  ) {
    if (!dto.drugCode || !dto.patient || !dto.measuredLevels) {
      throw new BadRequestException('drugCode, patient, and measuredLevels are required');
    }
    try {
      return this.pkpdService.runBayesianFitting(
        dto.drugCode,
        dto.patient,
        dto.currentDoseMg,
        dto.intervalHours,
        dto.measuredLevels
      );
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Get('consultations')
  getAllConsultations() {
    return this.pkpdService.getAllConsultations();
  }

  @Get('consultations/:id')
  getConsultationById(@Param('id') id: string) {
    try {
      return this.pkpdService.getConsultationById(id);
    } catch {
      throw new NotFoundException(`Consultation ${id} not found`);
    }
  }
}
