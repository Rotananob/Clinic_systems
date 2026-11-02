import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IpdService, WardCode, BedStatus, MedAdminRoute, MedAdminStatus } from './ipd.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Inpatient (IPD) Admission, Bed Management & Nurse e-MAR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ipd')
export class IpdController {
  private readonly ipdService: IpdService;

  constructor(ipdService: IpdService) {
    this.ipdService = ipdService;
  }

  @ApiOperation({ summary: 'List all ward beds and live occupancy status' })
  @ApiQuery({ name: 'ward', required: false })
  @ApiQuery({ name: 'status', required: false })
  @Get('beds')
  getBeds(@Query('ward') ward?: WardCode, @Query('status') status?: BedStatus) {
    return this.ipdService.getBeds(ward, status);
  }

  @ApiOperation({ summary: 'Get clinic-wide bed occupancy statistics and metrics' })
  @Get('beds/metrics')
  getBedMetrics() {
    return this.ipdService.getBedMetrics();
  }

  @ApiOperation({ summary: 'Admit inpatient to designated ward bed' })
  @Post('admissions')
  admitPatient(
    @Body()
    body: {
      patientId: string;
      patientName: string;
      bedId: string;
      attendingDoctor: string;
      admittingDiagnosis: string;
      depositAmountUsd?: number;
      emergencyContact: { name: string; phone: string; relation: string };
      tenantId?: string;
    },
  ) {
    return this.ipdService.admitPatient(body);
  }

  @ApiOperation({ summary: 'List inpatient admissions' })
  @ApiQuery({ name: 'status', required: false })
  @Get('admissions')
  listAdmissions(@Query('status') status?: 'ADMITTED' | 'TRANSFERRED' | 'DISCHARGED') {
    return this.ipdService.listAdmissions(status);
  }

  @ApiOperation({ summary: 'Get single admission record' })
  @Get('admissions/:admissionId')
  getAdmission(@Param('admissionId') admissionId: string) {
    return this.ipdService.getAdmission(admissionId);
  }

  @ApiOperation({ summary: 'Transfer patient to different bed or ward' })
  @Post('admissions/:admissionId/transfer')
  transferBed(
    @Param('admissionId') admissionId: string,
    @Body() body: { targetBedId: string; transferNote?: string },
  ) {
    return this.ipdService.transferBed(admissionId, body.targetBedId, body.transferNote);
  }

  @ApiOperation({ summary: 'Discharge inpatient and free bed for cleaning' })
  @Post('admissions/:admissionId/discharge')
  dischargePatient(
    @Param('admissionId') admissionId: string,
    @Body() body: { dischargeSummary?: string },
  ) {
    return this.ipdService.dischargePatient(admissionId, body?.dischargeSummary);
  }

  @ApiOperation({ summary: 'Mark cleaned bed as ready and available' })
  @Post('beds/:bedId/clean')
  markBedCleaned(@Param('bedId') bedId: string) {
    return this.ipdService.markBedCleaned(bedId);
  }

  @ApiOperation({ summary: 'Get electronic Medication Administration Record (e-MAR) for inpatient' })
  @Get('admissions/:admissionId/emar')
  getEmar(@Param('admissionId') admissionId: string) {
    return this.ipdService.getEmar(admissionId);
  }

  @ApiOperation({ summary: 'Schedule medication administration slot' })
  @Post('admissions/:admissionId/emar/schedule')
  scheduleMedication(
    @Param('admissionId') admissionId: string,
    @Body()
    body: {
      medicationName: string;
      medicationBarcode: string;
      dose: string;
      route: MedAdminRoute;
      scheduledTime: string;
    },
  ) {
    return this.ipdService.scheduleMedication(admissionId, body);
  }

