import { HttpException } from '@nestjs/common';
import { MfaEnrollmentRateLimitService } from './mfa-enrollment-rate-limit.service';

describe('MfaEnrollmentRateLimitService', () => {
  const findOneAndUpdate = jest.fn();
  const service = new MfaEnrollmentRateLimitService({ findOneAndUpdate } as any);

  beforeEach(() => jest.clearAllMocks());

  it('allows an account and IP below their durable limits', async () => {
    findOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ attempts: 1 }) });

    await expect(service.assertAllowed('account-id', '127.0.0.1')).resolves.toBeUndefined();
    expect(findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'account', key: 'account-id' }),
      expect.objectContaining({ $inc: { attempts: 1 } }),
      expect.objectContaining({ upsert: true, new: true }),
    );
  });

  it('rejects an exhausted account or IP window', async () => {
    findOneAndUpdate.mockReturnValue({ lean: jest.fn().mockResolvedValue({ attempts: 11 }) });

    await expect(service.assertAllowed('account-id', '127.0.0.1')).rejects.toBeInstanceOf(HttpException);
  });

  it('fails closed when MongoDB cannot record an attempt', async () => {
    findOneAndUpdate.mockReturnValue({ lean: jest.fn().mockRejectedValue(new Error('database unavailable')) });

    await expect(service.assertAllowed('account-id', '127.0.0.1')).rejects.toBeInstanceOf(HttpException);
  });
});
