import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(uploadedById: string, dto: CreateDocumentDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient ${dto.patientId} not found`);
    }

    return this.prisma.document.create({
      data: {
        patientId: dto.patientId,
        visitId: dto.visitId,
        title: dto.title,
        category: dto.category,
        fileType: dto.fileType,
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        fileUrl: dto.fileUrl,
        notes: dto.notes,
        uploadedById,
      },
      include: {
        patient: {
          select: { id: true, patientCode: true, nameEn: true, nameKh: true },
        },
        uploadedBy: {
          select: { id: true, fullNameEn: true, fullNameKh: true },
        },
        visit: {
          select: { id: true, visitCode: true },
        },
      },
    });
  }

  async findAll(params?: { patientId?: string; category?: string; visitId?: string }) {
    const where: any = {};
    if (params?.patientId) where.patientId = params.patientId;
    if (params?.category) where.category = params.category;
    if (params?.visitId) where.visitId = params.visitId;

    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { id: true, patientCode: true, nameEn: true, nameKh: true },
        },
        uploadedBy: {
          select: { id: true, fullNameEn: true, fullNameKh: true },
        },
        visit: {
          select: { id: true, visitCode: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        patient: true,
        uploadedBy: {
          select: { id: true, fullNameEn: true, fullNameKh: true },
        },
        visit: true,
      },
    });

    if (!doc) {
      throw new NotFoundException(`Document ${id} not found`);
    }

    return doc;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.document.delete({
      where: { id },
    });
  }
}