  @ApiOperation({ summary: 'Administer medication with Five Rights Barcode verification' })
  @Post('admissions/:admissionId/emar/:emarId/administer')
  administerMedication(
    @Param('admissionId') admissionId: string,
    @Param('emarId') emarId: string,
    @Body()
    body: {
      scannedWristbandBarcode: string;
      scannedMedicationBarcode: string;
      nurseName: string;
      status?: MedAdminStatus;
      notes?: string;
    },
  ) {
    return this.ipdService.administerMedication(admissionId, emarId, body);
  }

  @ApiOperation({ summary: 'Get Intake & Output (I/O) fluid balance records' })
  @Get('admissions/:admissionId/fluid-balance')
  getFluidBalance(@Param('admissionId') admissionId: string) {
    return this.ipdService.getFluidBalance(admissionId);
  }

  @ApiOperation({ summary: 'Record 24-hour Intake & Output fluid balance' })
  @Post('admissions/:admissionId/fluid-balance')
  recordFluidBalance(
    @Param('admissionId') admissionId: string,
    @Body()
    body: {
      intakeOralMl: number;
      intakeIvMl: number;
      outputUrineMl: number;
      outputDrainMl: number;
      nurseName: string;
    },
  ) {
    return this.ipdService.recordFluidBalance(admissionId, body);
  }

  @ApiOperation({ summary: 'Calculate IV infusion flow rate and drip rate (gtt/min)' })
  @Post('calculator/iv-drip')

  @ApiOperation({ summary: 'Get Braden Scale pressure ulcer risk assessments for admission' })
  @Get('admissions/:admissionId/braden')
  getBradenAssessments(@Param('admissionId') admissionId: string) {
    return this.ipdService.getBradenAssessments(admissionId);
  }

  @ApiOperation({ summary: 'Assess inpatient Braden Scale pressure ulcer risk' })
  @Post('admissions/:admissionId/braden')
  assessBradenScale(
    @Param('admissionId') admissionId: string,
    @Body()
    body: {
      sensoryPerception: 1 | 2 | 3 | 4;
      moisture: 1 | 2 | 3 | 4;
      activity: 1 | 2 | 3 | 4;
      mobility: 1 | 2 | 3 | 4;
      nutrition: 1 | 2 | 3 | 4;
      frictionShear: 1 | 2 | 3;
      nurseName: string;
    }
  ) {
    return this.ipdService.assessBradenScale(admissionId, body);
  }

  @ApiOperation({ summary: 'Get vital signs flowsheet and NEWS2 score history for admission' })
  @Get('admissions/:admissionId/vitals')
  getVitalFlowsheet(@Param('admissionId') admissionId: string) {
    return this.ipdService.getVitalFlowsheet(admissionId);
  }

  @ApiOperation({ summary: 'Record nursing vital signs with real-time NEWS2 calculation' })
  @Post('admissions/:admissionId/vitals')
  recordVitalFlowsheet(
    @Param('admissionId') admissionId: string,
    @Body()
    body: {
      respiratoryRate: number;
      spo2Percent: number;
      onSupplementalOxygen: boolean;
      systolicBp: number;
      diastolicBp: number;
      pulseRate: number;
      consciousnessAvpu: 'ALERT' | 'VOICE' | 'PAIN' | 'UNRESPONSIVE';
      temperatureCelsius: number;
      nurseName: string;
    }
  ) {
    return this.ipdService.recordVitalFlowsheet(admissionId, body);
  }

  @ApiOperation({ summary: 'Calculate stay charges and balance due for inpatient' })
  @Get('admissions/:admissionId/stay-charges')
  getStayCharges(@Param('admissionId') admissionId: string, @Query('asOfDate') asOfDate?: string) {
    return this.ipdService.calculateStayCharges(admissionId, asOfDate);
  }

  calculateIvDrip(
    @Body()
    body: {
      volumeMl: number;
      durationHours: number;
      dropFactorGttPerMl?: number;
    },
  ) {
    return this.ipdService.calculateIvDripRate(
      body.volumeMl,
      body.durationHours,
      body.dropFactorGttPerMl,
    );
  }
}
