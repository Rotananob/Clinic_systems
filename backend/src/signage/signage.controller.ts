import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SignageService, QueueStation, QueueDepartment, TicketPriority } from './signage.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Smart Clinic Queueing & Digital Signage')
@Controller('signage')
export class SignageController {
  private readonly signageService: SignageService;

  constructor(signageService: SignageService) {
    this.signageService = signageService;
  }

  @ApiOperation({ summary: 'Get live waiting room queue board data (No Auth Required for public TV monitors)' })
  @ApiQuery({ name: 'tenantId', required: false })
  @Get('board')
  getBoard(@Query('tenantId') tenantId?: string) {
    return this.signageService.getLiveQueueBoard(tenantId || 'default-tenant');
  }

  @ApiOperation({ summary: 'Call ticket to specific room/station and generate bilingual vocal speech prompt' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('tickets/:ticketId/call')
  callTicket(
    @Param('ticketId') ticketId: string,
    @Body() body: { station: QueueStation; staffName?: string },
  ) {
    return this.signageService.callTicket(ticketId, body.station, body.staffName);
  }

  @ApiOperation({ summary: 'Mark ticket as completed upon finishing clinical encounter' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('tickets/:ticketId/complete')
  completeTicket(@Param('ticketId') ticketId: string) {
    return this.signageService.completeTicket(ticketId);
  }

  @ApiOperation({ summary: 'Self-service kiosk ticket issuance for walk-in patient' })
  @Post('kiosk/issue')
  issueTicket(
    @Body()
    body: {
      patientName: string;
      department: QueueDepartment;
      priority?: TicketPriority;
      tenantId?: string;
    },
  ) {
    return this.signageService.issueKioskTicket(
      body.patientName,
      body.department,
      body.priority,
      body.tenantId,
    );
  }
}
