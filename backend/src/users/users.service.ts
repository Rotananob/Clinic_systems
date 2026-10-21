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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullNameEn: true,
        fullNameKh: true,
        role: true,
        phone: true,
        avatarUrl: true,
        department: true,
        telegramUsername: true,
        bio: true,
        notificationsEnabled: true,
        tenantId: true,
        tenant: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullNameEn: dto.fullNameEn !== undefined ? dto.fullNameEn : user.fullNameEn,
        fullNameKh: dto.fullNameKh !== undefined ? dto.fullNameKh : user.fullNameKh,
        phone: dto.phone !== undefined ? dto.phone : user.phone,
        avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : user.avatarUrl,
        department: dto.department !== undefined ? dto.department : user.department,
        telegramUsername: dto.telegramUsername !== undefined ? dto.telegramUsername : user.telegramUsername,
        bio: dto.bio !== undefined ? dto.bio : user.bio,
        notificationsEnabled: dto.notificationsEnabled !== undefined ? dto.notificationsEnabled : user.notificationsEnabled,
      },
      select: {
        id: true,
        email: true,
        fullNameEn: true,
        fullNameKh: true,
        role: true,
        phone: true,
        avatarUrl: true,
        department: true,
        telegramUsername: true,
        bio: true,
        notificationsEnabled: true,
        tenantId: true,
        tenant: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }
}
