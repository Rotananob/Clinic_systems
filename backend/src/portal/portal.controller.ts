import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  PortalService,
  MedicationReminderInput,
  FollowUpReminderInput,
  QueueTurnAlertInput,
} from './portal.service';

@ApiTags('Patient Portal & Telegram Mini App')
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @ApiOperation({ summary: 'Get patient profile, live queue ticket, prescriptions, and invoices' })
  @ApiQuery({ name: 'tenantId', required: false })
  @Get('patient/:identifier')
  getPatientData(
    @Param('identifier') identifier: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.portalService.getPatientPortalData(identifier, tenantId);
  }

  @ApiOperation({ summary: 'Get live clinic queue overview for public screen or patient app' })
  @ApiQuery({ name: 'tenantId', required: false })
  @Get('queue/live')
  getLiveQueue(@Query('tenantId') tenantId?: string) {
    return this.portalService.getLiveClinicQueue(tenantId);
  }

  @ApiOperation({ summary: 'Preview or generate medication dosage reminder text' })
  @Post('reminders/medication')
  formatMedicationReminder(@Body() body: MedicationReminderInput) {
    const text = this.portalService.formatMedicationReminder(body);
    return {
      success: true,
      messageText: text,
      category: 'MEDICATION_REMINDER',
    };
  }

  @ApiOperation({ summary: 'Preview or generate follow-up appointment reminder text' })
  @Post('reminders/appointment')
  formatAppointmentReminder(@Body() body: FollowUpReminderInput) {
    const text = this.portalService.formatFollowUpReminder(body);
    return {
      success: true,
      messageText: text,
      category: 'APPOINTMENT_REMINDER',
    };
  }

  @ApiOperation({ summary: 'Preview or generate instant queue call alert text' })
  @Post('reminders/queue-call')
  formatQueueCall(@Body() body: QueueTurnAlertInput) {
    const text = this.portalService.formatQueueTurnAlert(body);
    return {
      success: true,
      messageText: text,
      category: 'QUEUE_CALL_ALERT',
    };
  }
}
