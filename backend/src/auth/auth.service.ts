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
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Recognized Test / Evaluation Accounts
    const isTestAccount =
      normalizedEmail === 'test.admin@hounvannak.com' ||
      normalizedEmail === 'test.superadmin@hounvannak.com' ||
      normalizedEmail === 'demo.superadmin@hounvannak.com' ||
      normalizedEmail === 'demo@clinic.com';

    // 1. Strict Expiration Enforcement: Account expires 31/12/2026
    if (isTestAccount) {
      const now = new Date();
      const expirationDate = new Date('2026-12-31T23:59:59.999Z');
      if (now > expirationDate) {
        throw new UnauthorizedException(
          'គណនីនេះបានផុតកំណត់សុពលភាពត្រឹមថ្ងៃទី 31/12/2026 (This account expired on 31/12/2026).'
        );
      }
    }

    // 2. Fetch User from Database safely
    let user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    // 3. Resilient fallback for Test Account with Real Database Data:
    // If the test user row does not exist in the database, link to the existing primary SUPER_ADMIN
    if (!user && isTestAccount) {
      const validPasswords = [
        'TestAdmin#2026!Clinic',
        'Demo#SuperAdmin2026!MasterKey',
        process.env.SEED_DEMO_PASSWORD || '',
      ].filter(Boolean);

      const isValidTestPass = validPasswords.includes(password);
      if (!isValidTestPass) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // Link to real live DB super admin user so ALL data is real PostgreSQL database data
      const realSuperAdmin = await this.prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
      });

      const fallbackId = realSuperAdmin?.id || '00000000-0000-0000-0000-000000000001';

      const payload = {
        sub: fallbackId,
        email: normalizedEmail,
        role: 'SUPER_ADMIN',
      };

      return {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: fallbackId,
          email: normalizedEmail,
          fullNameEn: realSuperAdmin?.fullNameEn || 'Test Administrator',
          fullNameKh: realSuperAdmin?.fullNameKh || 'អ្នកគ្រប់គ្រងប្រព័ន្ធសាកល្បង',
          role: 'SUPER_ADMIN',
          phone: realSuperAdmin?.phone || '012999000',
          avatarUrl: realSuperAdmin?.avatarUrl || null,
          department: realSuperAdmin?.department || 'Medical Administration',
          telegramUsername: realSuperAdmin?.telegramUsername || null,
          bio: realSuperAdmin?.bio || 'Test access account with real database integration.',
          notificationsEnabled: true,
        },
      };
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account is disabled');
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
