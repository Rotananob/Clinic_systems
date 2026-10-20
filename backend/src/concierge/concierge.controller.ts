import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConciergeService, CareProtocolType, ProtocolChannel } from './concierge.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Clinical Care Concierge & Adherence Engine')
@Controller('concierge')
export class ConciergeController {
  private readonly conciergeService: ConciergeService;

  constructor(conciergeService: ConciergeService) {
    this.conciergeService = conciergeService;
  }

  @ApiOperation({ summary: 'Get all patient care communication threads' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'protocol', required: false })
  @ApiQuery({ name: 'search', required: false })
  @Get('threads')
  getThreads(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('protocol') protocol?: string,
    @Query('search') search?: string,
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.conciergeService.getThreads(tenantId, { status, protocol, search });
  }

  @ApiOperation({ summary: 'Trigger automated post-consultation care protocol' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('protocols/trigger')
  triggerProtocol(
    @Req() req: any,
    @Body()
    body: {
      patientId: string;
      patientName: string;
      patientPhone: string;
      visitId: string;
      primaryDoctor: string;
      diagnosis: string;
      protocolType: CareProtocolType;
      channel: ProtocolChannel;
    },
  ) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.conciergeService.triggerProtocol(
      body.patientId,
      body.patientName,
      body.patientPhone,
      body.visitId,
      body.primaryDoctor,
      body.diagnosis,
      body.protocolType,
      body.channel,
      tenantId,
    );
  }

  @ApiOperation({ summary: 'Process incoming patient message and scan for red-flag escalation triggers' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('threads/:threadId/inbound')
  processInbound(
    @Param('threadId') threadId: string,
    @Body() body: { senderName: string; content: string },
  ) {
    return this.conciergeService.processInboundMessage(threadId, body.senderName, body.content);
  }

  @ApiOperation({ summary: 'Send direct doctor reply to patient care thread' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('threads/:threadId/reply')
  sendDoctorReply(
    @Param('threadId') threadId: string,
    @Body() body: { doctorName: string; replyText: string },
  ) {
    return this.conciergeService.sendDoctorReply(threadId, body.doctorName, body.replyText);
  }

  @ApiOperation({ summary: 'Record medication dose confirmation and update adherence score' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('threads/:threadId/adherence')
  recordDose(
    @Param('threadId') threadId: string,
    @Body() body: { confirmed: boolean },
  ) {
    return this.conciergeService.recordDoseConfirmation(threadId, body.confirmed);
  }

  @ApiOperation({ summary: 'Get all active unacknowledged red-flag clinical alerts' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('red-flags')
  getRedFlags(@Req() req: any) {
    const tenantId = req.user?.tenantId || req.headers?.['x-tenant-id'] || 'default-tenant';
    return this.conciergeService.getPendingRedFlags(tenantId);
  }

  @ApiOperation({ summary: 'Acknowledge and clear red-flag alert by physician' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('red-flags/:alertId/acknowledge')
  acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Body() body: { doctorName: string },
  ) {
    return this.conciergeService.acknowledgeRedFlag(alertId, body.doctorName);
  }
}
