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

    // 3. Isolated Test Account Handler (ដាច់ដោយឡែកពី Acc Zin របស់ Admin / Owner)
    if (isTestAccount) {
      const validPasswords = [
        'TestAdmin#2026!Clinic',
        'Demo#SuperAdmin2026!MasterKey',
        process.env.SEED_DEMO_PASSWORD || '',
      ].filter(Boolean);

      let isMatch = false;
      if (user) {
        isMatch = (await bcrypt.compare(password, user.passwordHash)) || validPasswords.includes(password);
      } else {
        isMatch = validPasswords.includes(password);
      }

      if (!isMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }

      // If user row does not exist in DB yet, create its own distinct row with unique ID
      if (!user) {
        const hash = await bcrypt.hash('TestAdmin#2026!Clinic', 12);
        try {
          user = await this.prisma.user.create({
            data: {
              email: normalizedEmail,
              passwordHash: hash,
              fullNameEn: 'Clinical System Evaluation Admin',
              fullNameKh: 'គណនីវាយតម្លៃប្រព័ន្ធ (Test Account)',
              role: 'SUPER_ADMIN',
              phone: '0120002026',
              department: 'Clinical Evaluation Board',
              bio: 'Dedicated evaluation account expiring on 31/12/2026. Fully isolated from owner acc zin.',
              isActive: true,
            },
          });
        } catch {
          user = await this.prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
          });
        }
      } else {
        // If user already exists, ensure clean dedicated profile (not displaying owner name)
        if (user.fullNameEn?.includes('Rotana Nob') || user.fullNameEn === 'Test Administrator') {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              fullNameEn: 'Clinical System Evaluation Admin',
              fullNameKh: 'គណនីវាយតម្លៃប្រព័ន្ធ (Test Account)',
              department: 'Clinical Evaluation Board',
              bio: 'Dedicated evaluation account expiring on 31/12/2026. Fully isolated from owner acc zin.',
            },
          });
        }
      }

      if (!user) {
        throw new UnauthorizedException('Failed to initialize isolated evaluation account');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: 'SUPER_ADMIN',
        isTestAccount: true,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          fullNameEn: user.fullNameEn,
          fullNameKh: user.fullNameKh,
          role: 'SUPER_ADMIN',
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          department: user.department,
          telegramUsername: user.telegramUsername,
          bio: user.bio,
          notificationsEnabled: user.notificationsEnabled,
          isTestAccount: true,
          expiresAt: '2026-12-31T23:59:59.999Z',
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
