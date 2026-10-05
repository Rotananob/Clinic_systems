import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  private async generateNextPatientCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.patient.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `PAT-${year}-${sequence}`;
  }

  async checkDuplicate(phone: string, nationalId?: string) {
    const conditions: any[] = [{ phone }];
    if (nationalId) {
      conditions.push({ nationalId });
    }

    const duplicates = await this.prisma.patient.findMany({
      where: {
        OR: conditions,
      },
      select: {
        id: true,
        patientCode: true,
        nameEn: true,
        nameKh: true,
        phone: true,
        nationalId: true,
        dob: true,
      },
    });

    return {
      hasDuplicate: duplicates.length > 0,
      candidates: duplicates,
    };
  }

  async create(createPatientDto: CreatePatientDto) {
    const duplicate = await this.checkDuplicate(
      createPatientDto.phone,
      createPatientDto.nationalId,
    );

    if (duplicate.hasDuplicate) {
      throw new ConflictException(
        `A patient with phone number ${createPatientDto.phone} or national ID already exists in system.`,
      );
    }

    const patientCode = await this.generateNextPatientCode();

    return this.prisma.patient.create({
      data: {
        patientCode,
        nameEn: createPatientDto.nameEn,
        nameKh: createPatientDto.nameKh,
        gender: createPatientDto.gender,
        dob: createPatientDto.dob ? new Date(createPatientDto.dob) : null,
        phone: createPatientDto.phone,
        nationalId: createPatientDto.nationalId,
        address: createPatientDto.address,
        bloodType: createPatientDto.bloodType,
        allergies: createPatientDto.allergies,
        emergencyContactName: createPatientDto.emergencyContactName,
        emergencyContactPhone: createPatientDto.emergencyContactPhone,
      },
    });
  }

  async findAll(query: { search?: string; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { patientCode: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { nameKh: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        visits: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              select: { id: true, fullNameEn: true, fullNameKh: true },
            },
            medicalRecord: true,
            prescriptions: {
              include: {
                items: true,
              },
            },
            invoices: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            transactions: true,
          },
        },
        followUps: {
          orderBy: { scheduledDate: 'desc' },
          include: {
            doctor: {
              select: { id: true, fullNameEn: true, fullNameKh: true },
            },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async update(id: string, updateData: Partial<CreatePatientDto>) {
    await this.findOne(id);

    return this.prisma.patient.update({
      where: { id },
      data: {
        ...updateData,
        dob: updateData.dob ? new Date(updateData.dob) : undefined,
      },
    });
  }
}
