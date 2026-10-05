import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @ApiOperation({ summary: 'Register a new patient' })
  @Post()
  create(@Body() createPatientDto: CreatePatientDto) {
    return this.patientsService.create(createPatientDto);
  }

  @ApiOperation({ summary: 'Check for potential duplicate patient by phone or national ID' })
  @ApiQuery({ name: 'phone', required: true })
  @ApiQuery({ name: 'nationalId', required: false })
  @Get('check-duplicate')
  checkDuplicate(
    @Query('phone') phone: string,
    @Query('nationalId') nationalId?: string,
  ) {
    return this.patientsService.checkDuplicate(phone, nationalId);
  }

  @ApiOperation({ summary: 'List and search patients with pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.patientsService.findAll({ search, page, limit });
  }

  @ApiOperation({ summary: 'Get full Patient 360 profile with complete clinical history' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update patient information' })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreatePatientDto>,
  ) {
    return this.patientsService.update(id, updateDto);
  }
}
