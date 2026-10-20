import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  PacsService,
  DicomStudy,
  RadiologistReportInput,
  PacsModality,
} from './pacs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('DICOM PACS Medical Imaging')
@Controller('pacs')
export class PacsController {
  private readonly pacsService: PacsService;

  constructor(pacsService: PacsService) {
    this.pacsService = pacsService;
  }

  @ApiOperation({ summary: 'Get all DICOM studies filtered by modality, status, and patient search' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'modality', required: false, enum: ['ALL', 'DX', 'CR', 'US', 'CT', 'MR', 'ES'] })
  @ApiQuery({ name: 'status', required: false, enum: ['ALL', 'UNREAD', 'IN_REVIEW', 'REPORTED', 'CRITICAL'] })
  @ApiQuery({ name: 'search', required: false })
  @Get('studies')
  getAllStudies(
    @Req() req: any,
    @Query('modality') modality?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.pacsService.getAllStudies(tenantId, { modality, status, search });
  }

  @ApiOperation({ summary: 'Get detailed DICOM study by StudyInstanceUID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('studies/:studyInstanceUid')
  getStudyByUid(@Req() req: any, @Param('studyInstanceUid') studyInstanceUid: string) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.pacsService.getStudyByUid(studyInstanceUid, tenantId);
  }

  @ApiOperation({ summary: 'Save formal radiologist findings, impression, and measurements' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('studies/:studyInstanceUid/report')
  saveReport(
    @Req() req: any,
    @Param('studyInstanceUid') studyInstanceUid: string,
    @Body() body: RadiologistReportInput,
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.pacsService.saveRadiologistReport(studyInstanceUid, tenantId, body);
  }

  @ApiOperation({ summary: 'Register/upload a new DICOM study into the clinical PACS archive' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('studies/upload')
  uploadStudy(
    @Req() req: any,
    @Body()
    body: Partial<DicomStudy> & {
      patientId: string;
      patientName: string;
      modality: PacsModality;
      bodyPart: string;
      studyDescription: string;
    },
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.pacsService.uploadDicomStudy(tenantId, body);
  }

  @ApiOperation({ summary: 'Calculate Cardiothoracic Ratio (CTR) from internal thoracic and cardiac transverse diameters' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('measurements/ctr')
  calculateCtr(@Body() body: { cardiacWidthMm: number; thoracicWidthMm: number }) {
    return this.pacsService.calculateCardiothoracicRatio(body.cardiacWidthMm, body.thoracicWidthMm);
  }

  @ApiOperation({ summary: 'Calculate Cobb Angle for spinal scoliosis assessment' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('measurements/cobb-angle')
  calculateCobbAngle(@Body() body: { upperEndplateSlopeDeg: number; lowerEndplateSlopeDeg: number }) {
    return this.pacsService.calculateCobbAngle(body.upperEndplateSlopeDeg, body.lowerEndplateSlopeDeg);
  }

  @ApiOperation({ summary: 'Get radiological window/level presets by imaging modality' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'modality', required: false })
  @Get('presets')
  getWindowPresets(@Query('modality') modality?: string) {
    return this.pacsService.getWindowPresets(modality);
  }
}
