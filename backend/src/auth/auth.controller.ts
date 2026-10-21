import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { EmailVerificationService } from './email-verification.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import { SendVerificationCodeDto } from './dto/send-code.dto';
import { RegisterWithCodeDto } from './dto/register-with-code.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @ApiOperation({ summary: 'Send 6-digit confirmation code to user Gmail' })
  @ApiResponse({ status: 200, description: 'Confirmation code dispatched' })
  @Post('send-verification-code')
  async sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
    return this.emailVerificationService.sendVerificationCode(dto.email);
  }

  @ApiOperation({ summary: 'Verify 6-digit code and create clinic workspace' })
  @ApiResponse({ status: 201, description: 'Clinic tenant and admin account created with active JWT' })
  @Post('register-with-code')
  async registerWithCode(@Body() dto: RegisterWithCodeDto) {
    // 1. Verify code
    this.emailVerificationService.verifyCode(dto.email, dto.verificationCode);

    // 2. Provision clinic
    return this.authService.registerClinic(dto);
  }

  @ApiOperation({ summary: '60-second instant onboarding for new clinic workspace' })
  @ApiResponse({ status: 201, description: 'Clinic tenant and admin account auto-provisioned' })
  @Post('register-clinic')
  registerClinic(@Body() dto: RegisterClinicDto) {
    return this.authService.registerClinic(dto);
  }

  @ApiOperation({ summary: 'Login with staff credentials' })
  @ApiResponse({ status: 200, description: 'JWT access token and user profile returned' })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Get current user profile and verified server-side permissions' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return this.authService.getCurrentUserWithPermissions(req.user.id);
  }

  @ApiOperation({ summary: 'Get system-wide permissions matrix and role assignments' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  getPermissionsMatrix() {
    return this.authService.getSystemPermissionsMatrix();
  }

  @ApiOperation({ summary: 'Change current user password' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
