import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TestAccountThrottleService } from '../common/services/test-account-throttle.service';

@ApiTags('Users & Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly throttleService: TestAccountThrottleService,
  ) {}

  @ApiOperation({ summary: 'Create staff account (Admin, Doctor & Super Admin)' })
  @Roles(Role.ADMIN, Role.DOCTOR)
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
  @Roles(Role.ADMIN, Role.DOCTOR)
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

  @ApiOperation({ summary: 'Toggle user active status (Admin, Doctor & Super Admin)' })
  @Roles(Role.ADMIN, Role.DOCTOR)
  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string, @Req() req: any) {
    return this.usersService.toggleActive(id, req.user?.role);
  }
}
