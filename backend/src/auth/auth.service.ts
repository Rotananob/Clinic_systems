import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const normalizedEmail = email.trim().toLowerCase();

    let user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    const isDemoAccount =
      normalizedEmail === 'demo.superadmin@hounvannak.com' ||
      normalizedEmail === 'demo@clinic.com';

    // Auto-provision demo super admin account if not yet seeded
    if (!user && isDemoAccount) {
      const demoDefaultPass = process.env.SEED_DEMO_PASSWORD || 'Demo#SuperAdmin2026!MasterKey';
      if (password === demoDefaultPass) {
        const demoHash = await bcrypt.hash(demoDefaultPass, 12);
        user = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            passwordHash: demoHash,
            fullNameEn: 'Demo Super Administrator (Evaluation)',
            fullNameKh: 'គណនីសាកល្បងជាន់ខ្ពស់ (Super Admin Demo)',
            role: 'SUPER_ADMIN' as any,
            isActive: true,
            expiresAt: new Date('2026-12-31T23:59:59.999Z'),
            department: 'Executive Medical Board',
            phone: '012999000',
            bio: 'Pre-configured full-access evaluation account expiring 31/12/2026.',
          },
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account is disabled');
    }

    // Check account expiration (e.g. Test / Demo account expiring on 31/12/2026)
    const now = new Date();
    const effectiveExpiry = user.expiresAt || (isDemoAccount ? new Date('2026-12-31T23:59:59.999Z') : null);

    if (effectiveExpiry && now > new Date(effectiveExpiry)) {
      throw new UnauthorizedException(
        'គណនីសាកល្បងនេះបានផុតកំណត់សុពលភាពត្រឹមថ្ងៃទី 31/12/2026 (This test demo account expired on 31/12/2026).'
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullNameEn: user.fullNameEn,
        fullNameKh: user.fullNameKh,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        department: user.department,
        telegramUsername: user.telegramUsername,
        bio: user.bio,
        notificationsEnabled: user.notificationsEnabled,
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match.');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return {
      success: true,
      message: 'Password updated successfully.',
    };
  }
}
