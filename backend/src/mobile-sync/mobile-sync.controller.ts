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
  Headers,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { MobileSyncService } from './mobile-sync.service';
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
  KhqrSettlementWebhookDto,
  KhqrSettlementResponseDto,
  MobilePushNotificationDto,
  SyncInvoiceDto,
  NssfEligibilityRequestDto,
  NssfEligibilityResponseDto,
  NssfClaimSubmissionDto,
  NssfClaimSubmissionResponseDto,
} from './mobile-sync.types';

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
   * Endpoint 6: Bakong KHQR Settled Transaction Webhook Ingestion
   */
  @Post('khqr-webhook')
  @HttpCode(HttpStatus.OK)
  async handleKhqrWebhook(
    @Body() dto: KhqrSettlementWebhookDto
  ): Promise<KhqrSettlementResponseDto> {
    return this.mobileSyncService.settleKhqrTransaction(dto);
  }

  /**
   * Endpoint 7: Direct KHQR Settlement Alias for Point-of-Sale (POS) Stations
   */
  @Post('settle-khqr')
  @HttpCode(HttpStatus.OK)
  async settleKhqrDirect(
    @Body() dto: KhqrSettlementWebhookDto
  ): Promise<KhqrSettlementResponseDto> {
    return this.mobileSyncService.settleKhqrTransaction(dto);
  }

  /**
   * Endpoint 8: Pending Push Notifications for Mobile Devices
   */
  @Get('push-notifications')
  @HttpCode(HttpStatus.OK)
  async getPushNotifications(
    @Query('deviceId') deviceId?: string
  ): Promise<MobilePushNotificationDto[]> {
    return this.mobileSyncService.getPendingPushNotifications(deviceId);
  }

  /**
   * Endpoint 9: Acknowledge Push Notification Delivery from Mobile Device
   */
  @Post('push-notifications/ack')
  @HttpCode(HttpStatus.OK)
  async acknowledgePushNotification(
    @Body('notificationId') notificationId: string
  ): Promise<{ acknowledged: boolean }> {
    const success = this.mobileSyncService.acknowledgePushNotification(notificationId);
    return { acknowledged: success };
  }

  /**
   * Endpoint 10: Invoices Query for Mobile POS and Cashier Stations
   */
  @Get('invoices')
  @HttpCode(HttpStatus.OK)
  async getInvoices(
    @Query('tenantId') tenantId?: string
  ): Promise<SyncInvoiceDto[]> {
    return this.mobileSyncService.getInvoices(tenantId);
  }

  /**
   * Endpoint 11: Single Invoice Query
   */
  @Get('invoices/:invoiceId')
  @HttpCode(HttpStatus.OK)
  async getInvoiceById(
    @Param('invoiceId') invoiceId: string
  ): Promise<SyncInvoiceDto | undefined> {
    return this.mobileSyncService.getInvoice(invoiceId);
  }

  /**
   * Endpoint 12: Cambodia NSSF Member Eligibility Verification via CamDX
   */
  @Post('nssf/verify-eligibility')
  @HttpCode(HttpStatus.OK)
  async verifyNssfEligibility(
    @Body() dto: NssfEligibilityRequestDto
  ): Promise<NssfEligibilityResponseDto> {
    return this.mobileSyncService.verifyNssfEligibility(dto);
  }

  /**
   * Endpoint 13: Cryptographically Signed NSSF e-Claim Submission via CamDX
   */
  @Post('nssf/submit-claim')
  @HttpCode(HttpStatus.OK)
  async submitNssfClaim(
    @Body() dto: NssfClaimSubmissionDto,
    @Headers('x-nssf-device-signature') headerSignature?: string
  ): Promise<NssfClaimSubmissionResponseDto> {
    return this.mobileSyncService.submitNssfClaim(dto, headerSignature);
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
