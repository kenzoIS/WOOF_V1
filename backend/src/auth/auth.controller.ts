import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  PasswordResetRequestDto,
  ResetPasswordDto,
  VerifyResetOtpDto,
} from './dto/password-reset.dto';
import {
  ChangePasswordDto,
  LoginActivityDto,
  TwoFactorCodeDto,
} from './dto/security.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password, body.twoFactorCode);
  }

  @Post('forgot-password')
  requestPasswordReset(@Body() body: PasswordResetRequestDto) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Post('verify-reset-otp')
  verifyResetOtp(@Body() body: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(body.email, body.otp);
  }

  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.otp, body.password);
  }

  @Post('change-password')
  changePassword(@Body() body: ChangePasswordDto) {
    return this.authService.changePassword(
      body.email,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Post('2fa/setup')
  setupTwoFactor(@Body() body: PasswordResetRequestDto) {
    return this.authService.setupTwoFactor(body.email);
  }

  @Post('2fa/enable')
  enableTwoFactor(@Body() body: TwoFactorCodeDto) {
    return this.authService.enableTwoFactor(body.email, body.code);
  }

  @Post('2fa/disable')
  disableTwoFactor(@Body() body: TwoFactorCodeDto) {
    return this.authService.disableTwoFactor(body.email, body.code);
  }

  @Post('2fa/status')
  getTwoFactorStatus(@Body() body: PasswordResetRequestDto) {
    return this.authService.getTwoFactorStatus(body.email);
  }

  @Post('activity')
  recordActivity(@Body() body: LoginActivityDto) {
    return this.authService.recordClientActivity(body.action, body.email);
  }

  @Post('activity/list')
  getLoginActivity(@Body() body: PasswordResetRequestDto) {
    return this.authService.getLoginActivity(body.email);
  }
}
