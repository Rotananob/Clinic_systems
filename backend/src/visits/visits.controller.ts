import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { VoiceMedicalNlpService, SoapNoteStructure } from './voice-medical-nlp.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVitalsDto } from './dto/update-vitals.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VisitStatus } from '@prisma/client';

@ApiTags('Visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('visits')
export class VisitsController {
  constructor(
    private readonly visitsService: VisitsService,
    private readonly voiceNlpService: VoiceMedicalNlpService,
  ) {}

  @ApiOperation({ summary: 'Register a patient visit (Check-in)' })
  @Post()
  create(@Body() createVisitDto: CreateVisitDto) {
    return this.visitsService.create(createVisitDto);
  }

  @ApiOperation({ summary: 'List visits with status or patient filter' })
  @ApiQuery({ name: 'status', enum: VisitStatus, required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  @Get()
  findAll(
    @Query('status') status?: VisitStatus,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.visitsService.findAll({ status, patientId, doctorId });
  }

  @ApiOperation({ summary: 'Transcribe medical voice dictation into structured SOAP clinical note' })
  @Post('voice-transcribe')
  transcribeVoiceDictation(
    @Body() body: { transcript: string; doctorName?: string },
    @Req() req: any,
  ) {
    const doctorName = body.doctorName || req.user?.fullNameEn || req.user?.username || 'Doctor';
    return this.voiceNlpService.parseClinicalDictation(body.transcript, doctorName);
  }

  @ApiOperation({ summary: 'Apply parsed SOAP notes directly to active patient visit chart' })
  @Post(':id/apply-soap')
  applySoapToVisit(
    @Param('id') id: string,
    @Body() body: { soapNote: SoapNoteStructure; doctorId?: string },
    @Req() req: any,
  ) {
    const doctorId = body.doctorId || req.user?.id;
    return this.visitsService.applySoapToVisit(id, body.soapNote, doctorId);
  }

  @ApiOperation({ summary: 'Get specific visit details with clinical attachments' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }

  @ApiOperation({ summary: 'Record or update patient vitals (Nurse/Doctor)' })
  @Patch(':id/vitals')
  updateVitals(@Param('id') id: string, @Body() vitalsDto: UpdateVitalsDto) {
    return this.visitsService.updateVitals(id, vitalsDto);
  }

  @ApiOperation({ summary: 'Update visit queue status (WAITING, IN_CONSULTATION, COMPLETED, CANCELLED)' })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: VisitStatus,
  ) {
    return this.visitsService.updateStatus(id, status);
  }

  @ApiOperation({ summary: 'Complete consultation with diagnosis, notes, medical record, and invoice trigger' })
  @Patch(':id/complete')
  completeVisit(
    @Param('id') id: string,
    @Body()
    body: {
      diagnosis: string;
      notes?: string;
      doctorId?: string;
      physicalExam?: string;
      assessment?: string;
      treatmentPlan?: string;
      createConsultationInvoice?: boolean;
    },
  ) {
    return this.visitsService.completeVisit(id, body);
  }
}
