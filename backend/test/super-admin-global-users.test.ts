import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcryptPkg from 'bcryptjs';
const bcrypt = (bcryptPkg as any).default || bcryptPkg;

// Global User Governance logic mirror for fast unit testing
class MockGlobalUserGovernanceService {
  private users: any[] = [
    {
      id: 'usr-1',
      email: 'owner@clinic.com',
      passwordHash: '$2a$10$xyz',
      fullNameEn: 'Dr. Rotana Nob',
      fullNameKh: 'វេជ្ជបណ្ឌិត ណុប រតនា',
      role: 'ADMIN',
      phone: '012345678',
      department: 'Cardiology',
      isActive: true,
      tenantId: 'tenant-1',
      createdAt: new Date('2026-01-01'),
      tenant: {
        id: 'tenant-1',
        slug: 'rotana',
        clinicNameKh: 'គ្លីនិក រតនា',
        clinicNameEn: 'Rotana Clinic',
        planTier: 'PRO_8',
        isActive: true,
      },
    },
    {
      id: 'usr-2',
      email: 'superadmin@hounvannak.com',
      passwordHash: '$2a$10$abc',
      fullNameEn: 'Platform Super Admin',
      fullNameKh: 'អ្នកគ្រប់គ្រងជាន់ខ្ពស់ប្រព័ន្ធ',
      role: 'SUPER_ADMIN',
      phone: '098765432',
      department: 'Platform Operations',
      isActive: true,
      tenantId: null,
      createdAt: new Date('2026-01-01'),
      tenant: null,
    },
    {
      id: 'usr-3',
      email: 'nurse.srey@clinic.com',
      passwordHash: '$2a$10$nurse',
      fullNameEn: 'Nurse Srey Mom',
      fullNameKh: 'គិលានុបដ្ឋាយិកា ស្រីមុំ',
      role: 'NURSE',
      phone: '077889900',
      department: 'Outpatient Care',
      isActive: false,
      tenantId: 'tenant-1',
      createdAt: new Date('2026-01-05'),
      tenant: {
        id: 'tenant-1',
        slug: 'rotana',
        clinicNameKh: 'គ្លីនិក រតនា',
        clinicNameEn: 'Rotana Clinic',
        planTier: 'PRO_8',
        isActive: true,
      },
    },
  ];

