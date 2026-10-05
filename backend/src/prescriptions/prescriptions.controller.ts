import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrescriptionStatus } from '@prisma/client';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @ApiOperation({ summary: 'Create a new prescription with medications' })
  @Post()
  create(@Request() req: any, @Body() createDto: CreatePrescriptionDto) {
    const doctorId = req.user.id;
    return this.prescriptionsService.create(doctorId, createDto);
  }

  @ApiOperation({ summary: 'List prescriptions with status filter' })
  @ApiQuery({ name: 'status', enum: PrescriptionStatus, required: false })
  @Get()
  findAll(@Query('status') status?: PrescriptionStatus) {
    return this.prescriptionsService.findAll(status);
  }

  @ApiOperation({ summary: 'Get details of specific prescription' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prescriptionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Dispense medications and trigger pharmacy invoice' })
  @Patch(':id/dispense')
  dispense(@Request() req: any, @Param('id') id: string) {
    const cashierId = req.user.id;
    return this.prescriptionsService.dispense(id, cashierId);
  }
}
