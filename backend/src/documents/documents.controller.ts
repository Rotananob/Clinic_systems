import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Medical Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @ApiOperation({ summary: 'Upload and attach a medical document or lab result' })
  @Post()
  create(@Request() req: any, @Body() dto: CreateDocumentDto) {
    const uploadedById = req.user.id;
    return this.documentsService.create(uploadedById, dto);
  }

  @ApiOperation({ summary: 'List medical documents by patient or category' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'visitId', required: false })
  @Get()
  findAll(
    @Query('patientId') patientId?: string,
    @Query('category') category?: string,
    @Query('visitId') visitId?: string,
  ) {
    return this.documentsService.findAll({ patientId, category, visitId });
  }

  @ApiOperation({ summary: 'Get document details and content URL' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Delete a medical document' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
