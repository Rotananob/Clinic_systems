import { Controller, Get, Post, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { NarcoticsService, ControlledWastageMethod } from './narcotics.service';
import { Response } from 'express';

@Controller('narcotics')
export class NarcoticsController {
  constructor(private readonly narcoticsService: NarcoticsService) {}

  @Get('safes')
  getSafes() {
    return {
      success: true,
      safes: this.narcoticsService.getSafes(),
    };
  }

  @Get('catalog')
  getMasterCatalog() {
    return {
      success: true,
      catalog: this.narcoticsService.getMasterCatalog(),
    };
  }

  @Get('safes/:safeId/ledger')
  getSafeLedger(@Param('safeId') safeId: string) {
    const transactions = this.narcoticsService.getSafeLedger(safeId);
    return {
      success: true,
      safeId,
      transactionsCount: transactions.length,
      transactions,
    };
  }

  @Get('safes/:safeId/ledger/verify-integrity')
  verifyLedgerIntegrity(@Param('safeId') safeId: string) {
    const verification = this.narcoticsService.verifyLedgerIntegrity(safeId);
    return {
      success: true,
      safeId,
      verification,
    };
  }

  @Post('safes/:safeId/unlock-session')
  createSafeUnlockSession(
    @Param('safeId') safeId: string,
    @Body()
    body: {
      tenantId?: string;
      primaryClinician: { staffId: string; staffName: string; role: string; licenseNumber: string; pin: string };
      witnessClinician: { staffId: string; staffName: string; role: string; licenseNumber: string; pin: string };
      reasonForAccess: string;
    },
  ) {
    const tenantId = body.tenantId || 'tenant-master';
    const session = this.narcoticsService.createSafeUnlockSession(
      safeId,
      tenantId,
      body.primaryClinician,
      body.witnessClinician,
      body.reasonForAccess,
    );
    return {
      success: true,
      safeId,
      ...session,
    };
  }

  @Post('safes/:safeId/transactions/dispense-administer')
  recordDispenseAndAdminister(
    @Param('safeId') safeId: string,
    @Body()
    body: {
      unlockSessionToken: string;
      unitSerialBarcode: string;
      substanceCode: string;
      patientId: string;
      patientName: string;
      visitId: string;
      prescriptionId: string;
      prescribedDoseMg: number;
      administeredDoseMg: number;
      wastedDoseMg: number;
      wastageDestructionMethod?: ControlledWastageMethod;
      wastageClinicalReason?: string;
    },
  ) {
    const transaction = this.narcoticsService.recordDispenseAndAdminister(body);
    return {
      success: true,
      safeId,
      transaction,
    };
  }

  @Post('safes/:safeId/shift-handover')
  executeShiftHandover(
    @Param('safeId') safeId: string,
    @Body()
    body: {
      tenantId?: string;
      shiftIdentifier: string;
      outgoingNurse: { staffId: string; staffName: string; licenseNumber: string; pin: string };
      incomingNurse: { staffId: string; staffName: string; licenseNumber: string; pin: string };
      counts: Array<{ substanceCode: string; physicalCount: number }>;
      notes?: string;
    },
  ) {
    const tenantId = body.tenantId || 'tenant-master';
    const handover = this.narcoticsService.executeShiftHandover({
      safeId,
      tenantId,
      ...body,
    });
    return {
      success: true,
      safeId,
      handover,
    };
  }

  @Get('safes/:safeId/export/xml')
  exportMohDdfXml(
    @Param('safeId') safeId: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const xml = this.narcoticsService.generateMohDdfXml(
      safeId,
      year ? parseInt(year, 10) : 2026,
      month ? parseInt(month, 10) : 10,
    );
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename=moh-ddf-narcotics-${safeId}.xml`);
    res.send(xml);
  }
}
