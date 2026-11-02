import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { BedsideMonitorService } from './bedside-monitor.service.ts';
import type { BedsideMonitorVitals, ArrhythmiaType } from './vital-signs.library.ts';

@Controller('telemetry')
export class BedsideMonitorController {
  constructor(private readonly monitorService: BedsideMonitorService) {}

  @Get('beds')
  getAllBeds() {
    return this.monitorService.getAllBeds();
  }

  @Get('beds/:bedId')
  getBedById(@Param('bedId') bedId: string) {
    try {
      return this.monitorService.getBedById(bedId);
    } catch {
      throw new NotFoundException(`Bed ${bedId} not found`);
    }
  }

  @Post('beds/:bedId/vitals')
  @HttpCode(HttpStatus.OK)
  updateVitals(
    @Param('bedId') bedId: string,
    @Body() vitalsUpdate: Partial<BedsideMonitorVitals>
  ) {
    try {
      return this.monitorService.updateBedVitals(bedId, vitalsUpdate);
    } catch {
      throw new NotFoundException(`Bed ${bedId} not found`);
    }
  }

  @Post('beds/:bedId/silence')
  @HttpCode(HttpStatus.OK)
  silenceAlarm(
    @Param('bedId') bedId: string,
    @Body() dto: { clinicianId: string; durationSeconds?: number }
  ) {
    if (!dto.clinicianId) {
      throw new BadRequestException('clinicianId is required to silence telemetry alarm');
    }
    try {
      return this.monitorService.silenceAlarm(bedId, dto.clinicianId, dto.durationSeconds ?? 120);
    } catch {
      throw new NotFoundException(`Bed ${bedId} not found`);
    }
  }

  @Post('beds/:bedId/alarms/:alarmId/acknowledge')
  @HttpCode(HttpStatus.OK)
  acknowledgeAlarm(
    @Param('bedId') bedId: string,
    @Param('alarmId') alarmId: string,
    @Body() dto: { clinicianId: string }
  ) {
    if (!dto.clinicianId) {
      throw new BadRequestException('clinicianId is required to acknowledge telemetry alarm');
    }
    try {
      return this.monitorService.acknowledgeAlarm(bedId, alarmId, dto.clinicianId);
    } catch {
      throw new NotFoundException(`Bed ${bedId} or alarm ${alarmId} not found`);
    }
  }

  @Post('beds/:bedId/simulate')
  @HttpCode(HttpStatus.OK)
  simulateArrhythmia(
    @Param('bedId') bedId: string,
    @Body() dto: { arrhythmiaType: ArrhythmiaType; clinicianId: string }
  ) {
    if (!dto.arrhythmiaType || !dto.clinicianId) {
      throw new BadRequestException('arrhythmiaType and clinicianId are required');
    }
    try {
      return this.monitorService.simulateArrhythmia(bedId, dto.arrhythmiaType, dto.clinicianId);
    } catch {
      throw new NotFoundException(`Bed ${bedId} not found`);
    }
  }

  @Get('beds/:bedId/waveforms')
  getWaveforms(
    @Param('bedId') bedId: string,
    @Query('points') points?: string,
    @Query('sampleRate') sampleRate?: string
  ) {
    const pointCount = points ? parseInt(points, 10) : 60;
    const rate = sampleRate ? parseInt(sampleRate, 10) : 60;
    try {
      return this.monitorService.getWaveformBatch(bedId, pointCount, rate);
    } catch {
      throw new NotFoundException(`Bed ${bedId} not found`);
    }
  }

  @Get('audit-logs')
  getAuditLogs() {
    return this.monitorService.getAuditLogs();
  }
}
