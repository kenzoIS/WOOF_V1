import { CsvService } from './csv.service';

describe('CsvService flexible uploads', () => {
  const create = jest.fn(async (value) => ({ _id: 'upload-id', ...value }));
  const insertMany = jest.fn(async (values) => values);
  const service = new CsvService(
    { create } as any,
    { insertMany } as any,
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
  });
});
