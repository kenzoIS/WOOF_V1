import { CsvService } from './csv.service';
import * as XLSX from 'xlsx';

describe('CsvService flexible uploads', () => {
  const create = jest.fn(async (value) => ({ _id: 'upload-id', ...value }));
  const findByIdAndUpdate = jest.fn(async () => undefined);
  const insertMany = jest.fn(async (values) => values);
  const find = jest.fn(() => ({ exec: jest.fn(async () => []) }));
  const deleteMany = jest.fn(() => ({ exec: jest.fn(async () => undefined) }));
  const findByIdAndDelete = jest.fn(() => ({
    exec: jest.fn(async () => undefined),
  }));
  const processTransactions = jest.fn(() => Promise.resolve());
  const validateBatch = jest.fn((rows) => ({
    cleanedTransactions: rows,
    report: {
      stage1_droppedCount: 0,
      stage1_duplicateCount: 0,
      stage1_dropReasons: [],
    },
  }));
  const service = new CsvService(
    { create, findByIdAndDelete, findByIdAndUpdate, updateOne: jest.fn() } as any,
    { insertMany, find, deleteMany } as any,
    { processTransactions } as any,
    { validateBatch } as any,
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

    expect((result as any).upload.recordCount).toBe(1);
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

    expect((result as any).upload.recordCount).toBe(1);
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

    expect((result as any).upload.recordCount).toBe(5001);
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

  it('accepts the manual TikTok channel label and stores it as TikTok Shop retail data', async () => {
    const result = await service.processUpload(
      {
        originalname: 'tiktok.csv',
        buffer: Buffer.from(
          [
            'Order ID,Order Status,SKU ID,Seller SKU,Product Name,Variation,Quantity,SKU Unit Original Price,SKU Subtotal Before Discount,SKU Platform Discount,SKU Seller Discount,SKU Subtotal After Discount,Created Time,Payment Method,Product Category',
            '583815738874824026,Completed,1733306127405909686,SHMP-001,Vets Choice Pet Shampoo,Default,1,295,295,0,0,295,05/02/2026 2:49:19 PM,Cash on delivery,Shampoos & Conditioners',
          ].join('\n'),
        ),
      } as Express.Multer.File,
      'TikTok',
    );

    expect((result as any).upload.channel).toBe('TikTok Shop');
    expect(insertMany).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          transactionId: '583815738874824026',
          productName: 'Vets Choice Pet Shampoo',
          sku: 'SHMP-001',
          category: 'Shampoos & Conditioners',
          sector: 'Retail',
          quantity: 1,
          unitPrice: 295,
          totalAmount: 295,
          netSales: 295,
          channel: 'TikTok Shop',
        }),
      ],
      { ordered: false },
    );
  });

  it('routes PetHub sample uploads through filtered multi-sector parsing', async () => {
    const result = await service.processUpload(
      {
        originalname: 'PetHub_Sample Data.csv',
        buffer: Buffer.from(
          [
            'source_system,source_type,source_id,transaction_id,transaction_date,customer_name,product_or_service_name,sku,category,sector,quantity,unit_price,total_amount,discount,net_sales,channel,payment_type,order_status,payment_status',
            'PetHub,order,ORD-1001,pethub-order-ORD-1001,2026-07-13T10:05:00+08:00,Mika Santos,Chicken Pupcake,CAFE-PUPCAKE-CHICKEN,Pet Menu,Cafe,2,95,190,0,190,PetHub,GCash,Delivered,Paid',
            'PetHub,booking,BKG-1001,pethub-booking-BKG-1001,2026-07-13T13:00:00+08:00,Angela Reyes,Full Grooming Package,BKG-GROOM-FULL,Grooming,Services,1,850,850,0,850,PetHub,Cash,Completed,Paid',
            'PetHub,booking,BKG-1002,pethub-booking-BKG-1002,2026-07-13T15:00:00+08:00,Noel Cruz,Daycare Visit,BKG-DAYCARE,,,1,450,450,0,450,PetHub,Cash,Completed,Paid',
            'PetHub,order,ORD-CANCEL,pethub-order-ORD-CANCEL,2026-07-13T16:00:00+08:00,Bad Row,Cancelled Treat,BAD,Pet Shop,Retail,1,100,100,0,100,PetHub,Cash,Cancelled,Paid',
          ].join('\n'),
        ),
      } as Express.Multer.File,
      'PetHub',
    );

    expect((result as any).upload.channel).toBe('PetHub');
    expect((result as any).upload.recordCount).toBe(3);
    expect(insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          transactionId: 'pethub-order-ORD-1001',
          productName: 'Chicken Pupcake',
          sku: 'CAFE-PUPCAKE-CHICKEN',
          category: 'Pet Menu',
          sector: 'Cafe',
          quantity: 2,
          unitPrice: 95,
          totalAmount: 190,
          netSales: 190,
          paymentType: 'GCash',
          channel: 'PetHub',
        }),
        expect.objectContaining({
          transactionId: 'pethub-booking-BKG-1001',
          productName: 'Full Grooming Package',
          category: 'Grooming',
          sector: 'Services',
          channel: 'PetHub',
        }),
        expect.objectContaining({
          productName: 'Daycare Visit',
          category: 'Uncategorized',
          sector: 'Services',
          channel: 'PetHub',
        }),
      ]),
      { ordered: false },
    );
    expect(insertMany.mock.calls[0][0]).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productName: 'Cancelled Treat' }),
      ]),
    );
  });

  it('does not fall back to importing rejected PetHub rows', async () => {
    const result = await service.processUpload(
      {
        originalname: 'pethub-cancelled.csv',
        buffer: Buffer.from(
          [
            'transaction_id,transaction_date,product_or_service_name,category,sector,quantity,net_sales,order_status,payment_status',
            'PH-CANCEL-1,2026-07-13T10:05:00+08:00,Cancelled Treat,Pet Shop,Retail,1,100,Cancelled,Paid',
          ].join('\n'),
        ),
      } as Express.Multer.File,
      'PetHub',
    );

    expect((result as any).upload.recordCount).toBe(0);
    expect(insertMany).not.toHaveBeenCalled();
  });

  it('accepts flexible Excel uploads for manually routed sectors', async () => {
    const worksheet = XLSX.utils.json_to_sheet([
      {
        transaction_date: '2026-07-13T10:05:00+08:00',
        product_or_service_name: 'Premium Dog Kibble 1kg',
        category: 'Pet Shop',
        sector: 'Retail',
        quantity: 2,
        unit_price: 400,
        net_sales: 800,
      },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Upload');
    const buffer = Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));

    const result = await service.processUpload(
      {
        originalname: 'pos-upload.xlsx',
        buffer,
      } as Express.Multer.File,
      'POS',
    );

    expect((result as any).upload.recordCount).toBe(1);
    expect(insertMany).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          productName: 'Premium Dog Kibble 1kg',
          category: 'Pet Shop',
          sector: 'Retail',
          quantity: 2,
          unitPrice: 400,
          netSales: 800,
          channel: 'POS',
        }),
      ],
      { ordered: false },
    );
  });
});
