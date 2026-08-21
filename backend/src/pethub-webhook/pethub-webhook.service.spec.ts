import { UnauthorizedException } from '@nestjs/common';
import { PetHubWebhookService } from './pethub-webhook.service';

describe('PetHubWebhookService', () => {
  const buildService = () => {
    const configService = {
      get: jest.fn((key: string) =>
        key === 'PETHUB_WEBHOOK_SECRET' ? 'shared-secret' : undefined,
      ),
    };
    const supabaseService = {
      client: {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'upload-1' },
          error: null,
        }),
      },
    };
    const etlService = {
      processTransactions: jest.fn().mockResolvedValue(undefined),
    };
    const analyticsService = {
      getForecast: jest.fn().mockResolvedValue({ forecast: [] }),
    };
    const realtimeService = {
      emit: jest.fn(),
    };
    const transactionModel = {
      exists: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
      insertMany: jest.fn().mockResolvedValue([]),
    };

    const service = new PetHubWebhookService(
      configService as any,
      supabaseService as any,
      etlService as any,
      analyticsService as any,
      realtimeService as any,
      transactionModel as any,
    );

    return {
      service,
      supabaseService,
      etlService,
      realtimeService,
      transactionModel,
    };
  };

  const payload = {
    event: 'pethub.transaction.completed',
    source: 'PetHub',
    transactionId: 'order:ORD-123',
    transactionType: 'order',
    orderId: 'ORD-123',
    completedAt: '2026-08-21T00:00:00.000Z',
    paymentMethod: 'GCash',
    paymentStatus: 'Paid',
    status: 'Delivered',
    items: [
      {
        itemId: 'item-1',
        name: 'Premium Dog Food',
        sku: 'DOG-FOOD-1',
        category: 'Pet Shop',
        sector: 'Retail',
        quantity: 2,
        unitPrice: 100,
        grossAmount: 200,
        discountAmount: 20,
        netAmount: 180,
      },
    ],
    totals: {
      grossAmount: 200,
      discountAmount: 20,
      netAmount: 180,
      quantity: 2,
    },
  };

  it('stores a valid PetHub webhook payload and starts background ETL', async () => {
    const { service, etlService, realtimeService, transactionModel } =
      buildService();

    const result = await service.receiveCompletedTransaction(
      payload,
      'shared-secret',
    );

    expect(result).toMatchObject({
      success: true,
      duplicate: false,
      uploadId: 'upload-1',
      transactionId: 'order:ORD-123',
      records: 1,
    });
    expect(transactionModel.insertMany).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          csvUploadId: 'upload-1',
          transactionId: 'order:ORD-123',
          productName: 'Premium Dog Food',
          category: 'Pet Shop',
          sector: 'Retail',
          quantity: 2,
          unitPrice: 100,
          totalAmount: 200,
          discount: 20,
          netSales: 180,
          channel: 'PetHub',
          paymentType: 'GCash',
        }),
      ],
      { ordered: false },
    );
    expect(etlService.processTransactions).toHaveBeenCalledWith(
      [expect.objectContaining({ transactionId: 'order:ORD-123' })],
      'upload-1',
    );
    expect(realtimeService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'upload_processed',
        title: 'PetHub transaction synced',
      }),
    );
  });

  it('rejects invalid webhook secrets', async () => {
    const { service } = buildService();

    await expect(
      service.receiveCompletedTransaction(payload, 'wrong-secret'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns duplicate success without inserting when transaction already exists', async () => {
    const { service, transactionModel } = buildService();
    transactionModel.exists.mockReturnValueOnce({
      exec: jest.fn().mockResolvedValue({ _id: 'existing-id' }),
    });

    const result = await service.receiveCompletedTransaction(
      payload,
      'shared-secret',
    );

    expect(result).toMatchObject({
      success: true,
      duplicate: true,
      transactionId: 'order:ORD-123',
    });
    expect(transactionModel.insertMany).not.toHaveBeenCalled();
  });
});
