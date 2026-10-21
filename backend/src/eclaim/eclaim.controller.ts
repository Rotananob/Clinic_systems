import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  EclaimService,
  ElectronicClaim,
  SurveillanceCaseRecord
} from './eclaim.service.js';

@Controller('eclaim')
export class EclaimController {
  eclaimService: EclaimService;

  constructor(eclaimService: EclaimService) {
    this.eclaimService = eclaimService;
  }

  @Get('claims')
  listClaims(
    @Query('insurer') insurer?: string,
    @Query('status') status?: string,
    @Query('patientId') patientId?: string
  ) {
    return {
      success: true,
      data: this.eclaimService.listClaims({ insurer, status, patientId })
    };
  }

  @Post('claims')
  createClaim(@Body() data: Partial<ElectronicClaim>) {
    return {
      success: true,
      data: this.eclaimService.createClaim(data)
    };
  }

  @Get('claims/:id')
  getClaim(@Param('id') id: string) {
    const claim = this.eclaimService.getClaim(id);
    if (!claim) {
      return {
        success: false,
        error: 'Claim not found'
      };
    }
    return {
      success: true,
      data: claim
    };
  }

  @Get('claims/:id/xml')
  getClaimXml(@Param('id') id: string) {
    const claim = this.eclaimService.getClaim(id);
    if (!claim) {
      return { success: false, error: 'Claim not found' };
    }
    return {
      success: true,
      data: {
        claimNumber: claim.claimNumber,
        xml: claim.xmlPayload || this.eclaimService.generateClaimXml(claim)
      }
    };
  }

  @Get('claims/:id/fhir')
  getClaimFhir(@Param('id') id: string) {
    const claim = this.eclaimService.getClaim(id);
    if (!claim) {
      return { success: false, error: 'Claim not found' };
    }
    return {
      success: true,
      data: claim.fhirJsonPayload || this.eclaimService.generateFhirClaimJson(claim)
    };
  }

  @Post('claims/:id/submit')
  submitClaim(@Param('id') id: string) {
    return this.eclaimService.submitClaim(id);
  }

  @Post('claims/:id/adjudicate')
  adjudicateClaim(
    @Param('id') id: string,
    @Body() body: { status: 'PRE_APPROVED' | 'SETTLED' | 'REJECTED'; notes: string }
  ) {
    return {
      success: true,
      data: this.eclaimService.adjudicateClaim(id, body)
    };
  }

  @Post('validate-xml')
  validateXml(@Body() body: { xml: string }) {
    return {
      success: true,
      data: this.eclaimService.validateClaimXml(body.xml)
    };
  }

  @Get('surveillance/diseases')
  listDiseases() {
    return {
      success: true,
      data: this.eclaimService.listReportableDiseases()
    };
  }

  @Get('surveillance/cases')
  listCases(
    @Query('period') period?: string,
    @Query('diseaseCode') diseaseCode?: string
  ) {
    return {
      success: true,
      data: this.eclaimService.listSurveillanceCases(period, diseaseCode)
    };
  }

  @Post('surveillance/cases')
  recordCase(@Body() data: Partial<SurveillanceCaseRecord>) {
    return {
      success: true,
      data: this.eclaimService.recordSurveillanceCase(data)
    };
  }

  @Get('surveillance/dhis2-xml')
  getDhis2Xml(@Query('period') period?: string) {
    const p = period || '2026-W42';
    return {
      success: true,
      data: {
        period: p,
        xml: this.eclaimService.generateMohDhis2Xml(p)
      }
    };
  }

  @Get('surveillance/dhis2-json')
  getDhis2Json(@Query('period') period?: string) {
    const p = period || '2026-W42';
    return {
      success: true,
      data: this.eclaimService.generateMohDhis2Json(p)
    };
  }
}
