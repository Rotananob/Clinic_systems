import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { ClinicalDecisionSupportService, News2VitalsInput } from './cdss.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrescriptionStatus, Role } from '@prisma/client';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(
    private readonly prescriptionsService: PrescriptionsService,
    private readonly cdssService: ClinicalDecisionSupportService,
  ) {}

  @ApiOperation({ summary: 'Evaluate CDSS drug interactions, allergy guard, and NEWS2 triage' })
  @Post('cdss/evaluate')
  evaluateClinicalSafety(
    @Body()
    body: {
      medications: string[];
      patientAllergies?: string;
      patientConditions?: string[];
      vitals?: News2VitalsInput;
    },
  ) {
    const ddiAlerts = this.cdssService.checkDrugDrugInteractions(body.medications || []);
    const { allergyAlerts, contraindicationAlerts } =
      this.cdssService.checkAllergiesAndContraindications(
        body.medications || [],
        body.patientAllergies,
        body.patientConditions,
      );

    const triageResult = body.vitals ? this.cdssService.calculateNews2(body.vitals) : null;

    const hasBlockingIssue =
      ddiAlerts.some((a) => a.action === 'BLOCK') ||
      allergyAlerts.some((a) => a.severity === 'SEVERE' && !a.isCrossReactivity) ||
      contraindicationAlerts.some((c) => c.action === 'BLOCK');

    const hasWarnings =
      ddiAlerts.length > 0 || allergyAlerts.length > 0 || contraindicationAlerts.length > 0;

    return {
      isSafe: !hasWarnings,
      hasBlockingIssue,
      summaryMessageKh: hasBlockingIssue
        ? 'មានការព្រមានកម្រិតគ្រោះថ្នាក់ធ្ងន់ធ្ងរ (Severe Danger)។ តម្រូវឱ្យផ្លាស់ប្តូរថ្នាំ ឬពិនិត្យឡើងវិញជាបន្ទាន់។'
        : hasWarnings
        ? 'មានការព្រមានកម្រិតប្រុងប្រយ័ត្ន (Moderate Warning)។ គ្រូពេទ្យអាចបញ្ជាក់ការអនុញ្ញាត (Override) បន្ទាប់ពីវាយតម្លៃ។'
        : 'សុវត្ថិភាពវេជ្ជសាស្ត្រ ១០០% គ្មានប្រតិកម្មថ្នាំ ឬអាលែកហ្ស៊ីត្រូវបានរកឃើញឡើយ។',
      summaryMessageEn: hasBlockingIssue
        ? 'Severe clinical safety alert detected. Action blocked or requires immediate review.'
        : hasWarnings
        ? 'Clinical safety warnings detected. Doctor override and justification required.'
        : 'All prescriptions verified safe. No interactions or allergy risks detected.',
      ddiAlerts,
      allergyAlerts,
      contraindicationAlerts,
      triageResult,
    };
  }

  @ApiOperation({ summary: 'Search ICD-11 and ICD-10 diagnostic entities' })
  @ApiQuery({ name: 'query', required: false })
  @Get('cdss/icd11')
  searchIcd11(@Query('query') query?: string) {
    return this.cdssService.searchIcd11(query || '');
  }

  @ApiOperation({ summary: 'Calculate NEWS2 physiological triage score from vitals' })
  @Post('cdss/triage')
  calculateTriage(@Body() vitals: News2VitalsInput) {
    return this.cdssService.calculateNews2(vitals);
  }

  @ApiOperation({ summary: 'Create a new prescription with medications' })
  @Roles(Role.ADMIN, Role.DOCTOR)
  @Post()
  create(@Request() req: any, @Body() createDto: CreatePrescriptionDto) {
    const doctorId = req.user.id;
    return this.prescriptionsService.create(doctorId, createDto);
  }

  @ApiOperation({ summary: 'List prescriptions with status filter' })
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PHARMACIST, Role.CASHIER)
  @ApiQuery({ name: 'status', enum: PrescriptionStatus, required: false })
  @Get()
  findAll(@Query('status') status?: PrescriptionStatus) {
    return this.prescriptionsService.findAll(status);
  }

  @ApiOperation({ summary: 'Get details of specific prescription' })
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PHARMACIST, Role.CASHIER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Dispense medications and trigger pharmacy invoice' })
  @Roles(Role.ADMIN, Role.PHARMACIST, Role.CASHIER)
  @Patch(':id/dispense')
  dispense(@Request() req: any, @Param('id') id: string) {
    const cashierId = req.user.id;
    return this.prescriptionsService.dispense(id, cashierId);
  }
}
