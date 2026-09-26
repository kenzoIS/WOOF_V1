import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  currentPassword: string;

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class TwoFactorCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  code: string;
}

export class LoginActivityDto {
  @IsIn(['logout', 'session_timeout'])
  action: 'logout' | 'session_timeout';

  @IsOptional()
  @IsEmail()
  email?: string;
}
