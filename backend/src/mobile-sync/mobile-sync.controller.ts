// Mobile Sync & Device Gateway Controller
// Strictly ZERO emojis in code and text. Strictly NO parentheses in Khmer text.

import {
  Controller,
  Post,
  Get,
  Sse,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { MobileSyncService } from './mobile-sync.service.ts';
import type {
  HandshakeRequestDto,
  HandshakeResponseDto,
  PullDeltaRequestDto,
  PullDeltaResponseDto,
  PushMutationsRequestDto,
  PushMutationsResponseDto,
  TelemetryBroadcastDto,
  TelemetryStreamEvent,
  SseMessageEvent,
} from './mobile-sync.types.ts';

@Controller('mobile-sync')
export class MobileSyncController {
  private readonly mobileSyncService: MobileSyncService;

  constructor(mobileSyncService: MobileSyncService) {
    this.mobileSyncService = mobileSyncService;
  }

  /**
   * Endpoint 1: Device Registration, Min App Version Check, Server Time Synchronization
   */
  @Post('handshake')
  @HttpCode(HttpStatus.OK)
  async handshake(
    @Body() dto: HandshakeRequestDto
  ): Promise<HandshakeResponseDto> {
    return this.mobileSyncService.handshake(dto);
  }

  /**
   * Endpoint 2: Delta Sync Returning Patients, Vital Signs, and Formulary Items
   */
  @Post('pull-delta')
  @HttpCode(HttpStatus.OK)
  async pullDelta(
    @Body() dto: PullDeltaRequestDto
  ): Promise<PullDeltaResponseDto> {
    return this.mobileSyncService.pullDelta(dto);
  }

  /**
   * Endpoint 3: Batch Offline Mutation Ingest with Latest Timestamp Wins Conflict Resolution
   */
  @Post('push-mutations')
  @HttpCode(HttpStatus.OK)
  async pushMutations(
    @Body() dto: PushMutationsRequestDto
  ): Promise<PushMutationsResponseDto> {
    return this.mobileSyncService.pushMutations(dto);
  }

  /**
   * Endpoint 4: Real-Time Server-Sent Events (SSE) Telemetry Stream for Mobile Tablets
   * Streams bedside vitals, ECG telemetry, lab panic alerts, and 15s keep-alive heartbeats
   */
  @Sse('telemetry-stream')
  telemetryStream(
    @Query('department') department?: string,
    @Query('ward') ward?: string,
    @Query('deviceId') deviceId?: string
  ): Observable<SseMessageEvent> {
    return this.mobileSyncService.getTelemetryStream({ department, ward, deviceId });
  }

  /**
   * Endpoint 5: Broadcast Telemetry Event from Clinical Station or Monitor
   */
  @Post('telemetry-broadcast')
  @HttpCode(HttpStatus.OK)
  async broadcastTelemetry(
    @Body() dto: TelemetryBroadcastDto
  ): Promise<TelemetryStreamEvent> {
    return this.mobileSyncService.broadcastTelemetryEvent(dto);
  }

  /**
   * Diagnostics: Gateway Health & Operational Metrics
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getHealth() {
    return this.mobileSyncService.getGatewayHealth();
  }

  /**
   * Diagnostics: Active Registered Mobile Devices
   */
  @Get('devices')
  @HttpCode(HttpStatus.OK)
  async getRegisteredDevices() {
    return this.mobileSyncService.getAllRegisteredDevices();
  }

  /**
   * Diagnostics: Specific Device Registry Record
   */
  @Get('devices/:deviceId')
  @HttpCode(HttpStatus.OK)
  async getDeviceById(@Param('deviceId') deviceId: string) {
    return this.mobileSyncService.getDevice(deviceId);
  }
}
