import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const signInWithPassword = jest.fn();
  const resetPasswordForEmail = jest.fn();
  const mfa = {
    listFactors: jest.fn(),
    getAuthenticatorAssuranceLevel: jest.fn(),
  };
  const mfaEnrollmentRateLimit = { assertAllowed: jest.fn() };
  const service = new AuthService(
    { get: jest.fn((key: string) => ({ WOOF_ADMIN_EMAIL: 'admin@example.com', SUPABASE_PASSWORD_RECOVERY_REDIRECT_URL: 'https://app.example.com/reset-password' })[key]) } as unknown as ConfigService,
    { createAuthClient: () => ({ auth: { signInWithPassword, resetPasswordForEmail } }), createSessionClient: () => ({ auth: { mfa } }) } as any,
    mfaEnrollmentRateLimit as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mfaEnrollmentRateLimit.assertAllowed.mockResolvedValue(undefined);
    mfa.listFactors.mockResolvedValue({ data: { totp: [] }, error: null });
    mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1' },
      error: null,
    });
    signInWithPassword.mockResolvedValue({ data: { user: { email: 'admin@example.com' }, session: { access_token: 'test-access-token', expires_at: 1924992000 } }, error: null });
  });

  it('rejects a non-admin address without querying Supabase', async () => {
    await expect(service.login('other@example.com', 'password')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('marks a password-only session as requiring MFA enrollment without exposing MFA secrets', async () => {
    const result = await service.login('ADMIN@example.com', 'password');
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'admin@example.com', password: 'password' });
    expect(result).toEqual(expect.objectContaining({
      email: 'admin@example.com',
      accessToken: 'test-access-token',
      mfaRequired: true,
    }));
  });

  it('marks an AAL2 session as ready for the dashboard after MFA verification', async () => {
    mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal2' },
      error: null,
    });

    await expect(service.login('admin@example.com', 'password')).resolves.toEqual(
      expect.objectContaining({ mfaRequired: false }),
    );
  });

  it('stops MFA enrollment verification before creating a challenge when rate-limited', async () => {
    const setSession = jest.fn().mockResolvedValue({
      data: {
        user: { id: 'admin-id', email: 'admin@example.com' },
        session: { access_token: 'session-access', refresh_token: 'session-refresh' },
      },
      error: null,
    });
    const challenge = jest.fn();
    const limited = { assertAllowed: jest.fn().mockRejectedValue(new HttpException('Too many attempts', HttpStatus.TOO_MANY_REQUESTS)) };
    const authService = new AuthService(
      { get: jest.fn((key: string) => ({ WOOF_ADMIN_EMAIL: 'admin@example.com' })[key]) } as unknown as ConfigService,
      {
        createAuthClient: () => ({ auth: { setSession } }),
        createSessionClient: () => ({ auth: { mfa: { challenge } } }),
      } as any,
      limited as any,
    );

    await expect(
      authService.verifyMfaEnrollment('access', 'refresh', 'de305d54-75b4-431b-adb2-eb6b9e546014', '123456', '127.0.0.1'),
    ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });

    expect(limited.assertAllowed).toHaveBeenCalledWith('admin-id', '127.0.0.1');
    expect(challenge).not.toHaveBeenCalled();
  });

  it('rejects an invalid MFA enrollment code without returning session credentials', async () => {
    const setSession = jest.fn().mockResolvedValue({
      data: {
        user: { id: 'admin-id', email: 'admin@example.com' },
        session: { access_token: 'session-access', refresh_token: 'session-refresh' },
      },
      error: null,
    });
    const challenge = jest.fn().mockResolvedValue({ data: { id: 'challenge-id' }, error: null });
    const verify = jest.fn().mockResolvedValue({ data: null, error: { message: 'invalid code' } });
    const authService = new AuthService(
      { get: jest.fn((key: string) => ({ WOOF_ADMIN_EMAIL: 'admin@example.com' })[key]) } as unknown as ConfigService,
      {
        createAuthClient: () => ({ auth: { setSession } }),
        createSessionClient: () => ({ auth: { mfa: { challenge, verify } } }),
      } as any,
      { assertAllowed: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      authService.verifyMfaEnrollment('access', 'refresh', 'de305d54-75b4-431b-adb2-eb6b9e546014', '000000', '127.0.0.1'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verify).toHaveBeenCalledWith({
      factorId: 'de305d54-75b4-431b-adb2-eb6b9e546014',
      challengeId: 'challenge-id',
      code: '000000',
    });
  });

  it('signs out through the authenticated Supabase session client', async () => {
    const signOut = jest.fn().mockResolvedValue({ error: null });
    const authService = new AuthService(
      { get: jest.fn() } as unknown as ConfigService,
      { createSessionClient: () => ({ auth: { signOut } }) } as any,
      mfaEnrollmentRateLimit as any,
    );

    await expect(authService.signOut('access-token')).resolves.toEqual({ success: true });
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('returns a generic successful response for an unrecognised reset address', async () => {
    await expect(service.requestPasswordReset('other@example.com')).resolves.toEqual({ success: true });
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('rotates an expired access session using only the supplied refresh cookie value', async () => {
    const refreshSession = jest.fn().mockResolvedValue({
      data: {
        user: { email: 'admin@example.com' },
        session: { access_token: 'rotated-access', refresh_token: 'rotated-refresh', expires_at: 1924992000 },
      },
      error: null,
    });
    const authService = new AuthService(
      { get: jest.fn((key: string) => ({ WOOF_ADMIN_EMAIL: 'admin@example.com' })[key]) } as unknown as ConfigService,
      {
        createAuthClient: () => ({ auth: { refreshSession } }),
        createSessionClient: () => ({
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'expired' } }),
            mfa: {
              getAuthenticatorAssuranceLevel: jest.fn().mockResolvedValue({
                data: { currentLevel: 'aal2' },
                error: null,
              }),
            },
          },
        }),
      } as any,
      mfaEnrollmentRateLimit as any,
    );

    await expect(authService.getSession('expired-access', 'refresh-cookie-value')).resolves.toEqual(
      expect.objectContaining({ authenticated: true, accessToken: 'rotated-access', refreshToken: 'rotated-refresh' }),
    );
    expect(refreshSession).toHaveBeenCalledWith({ refresh_token: 'refresh-cookie-value' });
  });
});
