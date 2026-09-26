import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomBytes, randomInt, randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import { SupabaseService } from '../common/supabase/supabase.service';

export interface DashboardSession {
  accessToken: string;
  email: string;
  expiresAt: string;
}

export type LoginActivityAction = 'login' | 'logout' | 'session_timeout';

export interface LoginActivityEntry {
  id: string;
  action: LoginActivityAction;
  email: string;
  timestamp: string;
}

const DEFAULT_ADMIN_EMAIL = 'woof@admin.ph';
const DEFAULT_ADMIN_PASSWORD = 'woofdash123';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const MAX_LOGIN_ACTIVITY = 100;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

type ResetOtpRecord = {
  email: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
};

@Injectable()
export class AuthService {
  private readonly resetOtps = new Map<string, ResetOtpRecord>();
  private readonly loginActivity: LoginActivityEntry[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async login(
    email: string,
    password: string,
    twoFactorCode?: string,
  ): Promise<DashboardSession | { requiresTwoFactor: true; email: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const adminEmail = this.getAdminEmail();

    if (normalizedEmail !== adminEmail) {
      throw new UnauthorizedException('Invalid dashboard credentials');
    }

    await this.ensureSupabaseAdminUser(adminEmail);
    const user = await this.findSupabaseUserByEmail(adminEmail);
    const twoFactor = this.getUserTwoFactor(user);

    if (twoFactor.enabled) {
      if (!twoFactorCode?.trim()) {
        return { requiresTwoFactor: true, email: adminEmail };
      }

      if (!this.verifyTotp(twoFactor.secret, twoFactorCode)) {
        throw new UnauthorizedException('Invalid authenticator code');
      }
    }

    const { data, error } =
      await this.supabaseService.client.auth.signInWithPassword({
        email: adminEmail,
        password,
      });

    if (error || !data.session) {
      throw new UnauthorizedException('Invalid dashboard credentials');
    }

    this.recordLoginActivity('login', adminEmail);

    return {
      accessToken: data.session.access_token || randomUUID(),
      email: adminEmail,
      expiresAt: data.session.expires_at
        ? new Date(data.session.expires_at * 1000).toISOString()
        : new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const adminEmail = this.getAdminEmail();

    if (normalizedEmail !== adminEmail) {
      throw new UnauthorizedException('Invalid dashboard email');
    }

    await this.ensureSupabaseAdminUser(adminEmail);

    const otp = String(randomInt(100000, 1000000));
    this.resetOtps.set(adminEmail, {
      email: adminEmail,
      otpHash: this.hashOtp(otp),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
      verified: false,
    });

    await this.sendResetOtp(adminEmail, otp);

    return {
      success: true,
      expiresInMinutes: OTP_TTL_MS / 60000,
    };
  }

  verifyResetOtp(email: string, otp: string) {
    const record = this.getValidOtpRecord(email, otp);
    record.verified = true;

    return { success: true };
  }

  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const adminEmail = this.getAdminEmail();

    if (normalizedEmail !== adminEmail) {
      throw new UnauthorizedException('Invalid dashboard email');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    await this.ensureSupabaseAdminUser(adminEmail);

    const { error: signInError } =
      await this.supabaseService.client.auth.signInWithPassword({
        email: adminEmail,
        password: currentPassword,
      });

    if (signInError) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const user = await this.findSupabaseUserByEmail(adminEmail);
    if (!user) {
      throw new BadRequestException('Dashboard user was not found');
    }

    const { error } =
      await this.supabaseService.client.auth.admin.updateUserById(user.id, {
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          ...(user.user_metadata ?? {}),
          role: 'dashboard_admin',
          app: 'woof',
        },
      });

    if (error) {
      throw error;
    }

    return { success: true };
  }

  async setupTwoFactor(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const adminEmail = this.getAdminEmail();

    if (normalizedEmail !== adminEmail) {
      throw new UnauthorizedException('Invalid dashboard email');
    }

    const user = await this.ensureSupabaseAdminUser(adminEmail);
    const secret = this.generateBase32Secret();
    const issuer = 'WOOF Dashboard';
    const otpauthUri = `otpauth://totp/${encodeURIComponent(
      issuer,
    )}:${encodeURIComponent(adminEmail)}?secret=${secret}&issuer=${encodeURIComponent(
      issuer,
    )}&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`;

    await this.updateTwoFactorMetadata(user.id, {
      ...(user.user_metadata ?? {}),
      twoFactor: {
        enabled: false,
        secret,
        pending: true,
      },
    });

    return {
      secret,
      otpauthUri,
    };
  }

  async enableTwoFactor(email: string, code: string) {
    const user = await this.getAdminUserOrThrow(email);
    const twoFactor = this.getUserTwoFactor(user);

    if (!twoFactor.secret || !this.verifyTotp(twoFactor.secret, code)) {
      throw new UnauthorizedException('Invalid authenticator code');
    }

    await this.updateTwoFactorMetadata(user.id, {
      ...(user.user_metadata ?? {}),
      twoFactor: {
        enabled: true,
        secret: twoFactor.secret,
        enabledAt: new Date().toISOString(),
      },
    });

    return { enabled: true };
  }

  async disableTwoFactor(email: string, code: string) {
    const user = await this.getAdminUserOrThrow(email);
    const twoFactor = this.getUserTwoFactor(user);

    if (twoFactor.enabled && !this.verifyTotp(twoFactor.secret, code)) {
      throw new UnauthorizedException('Invalid authenticator code');
    }

    await this.updateTwoFactorMetadata(user.id, {
      ...(user.user_metadata ?? {}),
      twoFactor: {
        enabled: false,
      },
    });

    return { enabled: false };
  }

  async getTwoFactorStatus(email: string) {
    const user = await this.getAdminUserOrThrow(email);
    const twoFactor = this.getUserTwoFactor(user);

    return {
      enabled: twoFactor.enabled,
      configured: Boolean(twoFactor.secret),
    };
  }

  recordClientActivity(action: 'logout' | 'session_timeout', email?: string) {
    this.recordLoginActivity(action, email || this.getAdminEmail());
    return { success: true };
  }

  getLoginActivity(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const adminEmail = this.getAdminEmail();

    if (normalizedEmail !== adminEmail) {
      throw new UnauthorizedException('Invalid dashboard email');
    }

    return this.loginActivity
      .filter((entry) => entry.email === adminEmail)
      .slice(0, 25);
  }

  async resetPassword(email: string, otp: string, password: string) {
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const record = this.getValidOtpRecord(normalizedEmail, otp);

    if (!record.verified) {
      throw new UnauthorizedException('OTP must be verified first');
    }

    const user = await this.findSupabaseUserByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('Dashboard user was not found');
    }

    const { error } =
      await this.supabaseService.client.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
        user_metadata: {
          role: 'dashboard_admin',
          app: 'woof',
        },
      });

    if (error) {
      throw error;
    }

    this.resetOtps.delete(normalizedEmail);

    return { success: true };
  }

  private getAdminEmail() {
    return (
      this.configService.get<string>('WOOF_ADMIN_EMAIL') || DEFAULT_ADMIN_EMAIL
    )
      .trim()
      .toLowerCase();
  }

  private getDefaultAdminPassword() {
    return (
      this.configService.get<string>('WOOF_ADMIN_PASSWORD') ||
      DEFAULT_ADMIN_PASSWORD
    ).trim();
  }

  private async ensureSupabaseAdminUser(email: string) {
    const existingUser = await this.findSupabaseUserByEmail(email);

    if (existingUser) {
      return existingUser;
    }

    const { data, error } =
      await this.supabaseService.client.auth.admin.createUser({
        email,
        password: this.getDefaultAdminPassword(),
        email_confirm: true,
        user_metadata: {
          role: 'dashboard_admin',
          app: 'woof',
        },
      });

    if (error) {
      throw error;
    }

    return data.user;
  }

  private async findSupabaseUserByEmail(email: string) {
    const supabase = this.supabaseService.client;
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      throw error;
    }

    return data.users.find(
      (user) => user.email?.toLowerCase() === email,
    );
  }

  private async getAdminUserOrThrow(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const adminEmail = this.getAdminEmail();

    if (normalizedEmail !== adminEmail) {
      throw new UnauthorizedException('Invalid dashboard email');
    }

    const user = await this.ensureSupabaseAdminUser(adminEmail);
    if (!user) {
      throw new BadRequestException('Dashboard user was not found');
    }

    return user;
  }

  private getUserTwoFactor(user: any) {
    const twoFactor = user?.user_metadata?.twoFactor ?? {};
    return {
      enabled: Boolean(twoFactor.enabled && twoFactor.secret),
      secret: typeof twoFactor.secret === 'string' ? twoFactor.secret : '',
    };
  }

  private async updateTwoFactorMetadata(
    userId: string,
    userMetadata: Record<string, unknown>,
  ) {
    const { error } =
      await this.supabaseService.client.auth.admin.updateUserById(userId, {
        user_metadata: userMetadata,
      });

    if (error) {
      throw error;
    }
  }

  private getValidOtpRecord(email: string, otp: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const record = this.resetOtps.get(normalizedEmail);

    if (!record || record.expiresAt < Date.now()) {
      this.resetOtps.delete(normalizedEmail);
      throw new UnauthorizedException('OTP is invalid or expired');
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      this.resetOtps.delete(normalizedEmail);
      throw new UnauthorizedException('Too many invalid OTP attempts');
    }

    if (record.otpHash !== this.hashOtp(otp)) {
      record.attempts += 1;
      throw new UnauthorizedException('OTP is invalid or expired');
    }

    return record;
  }

  private hashOtp(otp: string) {
    return createHash('sha256').update(otp).digest('hex');
  }

  private generateBase32Secret() {
    const bytes = randomBytes(20);
    let bits = '';
    let secret = '';

    for (const byte of bytes) {
      bits += byte.toString(2).padStart(8, '0');
    }

    for (let index = 0; index + 5 <= bits.length; index += 5) {
      secret += BASE32_ALPHABET[parseInt(bits.slice(index, index + 5), 2)];
    }

    return secret;
  }

  private decodeBase32Secret(secret: string) {
    const cleanSecret = secret.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
    let bits = '';

    for (const char of cleanSecret) {
      const value = BASE32_ALPHABET.indexOf(char);
      if (value === -1) {
        throw new UnauthorizedException('Invalid authenticator setup');
      }
      bits += value.toString(2).padStart(5, '0');
    }

    const bytes: number[] = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) {
      bytes.push(parseInt(bits.slice(index, index + 8), 2));
    }

    return Buffer.from(bytes);
  }

  private generateTotp(secret: string, stepOffset = 0) {
    const counter = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS) + stepOffset;
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter));

    const hmac = createHmac('sha1', this.decodeBase32Secret(secret))
      .update(counterBuffer)
      .digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
  }

  private verifyTotp(secret: string, code: string) {
    const cleanCode = code.replace(/\D/g, '');
    if (cleanCode.length !== TOTP_DIGITS) {
      return false;
    }

    return [-1, 0, 1].some(
      (offset) => this.generateTotp(secret, offset) === cleanCode,
    );
  }

  private recordLoginActivity(action: LoginActivityAction, email: string) {
    this.loginActivity.unshift({
      id: randomUUID(),
      action,
      email: email.trim().toLowerCase(),
      timestamp: new Date().toISOString(),
    });

    if (this.loginActivity.length > MAX_LOGIN_ACTIVITY) {
      this.loginActivity.length = MAX_LOGIN_ACTIVITY;
    }
  }

  private async sendResetOtp(email: string, otp: string) {
    const smtpUser = this.configService.get<string>('WOOF_SMTP_USER');
    const smtpAppPassword = this.configService
      .get<string>('WOOF_SMTP_APP_PASSWORD')
      ?.replace(/\s+/g, '');

    if (!smtpUser || !smtpAppPassword) {
      throw new InternalServerErrorException(
        'Password reset email is not configured',
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpAppPassword,
      },
    });

    await transporter.sendMail({
      from: `"WOOF Dashboard" <${smtpUser}>`,
      to: email,
      subject: 'Your WOOF password reset OTP',
      text: `Your WOOF password reset OTP is ${otp}. It expires in 10 minutes.`,
      html: `
        <p>Your WOOF password reset OTP is:</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:4px;">${otp}</p>
        <p>This code expires in 10 minutes.</p>
      `,
    });
  }
}
