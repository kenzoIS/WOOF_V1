import {
  Injectable,
  InternalServerErrorException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../common/supabase/supabase.service';
import { MfaEnrollmentRateLimitService } from './mfa-enrollment-rate-limit.service';
import { AuditService } from '../audit/audit.service';

export interface DashboardSession {
  email: string;
  expiresAt: string;
  accessToken: string;
  refreshToken: string;
  mfaRequired: boolean;
}
const DEFAULT_ADMIN_EMAIL = 'woof@admin.ph';
const RECENT_AUTH_MS = 10 * 60 * 1000;

/** Passwords and TOTP secrets are owned exclusively by Supabase Auth. */
@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
    private readonly mfaEnrollmentRateLimit: MfaEnrollmentRateLimitService,
    @Optional() private readonly auditService?: AuditService,
  ) {}

  async login(email: string, password: string, code?: string): Promise<DashboardSession | { requiresTwoFactor: true; email: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== this.adminEmail()) {
      void this.auditService?.record({
        actor: 'System',
        actorType: 'system',
        action: 'Failed Login Attempt',
        module: 'auth',
        category: 'security',
        target: normalizedEmail,
        status: 'failed',
        metadata: { email: normalizedEmail, reason: 'Unrecognized administrative account' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const { data, error } = await this.supabase.createAuthClient().auth.signInWithPassword({ email: normalizedEmail, password });
    if (error || !data.session || !data.user) {
      void this.auditService?.record({
        actor: 'System',
        actorType: 'system',
        action: 'Failed Login Attempt',
        module: 'auth',
        category: 'security',
        target: normalizedEmail,
        status: 'failed',
        metadata: { email: normalizedEmail, reason: 'Invalid password' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const client = this.sessionClient(data.session.access_token);
    const factors = await client.auth.mfa.listFactors();
    const factor = factors.data?.totp.find((item) => item.status === 'verified');
    if (factor) {
      if (!code?.trim()) return { requiresTwoFactor: true, email: normalizedEmail };
      const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: factor.id });
      if (challengeError || !challenge) {
        void this.auditService?.record({
          actor: 'System',
          actorType: 'system',
          action: 'MFA Verification Failed',
          module: 'auth',
          category: 'security',
          target: normalizedEmail,
          status: 'failed',
          metadata: { email: normalizedEmail, reason: 'Failed to create MFA challenge' },
        });
        throw new UnauthorizedException('Invalid credentials');
      }
      const { data: verified, error: verifyError } = await client.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code: code.trim() });
      if (verifyError || !verified) {
        void this.auditService?.record({
          actor: 'System',
          actorType: 'system',
          action: 'MFA Verification Failed',
          module: 'auth',
          category: 'security',
          target: normalizedEmail,
          status: 'failed',
          metadata: { email: normalizedEmail, reason: 'Invalid or expired TOTP code' },
        });
        throw new UnauthorizedException('Invalid credentials');
      }
      data.session.access_token = verified.access_token;
      data.session.expires_at = Math.floor(Date.now() / 1000) + verified.expires_in;

      void this.auditService?.record({
        actor: 'Owner',
        actorType: 'user',
        action: 'Owner Logged In (MFA Verified)',
        module: 'auth',
        category: 'security',
        target: normalizedEmail,
        status: 'success',
        metadata: { email: normalizedEmail, mfaUsed: true },
      });
    } else {
      void this.auditService?.record({
        actor: 'Owner',
        actorType: 'user',
        action: 'Owner Logged In',
        module: 'auth',
        category: 'security',
        target: normalizedEmail,
        status: 'success',
        metadata: { email: normalizedEmail, mfaUsed: false },
      });
    }

    return {
      email: normalizedEmail,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date((data.session.expires_at || 0) * 1000).toISOString(),
      mfaRequired: !(await this.hasAal2(data.session.access_token)),
    };
  }

  async requestPasswordReset(email: string) {
    // Identical response for every address prevents account enumeration.
    if (email.trim().toLowerCase() === this.adminEmail()) {
      try {
        await this.supabase.createAuthClient().auth.resetPasswordForEmail(this.adminEmail(), { redirectTo: this.recoveryRedirectUrl() });
        void this.auditService?.record({
          actor: 'Owner',
          actorType: 'user',
          action: 'Password Reset Requested',
          module: 'auth',
          category: 'security',
          target: this.adminEmail(),
          status: 'success',
        });
      } catch {
        // Deliberately suppress provider failures to keep the response non-enumerating.
      }
    }
    return { success: true };
  }

  async resetPassword(accessToken: string, password: string) {
    await this.requireRecentAdminSession(accessToken);
    const client = this.sessionClient(accessToken);
    const { error: updateError } = await client.auth.updateUser({ password });
    if (updateError) throw new UnauthorizedException('Unable to update password');
    void this.auditService?.record({
      actor: 'Owner',
      actorType: 'user',
      action: 'Password Reset Completed',
      module: 'auth',
      category: 'security',
      target: this.adminEmail(),
      status: 'success',
    });
    return { success: true };
  }

  async changePassword(accessToken: string, password: string) {
    await this.requireRecentAdminSession(accessToken);
    const { error } = await this.sessionClient(accessToken).auth.updateUser({ password });
    if (error) throw new UnauthorizedException('Unable to update password');
    void this.auditService?.record({
      actor: 'Owner',
      actorType: 'user',
      action: 'Changed Account Password',
      module: 'auth',
      category: 'security',
      target: this.adminEmail(),
      status: 'success',
    });
    return { success: true };
  }

  async enableTwoFactor(accessToken: string, factorId: string, code: string) {
    await this.requireRecentAdminSession(accessToken);
    const client = this.sessionClient(accessToken);
    const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) throw new UnauthorizedException('Invalid authenticator code');
    const { error } = await client.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    if (error) throw new UnauthorizedException('Invalid authenticator code');
    void this.auditService?.record({
      actor: 'Owner',
      actorType: 'user',
      action: 'Enabled Two-Factor Authentication',
      module: 'auth',
      category: 'security',
      target: this.adminEmail(),
      status: 'success',
      stateBefore: 'disabled',
      stateAfter: 'enabled',
    });
    return { enabled: true };
  }

  async disableTwoFactor(accessToken: string, factorId: string, code: string) {
    await this.requireRecentAdminSession(accessToken);
    const client = this.sessionClient(accessToken);
    const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) throw new UnauthorizedException('Invalid authenticator code');
    const { data: verified, error: verifyError } = await client.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
    if (verifyError || !verified) throw new UnauthorizedException('Invalid authenticator code');
    const { error } = await this.sessionClient(verified.access_token).auth.mfa.unenroll({ factorId });
    if (error) throw new InternalServerErrorException('Unable to disable authenticator');
    void this.auditService?.record({
      actor: 'Owner',
      actorType: 'user',
      action: 'Disabled Two-Factor Authentication',
      module: 'auth',
      category: 'security',
      target: this.adminEmail(),
      status: 'success',
      stateBefore: 'enabled',
      stateAfter: 'disabled',
    });
    return { enabled: false };
  }

  async getTwoFactorStatus(accessToken: string) {
    await this.requireAdminSession(accessToken);
    const { data, error } = await this.sessionClient(accessToken).auth.mfa.listFactors();
    if (error) throw new UnauthorizedException('Unable to retrieve authenticator status');
    const factor = data.totp.find((item) => item.status === 'verified');
    return { enabled: Boolean(factor), configured: data.totp.length > 0, factorId: factor?.id };
  }

  async verifyMfaEnrollment(
    accessToken: string,
    refreshToken: string,
    factorId: string,
    code: string,
    clientIp: string,
  ) {
    const authClient = this.supabase.createAuthClient();
    const { data: session, error: sessionError } = await authClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError || !session.session || session.user?.email?.toLowerCase() !== this.adminEmail()) {
      throw new UnauthorizedException('Authentication required');
    }

    await this.mfaEnrollmentRateLimit.assertAllowed(session.user.id, clientIp);

    const client = this.sessionClient(session.session.access_token);
    const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) throw new UnauthorizedException('Unable to verify code');

    const { data: verified, error: verifyError } = await client.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError || !verified?.access_token || !verified.refresh_token) {
      void this.auditService?.record({
        actor: 'System',
        actorType: 'system',
        action: 'MFA Enrollment Verification Failed',
        module: 'auth',
        category: 'security',
        target: this.adminEmail(),
        status: 'failed',
        metadata: { clientIp },
      });
      throw new UnauthorizedException('Unable to verify code');
    }
    void this.auditService?.record({
      actor: 'Owner',
      actorType: 'user',
      action: 'MFA Enrollment Completed',
      module: 'auth',
      category: 'security',
      target: this.adminEmail(),
      status: 'success',
      metadata: { clientIp },
    });
    return { accessToken: verified.access_token, refreshToken: verified.refresh_token };
  }

  async getSession(accessToken: string, refreshToken?: string) {
    try {
      const user = await this.requireAdminSession(accessToken);
      return { authenticated: true, email: user.email, mfaRequired: !(await this.hasAal2(accessToken)) };
    } catch {
      if (!refreshToken) throw new UnauthorizedException('Authentication required');
      return this.refreshSession(refreshToken);
    }
  }

  async refreshSession(refreshToken: string) {
    const { data, error } = await this.supabase.createAuthClient().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || data.user?.email?.toLowerCase() !== this.adminEmail()) throw new UnauthorizedException('Authentication required');
    return {
      authenticated: true,
      email: data.user.email,
      mfaRequired: !(await this.hasAal2(data.session.access_token)),
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: new Date((data.session.expires_at || 0) * 1000).toISOString(),
    };
  }
  async signOut(accessToken: string) {
    await this.sessionClient(accessToken).auth.signOut();
    void this.auditService?.record({
      actor: 'Owner',
      actorType: 'user',
      action: 'Owner Logged Out',
      module: 'auth',
      category: 'security',
      target: this.adminEmail(),
      status: 'success',
    });
    return { success: true };
  }

  private async requireAdminSession(accessToken: string) {
    const { data, error } = await this.sessionClient(accessToken).auth.getUser();
    if (error || data.user?.email?.toLowerCase() !== this.adminEmail()) throw new UnauthorizedException('Authentication required');
    return data.user;
  }
  private async requireRecentAdminSession(accessToken: string) {
    const user = await this.requireAdminSession(accessToken);
    if (!(await this.hasAal2(accessToken))) throw new UnauthorizedException('Multi-factor authentication required');
    const issuedAt = this.tokenIssuedAt(accessToken);
    if (!issuedAt || Date.now() - issuedAt > RECENT_AUTH_MS) throw new UnauthorizedException('Please sign in again before changing security settings');
    return user;
  }
  private tokenIssuedAt(token: string) {
    try {
      const payload = token.split('.')[1];
      if (!payload) return 0;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
      return Number(JSON.parse(Buffer.from(normalized, 'base64').toString('utf8')).iat || 0) * 1000;
    } catch { return 0; }
  }
  private sessionClient(accessToken: string) { return this.supabase.createSessionClient(accessToken); }
  private async hasAal2(accessToken: string) {
    const { data, error } = await this.sessionClient(accessToken).auth.mfa.getAuthenticatorAssuranceLevel(accessToken);
    return !error && data?.currentLevel === 'aal2';
  }
  private adminEmail() { return (this.config.get<string>('WOOF_ADMIN_EMAIL') || DEFAULT_ADMIN_EMAIL).trim().toLowerCase(); }
  private recoveryRedirectUrl() {
    const value = this.config.get<string>('SUPABASE_PASSWORD_RECOVERY_REDIRECT_URL');
    if (!value || !/^https:\/\//i.test(value)) throw new InternalServerErrorException('Password recovery redirect URL is not configured securely');
    return value;
  }
}
