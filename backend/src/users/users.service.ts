import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, actorRole?: Role) {
    if (dto.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('System Owner accounts cannot be created via standard user registration.');
    }

    if (dto.role === Role.ADMIN && actorRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only the System Owner (SUPER_ADMIN) can appoint new Administrators.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(`User with email ${dto.email} already exists.`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullNameEn: dto.fullNameEn,
        fullNameKh: dto.fullNameKh,
        role: dto.role,
        phone: dto.phone,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullNameEn: true,
        fullNameKh: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll(role?: Role) {
    const where: any = {};
    if (role) where.role = role;

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullNameEn: true,
        fullNameKh: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findDoctors() {
    return this.findAll(Role.DOCTOR);
  }

  async toggleActive(id: string, actorRole?: Role) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('The System Owner (SUPER_ADMIN) account cannot be deactivated.');
    }

    if (user.role === Role.ADMIN && actorRole !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only the System Owner (SUPER_ADMIN) can deactivate Administrator accounts.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        fullNameEn: true,
        fullNameKh: true,
        isActive: true,
        role: true,
      },
    });
  }
}
