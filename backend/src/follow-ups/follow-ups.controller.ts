import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FollowUpsService } from './follow-ups.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FollowUpStatus } from '@prisma/client';

@ApiTags('Follow-Ups & Recalls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @ApiOperation({ summary: 'Schedule a patient clinical follow-up appointment' })
  @Post()
  create(@Request() req: any, @Body() dto: CreateFollowUpDto) {
    const doctorId = req.user.id;
    return this.followUpsService.create(doctorId, dto);
  }

  @ApiOperation({ summary: 'List scheduled follow-ups with date and status filters' })
  @ApiQuery({ name: 'status', enum: FollowUpStatus, required: false })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'doctorId', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @Get()
  findAll(
    @Query('status') status?: FollowUpStatus,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.followUpsService.findAll({ status, patientId, doctorId, fromDate, toDate });
  }

  @ApiOperation({ summary: 'Get specific follow-up appointment details' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.followUpsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update follow-up appointment status or date' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFollowUpDto) {
    return this.followUpsService.update(id, dto);
  }
}
