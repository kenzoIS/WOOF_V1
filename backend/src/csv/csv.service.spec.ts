import { CsvService } from './csv.service';

describe('CsvService flexible uploads', () => {
  const create = jest.fn(async (value) => ({ _id: 'upload-id', ...value }));
  const insertMany = jest.fn(async (values) => values);
  const deleteMany = jest.fn(() => ({ exec: jest.fn(async () => undefined) }));
  const findByIdAndDelete = jest.fn(() => ({
    exec: jest.fn(async () => undefined),
  }));
  const service = new CsvService(
    { create, findByIdAndDelete } as any,
    { insertMany, deleteMany } as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('accepts a CSV with arbitrary common headers', async () => {
    const result = await service.processUpload(
      {
        originalname: 'sales.csv',
        buffer: Buffer.from(
          'Date,Product,Amount,Qty\n2026-06-01,Latte,150,2\n',
        ),
      } as Express.Multer.File,
      'POS',
    );

    expect(result.recordCount).toBe(1);
    expect(insertMany).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          productName: 'Latte',
          netSales: 150,
          quantity: 2,
          sector: 'Cafe',
          channel: 'POS',
        }),
      ],
      { ordered: false },
    );
  });

  it('accepts unknown columns by applying safe defaults', async () => {
    const result = await service.processUpload(
      {
        originalname: 'unknown.csv',
        buffer: Buffer.from('Alpha,Beta\nhello,42\n'),
      } as Express.Multer.File,
      'POS',
    );

    expect(result.recordCount).toBe(1);
    expect(insertMany).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          productName: 'hello',
          category: 'Uncategorized',
          quantity: 1,
          netSales: 0,
        }),
      ],
      { ordered: false },
    );
  });

  it('accepts historical rows with missing dates and no category column', async () => {
    const result = await service.processHistoricalUpload(
      {
        originalname: 'services.csv',
        buffer: Buffer.from('Service,Revenue\nGrooming,500\nBoarding,750\n'),
      } as Express.Multer.File,
      'services',
    );

    expect(result.preprocessing).toEqual(
      expect.objectContaining({
        module: 'Services',
        acceptedRecordCount: 2,
        repairedDateCount: 2,
      }),
    );
    expect((result.normalizedSeries as any[])[0]).toEqual(
      expect.objectContaining({
        actual: 2,
        normalized: 2,
      }),
    );
  });

  it('inserts large uploads in chunks', async () => {
    const rows = Array.from(
      { length: 5001 },
      (_, index) => `2026-06-01,Latte ${index},150,1`,
    ).join('\n');

    const result = await service.processUpload(
      {
        originalname: 'large.csv',
        buffer: Buffer.from(`Date,Product,Amount,Qty\n${rows}\n`),
      } as Express.Multer.File,
      'POS',
    );

    expect(result.recordCount).toBe(5001);
    expect(insertMany).toHaveBeenCalledTimes(2);
    expect(insertMany.mock.calls[0][0]).toHaveLength(5000);
    expect(insertMany.mock.calls[1][0]).toHaveLength(1);
  });

  it('rolls back upload metadata if a chunk insert fails', async () => {
    const rows = Array.from(
      { length: 5001 },
      (_, index) => `2026-06-01,Latte ${index},150,1`,
    ).join('\n');
    insertMany
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('database insert failed'));

    await expect(
      service.processUpload(
        {
          originalname: 'large.csv',
          buffer: Buffer.from(`Date,Product,Amount,Qty\n${rows}\n`),
        } as Express.Multer.File,
        'POS',
      ),
    ).rejects.toThrow('Failed to persist uploaded transactions');

    expect(deleteMany).toHaveBeenCalledWith({ csvUploadId: 'upload-id' });
    expect(findByIdAndDelete).toHaveBeenCalledWith('upload-id');
  });
});
