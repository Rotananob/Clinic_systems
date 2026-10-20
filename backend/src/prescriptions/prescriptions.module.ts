import { Module } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { ClinicalDecisionSupportService } from './cdss.service';

@Module({
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, ClinicalDecisionSupportService],
  exports: [PrescriptionsService, ClinicalDecisionSupportService],
})
export class PrescriptionsModule {}
