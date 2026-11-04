import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { BedsideInfusionService } from './infusion.service';
import type { VascularRoute } from './ders-guardrails.library';

@Controller('infusion')
export class BedsideInfusionController {
  constructor(private readonly infusionService: BedsideInfusionService) {}

  @Get('library')
  getDrugLibrary() {
    return this.infusionService.getDrugLibrary();
  }

  @Get('drugs/:code')
  getDrugByCode(@Param('code') code: string) {
    return this.infusionService.getDrugByCode(code);
  }

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  calculateDose(
    @Body()
    dto: {
      substanceCode: string;
      prescribedDose: number;
      patientWeightKg?: number;
      concentrationId?: string;
      route?: VascularRoute;
    },
  ) {
    if (!dto.substanceCode || dto.prescribedDose === undefined) {
      throw new BadRequestException('substanceCode and prescribedDose are strictly required');
    }
    return this.infusionService.calculateDose(dto);
  }

  @Get('pumps')
  getAllPumps() {
    return this.infusionService.getAllPumps();
  }

  @Get('pumps/:id')
  getPumpById(@Param('id') id: string) {
    return this.infusionService.getPumpById(id);
  }

  @Post('pumps/start')
  @HttpCode(HttpStatus.OK)
  startInfusion(
    @Body()
    dto: {
      pumpId: string;
      patientId: string;
      patientNameKh: string;
      patientNameEn: string;
      patientWeightKg?: number;
      vascularRoute: VascularRoute;
      substanceCode: string;
      prescribedDose: number;
      concentrationId?: string;
      volumeToBeInfusedMl: number;
      nurseStaffId: string;
      physicianOverrideReason?: string;
    },
  ) {
    if (!dto.pumpId || !dto.substanceCode || !dto.prescribedDose) {
      throw new BadRequestException('pumpId, substanceCode and prescribedDose are strictly required');
    }
    return this.infusionService.startInfusion(dto);
  }

  @Post('pumps/titrate')
  @HttpCode(HttpStatus.OK)
  titrateDose(
    @Body()
    dto: {
      pumpId: string;
      newDose: number;
      nurseStaffId: string;
      physicianOverrideReason?: string;
    },
  ) {
    if (!dto.pumpId || dto.newDose === undefined) {
      throw new BadRequestException('pumpId and newDose are strictly required');
    }
    return this.infusionService.titrateDose(dto);
  }

  @Post('pumps/pca-demand')
  @HttpCode(HttpStatus.OK)
  requestPcaDemand(
    @Body()
    dto: {
      pumpId: string;
      requestedBolusMcg: number;
    },
  ) {
    if (!dto.pumpId || !dto.requestedBolusMcg) {
      throw new BadRequestException('pumpId and requestedBolusMcg are required');
    }
    return this.infusionService.requestPcaDemand(dto);
  }

  @Post('pumps/:id/telemetry')
  @HttpCode(HttpStatus.OK)
  updateTelemetry(
    @Param('id') pumpId: string,
    @Body()
    dto: {
      linePressureMmHg: number;
      airBubbleDetected: boolean;
      clampClosed?: boolean;
      batteryPercentage: number;
      volumeInfusedIncrementMl?: number;
    },
  ) {
    return this.infusionService.updateTelemetry(pumpId, dto);
  }

  @Post('pumps/:id/pause')
  @HttpCode(HttpStatus.OK)
  togglePause(@Param('id') pumpId: string) {
    return this.infusionService.togglePause(pumpId);
  }

  @Post('pumps/:id/stop')
  @HttpCode(HttpStatus.OK)
  stopInfusion(@Param('id') pumpId: string) {
    return this.infusionService.stopInfusion(pumpId);
  }
}
