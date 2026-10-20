import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LisService, SpecimenTubeType } from './lis.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Laboratory Information System (LIS) & ASTM/HL7 Interfacing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lis')
export class LisController {
  private readonly lisService: LisService;

  constructor(lisService: LisService) {
    this.lisService = lisService;
  }

  @ApiOperation({ summary: 'Register specimen accession and generate Code128 barcode' })
  @Post('accession')
  createAccession(
    @Body()
    body: {
      patientId: string;
      patientName: string;
      panelCode: string;
      panelNameEn: string;
      panelNameKh: string;
      tubeType: SpecimenTubeType;
      orderingDoctor: string;
      phlebotomist: string;
      tenantId?: string;
    },
  ) {
    return this.lisService.createAccession(
      body.patientId,
      body.patientName,
      body.panelCode,
      body.panelNameEn,
      body.panelNameKh,
      body.tubeType,
      body.orderingDoctor,
      body.phlebotomist,
      body.tenantId,
    );
  }

  @ApiOperation({ summary: 'List laboratory orders with panic and delta check filters' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'hasPanic', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @Get('orders')
  listOrders(
    @Query('status') status?: string,
    @Query('patientId') patientId?: string,
    @Query('hasPanic') hasPanic?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.lisService.listOrders({
      status,
      patientId,
      hasPanic: hasPanic !== undefined ? hasPanic === 'true' : undefined,
      tenantId,
    });
  }

  @ApiOperation({ summary: 'Get single lab order details with analyte flags and previous deltas' })
  @Get('orders/:orderId')
  getOrder(@Param('orderId') orderId: string) {
    return this.lisService.getOrder(orderId);
  }

  @ApiOperation({ summary: 'Ingest raw ASTM E1394 or HL7 v2 ORU^R01 packet from laboratory analyzer' })
  @Post('orders/:orderId/ingest')
  ingestResults(
    @Param('orderId') orderId: string,
    @Body()
    body: {
      rawProtocolPacket?: string;
      directAnalyteResults?: Array<{ code: string; value: number }>;
      analyzerModel?: string;
      protocol?: 'ASTM_E1394' | 'HL7_V2_ORU' | 'MANUAL_ENTRY';
    },
  ) {
    return this.lisService.ingestAnalyzerResults(orderId, body);
  }

  @ApiOperation({ summary: 'Pathologist verification and electronic release of lab report to EHR' })
  @Post('orders/:orderId/verify')
  verifyOrder(
    @Param('orderId') orderId: string,
    @Body() body: { pathologistName: string; notes?: string },
  ) {
    return this.lisService.verifyAndReleaseOrder(orderId, body.pathologistName, body.notes);
  }

  @ApiOperation({ summary: 'Get standard clinical laboratory reference ranges and panic thresholds' })
  @Get('reference-ranges')
  getReferenceRanges() {
    return this.lisService.getReferenceRanges();
  }
}
