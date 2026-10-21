import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import {
  TeleconsultService,
  TeleconsultRoom,
  ParticipantRole,
  SignalType,
  DigitalEPrescription
} from './teleconsult.service.js';

@Controller('teleconsult')
export class TeleconsultController {
  teleconsultService: TeleconsultService;

  constructor(teleconsultService: TeleconsultService) {
    this.teleconsultService = teleconsultService;
  }

  @Get('ice-servers')
  getIceServers() {
    return {
      success: true,
      data: this.teleconsultService.getIceServers()
    };
  }

  @Get('rooms')
  listRooms(
    @Query('status') status?: string,
    @Query('doctorId') doctorId?: string,
    @Query('patientId') patientId?: string
  ) {
    return {
      success: true,
      data: this.teleconsultService.listRooms({ status, doctorId, patientId })
    };
  }

  @Post('rooms')
  createRoom(@Body() data: Partial<TeleconsultRoom>) {
    return {
      success: true,
      data: this.teleconsultService.createRoom(data)
    };
  }

  @Get('rooms/:id')
  getRoom(@Param('id') id: string) {
    const room = this.teleconsultService.getRoom(id);
    if (!room) {
      return {
        success: false,
        error: 'Room not found'
      };
    }
    return {
      success: true,
      data: room
    };
  }

  @Post('rooms/:id/join')
  joinRoom(
    @Param('id') id: string,
    @Body() body: { role: ParticipantRole; name: string }
  ) {
    return {
      success: true,
      data: this.teleconsultService.joinRoom(id, body)
    };
  }

  @Post('rooms/:id/leave')
  leaveRoom(
    @Param('id') id: string,
    @Body() body: { role: ParticipantRole }
  ) {
    return {
      success: true,
      data: this.teleconsultService.leaveRoom(id, body.role)
    };
  }

  @Post('rooms/:id/media-state')
  updateMediaState(
    @Param('id') id: string,
    @Body() body: { role: ParticipantRole; audioMuted?: boolean; videoMuted?: boolean; isScreenSharing?: boolean }
  ) {
    return {
      success: true,
      data: this.teleconsultService.updateMediaState(id, body.role, body)
    };
  }

  @Post('rooms/:id/signals')
  postSignal(
    @Param('id') id: string,
    @Body() body: { senderRole: ParticipantRole; type: SignalType; payload: any }
  ) {
    return {
      success: true,
      data: this.teleconsultService.postSignal(id, body)
    };
  }

  @Get('rooms/:id/signals')
  getSignals(
    @Param('id') id: string,
    @Query('since') since?: string,
    @Query('recipientRole') recipientRole?: ParticipantRole
  ) {
    return {
      success: true,
      data: this.teleconsultService.getSignals(id, since, recipientRole)
    };
  }

  @Post('rooms/:id/chat')
  sendChatMessage(
    @Param('id') id: string,
    @Body() body: { senderRole: ParticipantRole; senderName: string; message: string }
  ) {
    return {
      success: true,
      data: this.teleconsultService.sendChatMessage(id, body)
    };
  }

  @Get('rooms/:id/chat')
  getChatMessages(@Param('id') id: string) {
    return {
      success: true,
      data: this.teleconsultService.getChatMessages(id)
    };
  }

  @Post('rooms/:id/end')
  endCall(
    @Param('id') id: string,
    @Body() body: { clinicalNotes?: string }
  ) {
    return {
      success: true,
      data: this.teleconsultService.endCall(id, body?.clinicalNotes)
    };
  }

  @Get('prescriptions')
  listPrescriptions(@Query('patientId') patientId?: string) {
    return {
      success: true,
      data: this.teleconsultService.listEPrescriptions(patientId)
    };
  }

  @Post('prescriptions')
  createPrescription(@Body() data: Partial<DigitalEPrescription>) {
    return {
      success: true,
      data: this.teleconsultService.createEPrescription(data)
    };
  }

  @Get('prescriptions/:id')
  getPrescription(@Param('id') id: string) {
    const rx = this.teleconsultService.getEPrescription(id);
    if (!rx) {
      return {
        success: false,
        error: 'Prescription not found'
      };
    }
    return {
      success: true,
      data: rx
    };
  }

  @Post('prescriptions/:id/verify')
  verifyPrescription(
    @Param('id') id: string,
    @Body() body: { signatureHash: string }
  ) {
    const result = this.teleconsultService.verifyEPrescription(id, body.signatureHash);
    return {
      success: result.valid,
      data: result
    };
  }

  @Post('prescriptions/:id/dispense')
  dispensePrescription(
    @Param('id') id: string,
    @Body() body: { pharmacyName: string }
  ) {
    return {
      success: true,
      data: this.teleconsultService.dispenseEPrescription(id, body.pharmacyName)
    };
  }
}
