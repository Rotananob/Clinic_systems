import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  ComplianceService,
  MedicalCertificateSignInput,
} from './compliance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('MoH & Cryptographic Compliance')
@Controller('compliance')
export class ComplianceController {
  private readonly complianceService: ComplianceService;

  constructor(complianceService: ComplianceService) {
    this.complianceService = complianceService;
  }

  @ApiOperation({ summary: 'Cryptographically sign a medical certificate with Ed25519 doctor private key' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('certificates/sign')
  signMedicalCertificate(@Body() body: MedicalCertificateSignInput) {
    return this.complianceService.signCertificate(body);
  }

  @ApiOperation({
    summary: 'Public QR verification endpoint for employers, insurers, and authorities (No Auth Required)',
  })
  @ApiQuery({ name: 'sig', required: false })
  @Get('certificates/verify/:certNumber')
  verifyMedicalCertificate(
    @Param('certNumber') certNumber: string,
    @Query('sig') sig?: string,
  ) {
    return this.complianceService.verifyCertificate(certNumber, sig);
  }

  @ApiOperation({ summary: 'Export communicable disease surveillance report in MoH DHIS2 format' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'period', required: false })
  @Get('dhis2/export')
  exportDhis2Surveillance(@Query('period') period?: string) {
    return this.complianceService.exportDhis2Surveillance(period || '202610');
  }

  @ApiOperation({ summary: 'Get list of tracked communicable diseases under MoH national surveillance protocols' })
  @Get('dhis2/diseases')
  getTrackedDiseases() {
    return this.complianceService.getTrackedCommunicableDiseases();
  }
}
