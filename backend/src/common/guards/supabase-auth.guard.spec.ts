import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';

describe('SupabaseAuthGuard', () => {
  const getUser = jest.fn();
  const getAuthenticatorAssuranceLevel = jest.fn();
  const refreshSession = jest.fn();
  const response = { cookie: jest.fn() };
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) } as unknown as Reflector;
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ headers: { cookie: 'woof_session=access-token; woof_refresh=refresh-token' } }),
      getResponse: () => response,
    }),
  } as any;
  const supabase = {
    createSessionClient: jest.fn(() => ({ auth: { getUser, mfa: { getAuthenticatorAssuranceLevel } } })),
    createAuthClient: jest.fn(() => ({ auth: { refreshSession } })),
  };
  const guard = new SupabaseAuthGuard(
    supabase as any,
    reflector,
    { get: jest.fn(() => 'admin@example.com') } as unknown as ConfigService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    getUser.mockResolvedValue({ data: { user: { email: 'admin@example.com' } }, error: null });
    getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: 'aal2' }, error: null });
  });

  it('denies a valid AAL1 session from protected API routes', async () => {
    getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: 'aal1' }, error: null });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows an authenticated AAL2 admin session to access protected API routes', async () => {
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rotates an expired access cookie using the refresh cookie before enforcing AAL2', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } });
    refreshSession.mockResolvedValue({
      data: {
        user: { email: 'admin@example.com' },
        session: { access_token: 'rotated-access', refresh_token: 'rotated-refresh' },
      },
      error: null,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(refreshSession).toHaveBeenCalledWith({ refresh_token: 'refresh-token' });
    expect(response.cookie).toHaveBeenCalledWith('woof_session', 'rotated-access', expect.any(Object));
    expect(response.cookie).toHaveBeenCalledWith('woof_refresh', 'rotated-refresh', expect.any(Object));
  });
});
