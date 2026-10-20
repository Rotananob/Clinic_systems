import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { VoiceMedicalNlpService } from './voice-medical-nlp.service';

@Module({
  controllers: [VisitsController],
  providers: [VisitsService, VoiceMedicalNlpService],
  exports: [VisitsService, VoiceMedicalNlpService],
})
export class VisitsModule {}
