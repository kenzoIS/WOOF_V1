import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomInt, randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import { SupabaseService } from '../common/supabase/supabase.service';

export interface DashboardSession {
  accessToken: string;
  email: string;
  expiresAt: string;
}

const DEFAULT_ADMIN_EMAIL = 'woof@admin.ph';
const DEFAULT_ADMIN_PASSWORD = 'woofdash123';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

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

  constructor(
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async login(email: string, password: string): Promise<DashboardSession> {
    const normalizedEmail = email.trim().toLowerCase();
    const adminEmail = this.getAdminEmail();

    if (normalizedEmail !== adminEmail) {
      throw new UnauthorizedException('Invalid dashboard credentials');
    }

    await this.ensureSupabaseAdminUser(adminEmail);

    const { data, error } =
      await this.supabaseService.client.auth.signInWithPassword({
        email: adminEmail,
        password,
      });

    if (error || !data.session) {
      throw new UnauthorizedException('Invalid dashboard credentials');
    }

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
