import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TestAccountThrottleService } from '../common/services/test-account-throttle.service';

@ApiTags('Staff & Users (RBAC)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly throttleService: TestAccountThrottleService,
  ) {}

  @ApiOperation({ summary: 'Create staff account (Admin & Super Admin only)' })
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto, @Req() req: any) {
    this.throttleService.checkAndIncrement(
      req?.user,
      'STAFF_MANAGE',
      5,
      'បង្កើតគណនីបុគ្គលិក',
      'Staff account creation',
    );
    return this.usersService.create(dto, req.user?.role);
  }

  @ApiOperation({ summary: 'List all staff users' })
  @Roles(Role.ADMIN)
  @ApiQuery({ name: 'role', enum: Role, required: false })
  @Get()
  findAll(@Query('role') role?: Role) {
    return this.usersService.findAll(role);
  }

  @ApiOperation({ summary: 'List all active doctors (Accessible to Reception/Doctor/Admin)' })
  @Get('doctors')
  findDoctors() {
    return this.usersService.findDoctors();
  }

  @ApiOperation({ summary: 'Get current user profile (Accessible to any logged-in user)' })
  @Get('profile')
  getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @ApiOperation({ summary: 'Update current user profile (Accessible to any logged-in user)' })
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() dto: any) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @ApiOperation({ summary: 'Toggle user active status (Admin & Super Admin only)' })
  @Roles(Role.ADMIN)
  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string, @Req() req: any) {
    return this.usersService.toggleActive(id, req.user?.role);
  }
}
