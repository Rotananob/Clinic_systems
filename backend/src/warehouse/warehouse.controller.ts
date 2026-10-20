import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import {
  WarehouseService,
  CreateTransferDto,
  InboundVerificationDto,
  TransferStatus,
} from './warehouse.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Multi-Branch Chain & Central Warehouse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouse')
export class WarehouseController {
  private readonly warehouseService: WarehouseService;

  constructor(warehouseService: WarehouseService) {
    this.warehouseService = warehouseService;
  }

  @ApiOperation({ summary: 'Get Central HQ Warehouse executive overview and aggregated metrics' })
  @Get('hq/overview')
  getHqOverview() {
    return this.warehouseService.getHqWarehouseOverview();
  }

  @ApiOperation({ summary: 'List all clinic branches and central warehouse depots' })
  @Get('branches')
  getAllBranches() {
    return this.warehouseService.getAllBranches();
  }

  @ApiOperation({ summary: 'Get details of a specific branch' })
  @Get('branches/:id')
  getBranchById(@Param('id') id: string) {
    return this.warehouseService.getBranchById(id);
  }

  @ApiOperation({ summary: 'List inventory batches with optional branch filter' })
  @ApiQuery({ name: 'branchId', required: false })
  @Get('inventory')
  getInventoryBatches(@Query('branchId') branchId?: string) {
    return this.warehouseService.getInventoryBatches(branchId);
  }

  @ApiOperation({ summary: 'Get FEFO-sorted expiring batches with 90, 60, and 30 day alerts' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'thresholdDays', required: false })
  @Get('inventory/expiring')
  getExpiringBatches(
    @Query('branchId') branchId?: string,
    @Query('thresholdDays') thresholdDays?: string,
  ) {
    const days = thresholdDays ? parseInt(thresholdDays, 10) : 90;
    return this.warehouseService.getExpiringBatches(branchId, isNaN(days) ? 90 : days);
  }

  @ApiOperation({ summary: 'List inter-branch stock transfers' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @Get('transfers')
  getAllTransfers(
    @Query('branchId') branchId?: string,
    @Query('status') status?: TransferStatus,
  ) {
    return this.warehouseService.getAllTransfers({ branchId, status });
  }

  @ApiOperation({ summary: 'Get specific inter-branch transfer manifest by ID or barcode' })
  @Get('transfers/:id')
  getTransferById(@Param('id') id: string) {
    return this.warehouseService.getTransferById(id);
  }

  @ApiOperation({ summary: 'Create a new inter-branch stock transfer manifest' })
  @Post('transfers')
  createTransfer(@Body() dto: CreateTransferDto) {
    return this.warehouseService.createTransfer(dto);
  }

  @ApiOperation({ summary: 'Dispatch a draft transfer with barcode scan confirmation' })
  @Post('transfers/:id/dispatch')
  dispatchTransfer(
    @Param('id') id: string,
    @Body() body: { dispatchedBy: string; scannedBarcode?: string },
  ) {
    return this.warehouseService.dispatchTransfer(id, body.dispatchedBy, body.scannedBarcode);
  }

  @ApiOperation({ summary: 'Perform inbound barcode scan verification and receive transferred stock' })
  @Post('transfers/:id/receive')
  verifyAndReceiveTransfer(
    @Param('id') id: string,
    @Body() verification: InboundVerificationDto,
  ) {
    return this.warehouseService.verifyAndReceiveTransfer(id, verification);
  }
}
