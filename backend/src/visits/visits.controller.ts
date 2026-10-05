import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVitalsDto } from './dto/update-vitals.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VisitStatus } from '@prisma/client';

@ApiTags('Visits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

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
