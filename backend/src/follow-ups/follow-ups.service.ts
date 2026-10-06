import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';
import { FollowUpStatus } from '@prisma/client';

@Injectable()
export class FollowUpsService {
  constructor(private prisma: PrismaService) {}

  async create(fallbackDoctorId: string, dto: CreateFollowUpDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${dto.patientId} not found`);
    }

    const doctorId = dto.doctorId || fallbackDoctorId;

    return this.prisma.followUp.create({
      data: {
        patientId: dto.patientId,
        doctorId,
        visitId: dto.visitId,
        scheduledDate: new Date(dto.scheduledDate),
        reason: dto.reason,
        notes: dto.notes,
        status: FollowUpStatus.SCHEDULED,
      },
      include: {
        patient: {
          select: { id: true, patientCode: true, nameEn: true, nameKh: true, phone: true },
        },
        doctor: {
          select: { id: true, fullNameEn: true, fullNameKh: true },
        },
        visit: {
          select: { id: true, visitCode: true, reason: true },
        },
      },
    });
  }

  async findAll(params?: {
    status?: FollowUpStatus;
    patientId?: string;
    doctorId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.patientId) where.patientId = params.patientId;
    if (params?.doctorId) where.doctorId = params.doctorId;

    if (params?.fromDate || params?.toDate) {
      where.scheduledDate = {};
      if (params?.fromDate) where.scheduledDate.gte = new Date(params.fromDate);
      if (params?.toDate) where.scheduledDate.lte = new Date(params.toDate);
    }

    return this.prisma.followUp.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: {
        patient: {
          select: { id: true, patientCode: true, nameEn: true, nameKh: true, phone: true },
        },
        doctor: {
          select: { id: true, fullNameEn: true, fullNameKh: true },
        },
        visit: {
          select: { id: true, visitCode: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.followUp.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: {
          select: { id: true, fullNameEn: true, fullNameKh: true },
        },
        visit: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Follow-up appointment ${id} not found`);
    }

    return item;
  }

  async update(id: string, dto: UpdateFollowUpDto) {
    await this.findOne(id);

    return this.prisma.followUp.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.scheduledDate ? { scheduledDate: new Date(dto.scheduledDate) } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: {
        patient: {
          select: { id: true, patientCode: true, nameEn: true, nameKh: true, phone: true },
        },
        doctor: {
          select: { id: true, fullNameEn: true, fullNameKh: true },
        },
      },
    });
  }
}
