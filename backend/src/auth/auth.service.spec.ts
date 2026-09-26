import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

const sendMail = jest.fn();

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({ sendMail })),
  },
}));

describe('AuthService', () => {
  const listUsers = jest.fn();
  const createUser = jest.fn();
  const updateUserById = jest.fn();
  const signInWithPassword = jest.fn();

  const service = () =>
    new AuthService(
      {
        get: jest.fn((key: string) => {
          if (key === 'WOOF_ADMIN_EMAIL') return 'woofdash@gmail.com';
          if (key === 'WOOF_ADMIN_PASSWORD') return 'woofdash123';
          if (key === 'WOOF_SMTP_USER') return 'woofdash@gmail.com';
          if (key === 'WOOF_SMTP_APP_PASSWORD') return 'app password';
          return undefined;
        }),
      } as unknown as ConfigService,
      {
        client: {
          auth: {
            admin: {
              listUsers,
              createUser,
              updateUserById,
            },
            signInWithPassword,
          },
        },
      } as any,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    listUsers.mockResolvedValue({ data: { users: [] }, error: null });
    createUser.mockResolvedValue({
      data: { user: { id: 'new-user', email: 'woofdash@gmail.com' } },
      error: null,
    });
    updateUserById.mockResolvedValue({ error: null });
    signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'supabase-token',
          expires_at: 1924992000,
        },
      },
      error: null,
    });
    sendMail.mockResolvedValue({});
  });

  it('rejects credentials outside the dashboard admin account', async () => {
    await expect(
      service().login('wrong@example.com', 'woofdash123'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(listUsers).not.toHaveBeenCalled();
  });

  it('creates the Supabase dashboard user before signing in when needed', async () => {
    const result = await service().login('woofdash@gmail.com', 'woofdash123');

    expect(result.email).toBe('woofdash@gmail.com');
    expect(result.accessToken).toBe('supabase-token');
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'woofdash@gmail.com',
        password: 'woofdash123',
        email_confirm: true,
      }),
    );
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'woofdash@gmail.com',
      password: 'woofdash123',
    });
  });

  it('does not overwrite the Supabase password on normal login', async () => {
    listUsers.mockResolvedValue({
      data: { users: [{ id: 'user-1', email: 'woofdash@gmail.com' }] },
      error: null,
    });

    await service().login(' WOOFDASH@GMAIL.COM ', 'new-password');

    expect(createUser).not.toHaveBeenCalled();
    expect(updateUserById).not.toHaveBeenCalled();
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'woofdash@gmail.com',
      password: 'new-password',
    });
  });

  it('sends an OTP and resets the Supabase dashboard password', async () => {
    listUsers.mockResolvedValue({
      data: { users: [{ id: 'user-1', email: 'woofdash@gmail.com' }] },
      error: null,
    });

    const authService = service();

    await authService.requestPasswordReset('woofdash@gmail.com');
    const mail = sendMail.mock.calls[0][0];
    const otp = mail.text.match(/\d{6}/)?.[0];

    expect(otp).toBeDefined();
    expect(mail.to).toBe('woofdash@gmail.com');

    expect(authService.verifyResetOtp('woofdash@gmail.com', otp!)).toEqual({
      success: true,
    });

    await expect(
      authService.resetPassword('woofdash@gmail.com', otp!, 'changed123'),
    ).resolves.toEqual({ success: true });

    expect(updateUserById).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        password: 'changed123',
        email_confirm: true,
      }),
    );
  });

  it('changes the Supabase dashboard password after verifying the current password', async () => {
    listUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: 'user-1',
            email: 'woofdash@gmail.com',
            user_metadata: { twoFactor: { enabled: true } },
          },
        ],
      },
      error: null,
    });

    await expect(
      service().changePassword(
        'woofdash@gmail.com',
        'current-password',
        'new-password',
      ),
    ).resolves.toEqual({ success: true });

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'woofdash@gmail.com',
      password: 'current-password',
    });
    expect(updateUserById).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        password: 'new-password',
        email_confirm: true,
        user_metadata: expect.objectContaining({
          role: 'dashboard_admin',
          app: 'woof',
          twoFactor: { enabled: true },
        }),
      }),
    );
  });

  it('rejects change password when the current password is wrong', async () => {
    listUsers.mockResolvedValue({
      data: { users: [{ id: 'user-1', email: 'woofdash@gmail.com' }] },
      error: null,
    });
    signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Invalid credentials' },
    });

    await expect(
      service().changePassword(
        'woofdash@gmail.com',
        'wrong-password',
        'new-password',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(updateUserById).not.toHaveBeenCalled();
  });
});
