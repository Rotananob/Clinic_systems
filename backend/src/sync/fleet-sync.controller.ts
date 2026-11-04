import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { EdgeFleetSyncService, PushDeltaBatchDto, PushDeltaBatchResponse } from './fleet-sync.service';

@Controller('sync')
export class EdgeFleetSyncController {
  constructor(private readonly syncService: EdgeFleetSyncService) {}

  @Post('push')
  @HttpCode(HttpStatus.OK)
  async pushDeltaBatch(
    @Headers('x-sync-hmac-sha256') hmacSignature: string,
    @Body() dto: PushDeltaBatchDto,
  ): Promise<PushDeltaBatchResponse> {
    if (!hmacSignature) {
      throw new UnauthorizedException('Missing required X-Sync-HMAC-SHA256 transmission seal');
    }

    const isValid = this.syncService.verifyTransportHmac(dto, hmacSignature);
    if (!isValid) {
      throw new UnauthorizedException('Invalid HMAC-SHA256 signature: sync payload corrupted or unauthorized node');
    }

    return this.syncService.processIncomingDeltaBatch(dto);
  }

  @Get('health')
  async getHealth() {
    return this.syncService.getClusterHealthStatus();
  }

  @Get('nodes')
  async getNodes() {
    return this.syncService.getAllNodes();
  }

  @Get('stock-balances')
  async getStockBalances() {
    return this.syncService.getAllStockBalances();
  }

  @Get('journal')
  async getJournal() {
    return this.syncService.getOutboxJournal();
  }

  @Post('trigger-sync')
  @HttpCode(HttpStatus.OK)
  async triggerSimulatedSync() {
    return this.syncService.triggerClusterSyncSweep();
  }

  @Post('transfer-stock')
  @HttpCode(HttpStatus.OK)
  async transferStock(
    @Body()
    dto: {
      substanceCode: string;
      fromBranchId: string;
      toBranchId: string;
      quantity: number;
      witnessStaffId: string;
    },
  ) {
    if (!dto.substanceCode || !dto.fromBranchId || !dto.toBranchId || !dto.quantity) {
      throw new BadRequestException('All transfer parameters must be specified');
    }
    return this.syncService.transferStockBetweenBranches(dto);
  }
}