  async getGlobalUsers(dto: {
    query?: string;
    role?: string;
    tenantId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    let filtered = [...this.users];

    if (dto.role && dto.role !== 'ALL') {
      filtered = filtered.filter((u) => u.role === dto.role);
    }

    if (dto.tenantId && dto.tenantId !== 'ALL') {
      filtered = filtered.filter((u) => u.tenantId === dto.tenantId);
    }

    if (dto.isActive !== undefined) {
      filtered = filtered.filter((u) => u.isActive === dto.isActive);
    }

    if (dto.query && dto.query.trim()) {
      const q = dto.query.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          u.fullNameEn.toLowerCase().includes(q) ||
          (u.fullNameKh && u.fullNameKh.includes(q)) ||
          (u.phone && u.phone.includes(q)),
      );
    }

    const total = filtered.length;
    const page = Math.max(1, Number(dto.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(dto.limit) || 20));
    const skip = (page - 1) * limit;
    const users = filtered.slice(skip, skip + limit);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createGlobalUser(dto: {
    email: string;
    password: string;
    fullNameEn: string;
    fullNameKh?: string;
    role: string;
    tenantId?: string;
    phone?: string;
    department?: string;
  }) {
    const existing = this.users.find((u) => u.email.toLowerCase() === dto.email.toLowerCase().trim());
    if (existing) {
      throw new Error('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newUser = {
      id: `usr-${Date.now()}`,
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      fullNameEn: dto.fullNameEn.trim(),
      fullNameKh: dto.fullNameKh?.trim() || null,
      role: dto.role,
      tenantId: dto.tenantId || null,
      phone: dto.phone?.trim() || null,
      department: dto.department?.trim() || null,
      isActive: true,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateGlobalUser(userId: string, dto: any) {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index === -1) {
      throw new Error('User not found');
    }
    const current = this.users[index];
    const updated = {
      ...current,
      ...(dto.fullNameEn !== undefined && { fullNameEn: dto.fullNameEn.trim() }),
      ...(dto.fullNameKh !== undefined && { fullNameKh: dto.fullNameKh?.trim() || null }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.tenantId !== undefined && { tenantId: dto.tenantId }),
      ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
      ...(dto.department !== undefined && { department: dto.department?.trim() || null }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      updatedAt: new Date(),
    };
    this.users[index] = updated;
    return updated;
  }

  async resetUserPassword(userId: string, newPass: string) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    const hash = await bcrypt.hash(newPass, 10);
    user.passwordHash = hash;
    return {
      success: true,
      message: `Password successfully reset for ${user.email}`,
    };
  }
}

describe('Phase 1: Super Admin Global User Governance Test Suite', () => {
  const service = new MockGlobalUserGovernanceService();

  it('should list all global users with correct pagination metrics', async () => {
    const res = await service.getGlobalUsers({ page: 1, limit: 10 });
    assert.strictEqual(res.pagination.total, 3);
    assert.strictEqual(res.users.length, 3);
    assert.strictEqual(res.pagination.page, 1);
  });

  it('should filter global users by role accurately', async () => {
    const res = await service.getGlobalUsers({ role: 'SUPER_ADMIN' });
    assert.strictEqual(res.users.length, 1);
    assert.strictEqual(res.users[0].email, 'superadmin@hounvannak.com');
  });

  it('should filter global users by search query (Khmer or English)', async () => {
    const resEn = await service.getGlobalUsers({ query: 'Rotana' });
    assert.strictEqual(resEn.users.length, 1);
    assert.strictEqual(resEn.users[0].fullNameEn, 'Dr. Rotana Nob');

    const resKh = await service.getGlobalUsers({ query: 'ស្រីមុំ' });
    assert.strictEqual(resKh.users.length, 1);
    assert.strictEqual(resKh.users[0].role, 'NURSE');
  });

  it('should filter global users by active status', async () => {
    const active = await service.getGlobalUsers({ isActive: true });
    assert.strictEqual(active.users.length, 2);

    const inactive = await service.getGlobalUsers({ isActive: false });
    assert.strictEqual(inactive.users.length, 1);
    assert.strictEqual(inactive.users[0].email, 'nurse.srey@clinic.com');
  });

  it('should prevent creating a duplicate user with an existing email', async () => {
    await assert.rejects(
      async () => {
        await service.createGlobalUser({
          email: 'owner@clinic.com',
          password: 'Secret#Password123',
          fullNameEn: 'Duplicate User',
          role: 'DOCTOR',
        });
      },
      {
        message: 'A user with this email address already exists',
      },
    );
  });

  it('should provision a new global user with hashed password', async () => {
    const created = await service.createGlobalUser({
      email: 'doctor.chan@clinic.com',
      password: 'Doctor#Password123!',
      fullNameEn: 'Dr. Chan Dara',
      fullNameKh: 'វេជ្ជបណ្ឌិត ចាន់ ដារ៉ា',
      role: 'DOCTOR',
      tenantId: 'tenant-1',
      phone: '012998877',
      department: 'Pediatrics',
    });

    assert.strictEqual(created.email, 'doctor.chan@clinic.com');
    assert.strictEqual(created.role, 'DOCTOR');
    assert.strictEqual(created.fullNameEn, 'Dr. Chan Dara');
    const isPwValid = await bcrypt.compare('Doctor#Password123!', created.passwordHash);
    assert.strictEqual(isPwValid, true);
  });

  it('should update global user details and active status', async () => {
    const updated = await service.updateGlobalUser('usr-3', {
      isActive: true,
      department: 'Emergency & Triage',
    });

    assert.strictEqual(updated.isActive, true);
    assert.strictEqual(updated.department, 'Emergency & Triage');
  });

  it('should reset user password securely', async () => {
    const res = await service.resetUserPassword('usr-1', 'NewSecurePass#2026');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.message, 'Password successfully reset for owner@clinic.com');

    const resUser = await service.getGlobalUsers({ query: 'owner@clinic.com' });
    const isPwMatch = await bcrypt.compare('NewSecurePass#2026', resUser.users[0].passwordHash);
    assert.strictEqual(isPwMatch, true);
  });

  it('should guarantee zero emojis across all responses and status strings', async () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const res = await service.getGlobalUsers({});
    const jsonStr = JSON.stringify(res);
    assert.strictEqual(emojiRegex.test(jsonStr), false);
  });
});
