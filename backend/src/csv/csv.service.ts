import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CsvUpload, CsvUploadDocument } from './schemas/csv-upload.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { EtlService } from './etl.service';
import { DataValidationService } from './data-validation.service';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import {
  ForecastModule,
  normalizeDailySeries,
} from '../common/time-series';

// Map POS categories to sectors
const SECTOR_MAP: Record<string, string> = {
  'Coffee': 'Cafe',
  'Non-Caffeine': 'Cafe',
  'Pasta/Snacks': 'Cafe',
  'Rice Meals': 'Cafe',
  'Pet Bakery': 'Cafe',
  'Grooming': 'Services',
  'Events': 'Services',
  'Pet Hotel': 'Services',
  'Pet Supplies': 'Retail',
};

function mapCategoryToSector(category: string): string {
  const match = Object.entries(SECTOR_MAP).find(
    ([knownCategory]) =>
      knownCategory.toLowerCase() === category.trim().toLowerCase(),
  );
  return match?.[1] || 'Retail';
}

// Detect channel from filename
function detectChannel(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('pos')) return 'POS';
  if (lower.includes('shopee')) return 'Shopee';
  if (lower.includes('tiktok') || lower.includes('tiktokshop')) return 'TikTok Shop';
  return 'POS';
}

@Injectable()
export class CsvService {
  private readonly logger = new Logger(CsvService.name);

  constructor(
    @InjectModel(CsvUpload.name) private csvUploadModel: Model<CsvUploadDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    private etlService: EtlService,
    private dataValidationService: DataValidationService,
  ) {}

  async processUpload(file: Express.Multer.File, userChannel?: string): Promise<CsvUploadDocument> {
    const channel = userChannel || detectChannel(file.originalname);
    const isExcel = file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls');

    let transactions: Partial<Transaction>[];

    if (channel === 'POS') {
      transactions = this.parseFlexibleCsv(file.buffer, file.originalname, channel);
    } else if (channel === 'Shopee') {
      if (isExcel) {
        transactions = this.parseShopeeExcel(file.buffer);
      } else {
        transactions = this.parseShopeeCsv(file.buffer);
      }
    } else {
      try {
        transactions = this.parseTikTok(file.buffer);
      } catch {
        transactions = this.parseFlexibleCsv(
          file.buffer,
          file.originalname,
          channel,
        );
      }
    }

    if (transactions.length === 0 && !isExcel) {
      transactions = this.parseFlexibleCsv(
        file.buffer,
        file.originalname,
        channel,
      );
    }

    // Shopee and TikTok Shop are always Retail — override any product-name-based inference
    if (channel === 'Shopee' || channel === 'TikTok Shop') {
      transactions = transactions.map(t => ({ ...t, sector: 'Retail' }));
    }

    // Create upload record
    const uniqueTransactionIds = new Set(transactions.map(t => t.transactionId));
    const categories: string[] = [...new Set(transactions.map(t => t.category).filter((c): c is string => Boolean(c)))];
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.netSales || t.totalAmount || 0), 0);
    const totalQuantity = transactions.reduce((sum, t) => sum + (t.quantity || 0), 0);

    const upload = await this.csvUploadModel.create({
      filename: file.originalname,
      channel,
      recordCount: transactions.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalQuantity,
      totalTransactions: uniqueTransactionIds.size,
      categories,
      uploadedAt: new Date(),
    } as any);

    // Add csvUploadId and channel to each transaction, then bulk insert
    const uploadId = (upload as any)._id as Types.ObjectId;
    const transactionsWithUploadId = transactions.map(t => ({
      ...t,
      csvUploadId: uploadId,
      channel,
    }));

    let reportPayload: any = null;
    try {
      const { cleanedTransactions, report } = this.dataValidationService.validateBatch(transactionsWithUploadId, channel);
      reportPayload = report;

      await this.csvUploadModel.findByIdAndUpdate(uploadId, {
        recordCount: cleanedTransactions.length,
        $set: { etlReport: {
          stage1_droppedCount: report.stage1_droppedCount,
          stage1_duplicateCount: report.stage1_duplicateCount,
          stage1_dropReasons: report.stage1_dropReasons,
        }}
      });

      await this.insertTransactionsInChunks(cleanedTransactions);
      
      // Run ETL to Supabase in the background
      this.etlService.processTransactions(cleanedTransactions as Transaction[], uploadId.toString()).catch(err => {
        this.logger.error('Background ETL process failed for upload ' + uploadId, err.stack);
      });
    } catch (error) {
      await this.rollbackUpload(uploadId);
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to persist ${transactionsWithUploadId.length} uploaded transactions for ${file.originalname}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        `Failed to persist uploaded transactions: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      success: true,
      upload,
      report: reportPayload
    } as any;
  }

  async processHistoricalUpload(
    file: Express.Multer.File,
    requestedModule: string,
  ): Promise<Record<string, unknown>> {
    const module = this.normalizeHistoricalModule(requestedModule);
    const parsed = this.parseHistoricalPOS(file.buffer, module);
    if (parsed.transactions.length === 0) {
      throw new BadRequestException(
        `No physical POS ${module} transactions were found in the uploaded CSV`,
      );
    }

    const uniqueTransactionIds = new Set(
      parsed.transactions.map((transaction) => transaction.transactionId),
    );
    const categories = [
      ...new Set(
        parsed.transactions
          .map((transaction) => transaction.category)
          .filter((category): category is string => Boolean(category)),
      ),
    ];
    const totalRevenue = parsed.transactions.reduce(
      (sum, transaction) =>
        sum + (transaction.netSales || transaction.totalAmount || 0),
      0,
    );
    const totalQuantity = parsed.transactions.reduce(
      (sum, transaction) => sum + (transaction.quantity || 0),
      0,
    );

    const upload = await this.csvUploadModel.create({
      filename: file.originalname,
      channel: 'POS',
      purpose: 'historical-forecast',
      module,
      recordCount: parsed.transactions.length,
      excludedRecordCount: parsed.excludedRecordCount,
      repairedDateCount: parsed.repairedDateCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalQuantity,
      totalTransactions: uniqueTransactionIds.size,
      categories,
      uploadedAt: new Date(),
    } as any);

    const uploadId = (upload as any)._id as Types.ObjectId;
    const transactionsWithUploadId = parsed.transactions.map((transaction) => ({
        ...transaction,
        csvUploadId: uploadId,
        channel: 'POS',
      }));

    let reportPayload: any = null;
    try {
      const { cleanedTransactions, report } = this.dataValidationService.validateBatch(transactionsWithUploadId, 'POS');
      reportPayload = report;

      await this.csvUploadModel.findByIdAndUpdate(uploadId, {
        recordCount: cleanedTransactions.length,
        $set: { etlReport: {
          stage1_droppedCount: report.stage1_droppedCount,
          stage1_duplicateCount: report.stage1_duplicateCount,
          stage1_dropReasons: report.stage1_dropReasons,
        }}
      });

      await this.insertTransactionsInChunks(cleanedTransactions);
      
      // Run ETL to Supabase in the background
      this.etlService.processTransactions(cleanedTransactions as Transaction[], uploadId.toString()).catch(err => {
        this.logger.error('Background ETL process failed for historical upload ' + uploadId, err.stack);
      });
    } catch (error) {
      await this.rollbackUpload(uploadId);
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to persist ${transactionsWithUploadId.length} historical transactions for ${file.originalname}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        `Failed to persist historical transactions: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const dailyMap = new Map<
      string,
      { actual: number; transactionIds: Set<string> }
    >();
    for (const transaction of parsed.transactions) {
      const date = transaction.date!.toISOString().slice(0, 10);
      const current = dailyMap.get(date) || {
        actual: 0,
        transactionIds: new Set<string>(),
      };
      current.actual += transaction.quantity || 0;
      if (transaction.transactionId) {
        current.transactionIds.add(transaction.transactionId);
      }
      dailyMap.set(date, current);
    }
    const normalizedSeries = normalizeDailySeries(
      [...dailyMap.entries()].map(([date, value]) => ({
        date,
        actual: value.actual,
        orders: value.transactionIds.size,
      })),
      module,
    );

    return {
      success: true,
      upload,
      report: reportPayload,
      preprocessing: {
        module,
        channel: 'POS',
        emaAlpha: module === 'Cafe' ? 0.3 : 0.4,
        acceptedRecordCount: parsed.transactions.length,
        excludedRecordCount: parsed.excludedRecordCount,
        repairedDateCount: parsed.repairedDateCount,
        filledMissingDayCount: normalizedSeries.filter(
          (point) => point.isMissingDate,
        ).length,
      },
      normalizedSeries,
    };
  }

  private parseFlexibleCsv(
    buffer: Buffer,
    filename: string,
    channel: string,
  ): Partial<Transaction>[] {
    const records = this.parseCsvRecords(buffer);
    const fallbackDate = new Date();

    return records.map((row, index) =>
      this.mapFlexibleRow(row, {
        channel,
        fallbackDate,
        fallbackId: `${filename}-${index + 1}`,
      }),
    );
  }

  private parseHistoricalPOS(
    buffer: Buffer,
    module: ForecastModule,
  ): {
    transactions: Partial<Transaction>[];
    excludedRecordCount: number;
    repairedDateCount: number;
  } {
    const records = this.parseCsvRecords(buffer);

    const transactions: Partial<Transaction>[] = [];
    let excludedRecordCount = 0;
    let repairedDateCount = 0;
    const validDates = records
      .map((row) => this.parseDate(this.getValue(row, ['transaction date', 'date', 'order date', 'created at', 'timestamp'])))
      .filter((date): date is Date => Boolean(date));
    let lastValidDate: Date | null = validDates[0] || new Date();

    for (const [index, row] of records.entries()) {
      const source = this.getValue(row, [
        'channel',
        'sales channel',
        'order source',
        'platform',
        'source',
      ]).toLowerCase();
      if (
        /shopee|tiktok|lazada|website|online|e-?commerce|marketplace/.test(
          source,
        )
      ) {
        excludedRecordCount += 1;
        continue;
      }

      const category = this.getValue(row, [
        'category',
        'product category',
        'item category',
      ]);
      const explicitSector = this.getValue(row, ['sector', 'module']);
      const productName = this.getValue(row, [
        'item names',
        'item name',
        'product name',
        'product',
        'service',
        'name',
        'description',
      ]);
      const inferredSector = this.inferFlexibleSector(
        category,
        explicitSector,
        productName,
      );
      if ((category || explicitSector) && inferredSector !== module) {
        excludedRecordCount += 1;
        continue;
      }

      const rawDate = this.getValue(row, [
        'transaction date',
        'date',
        'order date',
        'created at',
        'timestamp',
      ]);
      let date = this.parseDate(rawDate);
      if (date) {
        lastValidDate = date;
      } else {
        date = new Date(lastValidDate);
        repairedDateCount += 1;
      }

      transactions.push(
        this.mapFlexibleRow(row, {
          channel: 'POS',
          forcedModule: module,
          fallbackDate: date,
          fallbackId: `historical-${module}-${index + 1}`,
        }),
      );
    }

    return { transactions, excludedRecordCount, repairedDateCount };
  }

  private normalizeHistoricalModule(module: string): ForecastModule {
    const normalized = module.toLowerCase();
    if (normalized === 'cafe') return 'Cafe';
    if (normalized === 'services') return 'Services';
    throw new BadRequestException(
      'Historical ingestion is restricted to Cafe and Services',
    );
  }

  private toNumber(value: string | undefined, fallback: number): number {
    const parsedValue = Number.parseFloat(
      (value || '').replace(/[^0-9.-]/g, ''),
    );
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  private parseCsvRecords(buffer: Buffer): Record<string, string>[] {
    const content = buffer
      .toString('utf-8')
      .replace(/^\uFEFF/, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
    if (!content) {
      throw new BadRequestException('The uploaded CSV is empty');
    }

    try {
      const rows = parse(content, {
        columns: (headers: string[]) =>
          headers.map((header, index) => header.trim() || `column_${index + 1}`),
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        relax_quotes: true,
        bom: true,
      }) as Record<string, string>[];
      if (rows.length > 0) return rows;

      const rawRows = parse(content, {
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        relax_quotes: true,
        bom: true,
      }) as string[][];
      return rawRows.map((values) =>
        Object.fromEntries(
          values.map((value, index) => [`column_${index + 1}`, value]),
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        `Unable to parse CSV: ${error instanceof Error ? error.message : 'invalid format'}`,
      );
    }
  }

  private mapFlexibleRow(
    row: Record<string, string>,
    options: {
      channel: string;
      fallbackDate: Date;
      fallbackId: string;
      forcedModule?: ForecastModule;
    },
  ): Partial<Transaction> {
    const productName =
      this.getValue(row, [
        'item names',
        'item name',
        'product name',
        'product',
        'service',
        'name',
        'description',
      ]) || this.firstMeaningfulValue(row) || `Imported row ${options.fallbackId}`;
    const category =
      this.getValue(row, [
        'category',
        'product category',
        'item category',
        'type',
      ]) || options.forcedModule || 'Uncategorized';
    const explicitSector = this.getValue(row, ['sector', 'module']);
    const sector =
      options.forcedModule ||
      this.inferFlexibleSector(category, explicitSector, productName);
    const quantity = Math.max(
      0,
      this.toNumber(
        this.getValue(row, [
          'items sold',
          'quantity',
          'qty',
          'units',
          'count',
        ]),
        1,
      ),
    );
    const unitPrice = this.toNumber(
      this.getValue(row, [
        'unit price',
        'price',
        'rate',
        'deal price',
        'original price',
      ]),
      0,
    );
    const grossSales = this.toNumber(
      this.getValue(row, [
        'gross sales',
        'gross amount',
        'total amount',
        'amount',
        'sales',
        'revenue',
        'total',
      ]),
      unitPrice * quantity,
    );
    const discount = this.toNumber(
      this.getValue(row, ['discounts', 'discount', 'total discount']),
      0,
    );
    const netSales = this.toNumber(
      this.getValue(row, [
        'net sales',
        'net amount',
        'subtotal after discount',
      ]),
      grossSales - discount,
    );

    return {
      date:
        this.parseDate(
          this.getValue(row, [
            'transaction date',
            'date',
            'order date',
            'created at',
            'created time',
            'timestamp',
          ]),
        ) || options.fallbackDate,
      transactionId:
        this.getValue(row, [
          'transaction id',
          'order id',
          'invoice id',
          'receipt id',
          'id',
        ]) || options.fallbackId,
      productName,
      sku: this.getValue(row, ['sku', 'sku id', 'product id', 'item code']),
      category,
      sector,
      quantity,
      unitPrice: unitPrice || grossSales / Math.max(quantity, 1),
      totalAmount: grossSales,
      discount,
      netSales,
      paymentType: this.getValue(row, [
        'payment type',
        'payment method',
        'payment',
      ]),
    };
  }

  private inferFlexibleSector(
    category: string,
    explicitSector: string,
    productName: string,
  ): string {
    const sector = explicitSector.trim().toLowerCase();
    if (sector.includes('cafe') || sector.includes('coffee')) return 'Cafe';
    if (sector.includes('service') || sector.includes('groom')) return 'Services';
    if (sector.includes('retail')) return 'Retail';

    const mapped = mapCategoryToSector(category);
    return mapped !== 'Retail' || category.toLowerCase().includes('retail')
      ? mapped
      : this.inferSectorFromProduct(productName, category);
  }

  private getValue(
    row: Record<string, string>,
    aliases: string[],
  ): string {
    const normalizedAliases = aliases.map((alias) => this.normalizeHeader(alias));
    for (const [key, value] of Object.entries(row)) {
      if (
        normalizedAliases.includes(this.normalizeHeader(key)) &&
        value !== undefined &&
        value !== null
      ) {
        return String(value).trim();
      }
    }
    return '';
  }

  private normalizeHeader(header: string): string {
    return header.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private firstMeaningfulValue(row: Record<string, string>): string {
    return (
      Object.values(row).find(
        (value) => typeof value === 'string' && value.trim().length > 0,
      )?.trim() || ''
    );
  }

  private parseDate(value: string): Date | null {
    if (!value) return null;
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private parseTikTok(buffer: Buffer): Partial<Transaction>[] {
    // TikTok CSV may have BOM
    let content = buffer.toString('utf-8');
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
    });

    return records
      .filter((row: any) => {
        const status = (row['Order Status'] || '').toLowerCase().trim();
        return status === 'completed' || status === 'delivered' || status === 'to ship' || status === 'shipped';
      })
      .map((row: any) => {
        const productCategory = row['Product Category'] || '';
        const productName = row['Product Name'] || '';
        const sector = this.inferSectorFromProduct(productName, productCategory);
        const quantity = parseInt(row['Quantity'] || '1', 10);
        const unitPrice = parseFloat(row['SKU Unit Original Price'] || '0');
        const subtotalAfterDiscount = parseFloat(row['SKU Subtotal After Discount'] || '0');
        const platformDiscount = parseFloat(row['SKU Platform Discount'] || '0');
        const sellerDiscount = parseFloat(row['SKU Seller Discount'] || '0');

        // Parse date - TikTok uses "MM/DD/YYYY HH:mm:ss AM/PM" format
        let dateStr = (row['Created Time'] || '').trim().replace(/\t/g, '');
        let date: Date;
        try {
          date = new Date(dateStr);
          if (isNaN(date.getTime())) date = new Date();
        } catch {
          date = new Date();
        }

        return {
          date,
          transactionId: (row['Order ID'] || '').trim().replace(/\t/g, ''),
          productName,
          sku: (row['SKU ID'] || '').trim().replace(/\t/g, ''),
          category: productCategory,
          sector,
          quantity,
          unitPrice,
          totalAmount: unitPrice * quantity,
          discount: platformDiscount + sellerDiscount,
          netSales: subtotalAfterDiscount,
          paymentType: '',
        };
      });
  }

  private parseShopeeExcel(buffer: Buffer): Partial<Transaction>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const records: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    return records
      .filter((row: any) => {
        const status = (row['Order Status'] || '').toLowerCase();
        return status === 'completed';
      })
      .map((row: any) => {
        const productName = row['Product Name'] || '';
        const sector = this.inferSectorFromProduct(productName, '');
        const quantity = parseInt(row['Quantity'] || '1', 10);
        const dealPrice = parseFloat(row['Deal Price'] || row['Original Price'] || '0');
        const totalDiscount = parseFloat(row['Total Discount(PHP)'] || '0');

        let date: Date;
        try {
          const dateStr = row['Order Creation Date'] || row['Order Paid Time'] || '';
          date = new Date(dateStr);
          if (isNaN(date.getTime())) date = new Date();
        } catch {
          date = new Date();
        }

        return {
          date,
          transactionId: row['Order ID'] || '',
          productName,
          sku: row['SKU Reference No.'] || row['Parent SKU Reference No.'] || '',
          category: this.inferCategoryFromProduct(productName),
          sector,
          quantity,
          unitPrice: dealPrice,
          totalAmount: dealPrice * quantity,
          discount: totalDiscount,
          netSales: dealPrice * quantity - totalDiscount,
          paymentType: '',
        };
      });
  }

  private parseShopeeCsv(buffer: Buffer): Partial<Transaction>[] {
    return this.parseFlexibleCsv(buffer, 'shopee.csv', 'Shopee');
  }

  private inferSectorFromProduct(productName: string, category: string): string {
    const lower = (productName + ' ' + category).toLowerCase();
    // Cafe items
    if (/coffee|latte|cappuccino|mocha|espresso|frappe|matcha|tea|smoothie|cake|pastry|bread|cookie|muffin|rice meal|pasta|snack|bakery|cupcake/.test(lower)) {
      return 'Cafe';
    }
    // Services
    if (/grooming|groom|bath|nail|paw.?dicure|boarding|hotel|pet hotel|birthday|party|trim|haircut|spa/.test(lower)) {
      return 'Services';
    }
    // Default to Retail (pet supplies, food, accessories, etc.)
    return 'Retail';
  }

  private inferCategoryFromProduct(productName: string): string {
    const lower = productName.toLowerCase();
    if (/food|kibble|treat|chew|snack|fattener|vitamins|supplement/.test(lower)) return 'Pet Supplies';
    if (/shampoo|conditioner|soap|spray|cologne|powder/.test(lower)) return 'Pet Supplies';
    if (/collar|leash|harness|bowl|bed|cage|carrier|toy/.test(lower)) return 'Pet Supplies';
    if (/medicine|tablet|capsule|syrup|dewormer|worm|flea|tick/.test(lower)) return 'Pet Supplies';
    return 'Pet Supplies';
  }

  async getUploads(): Promise<CsvUploadDocument[]> {
    return this.csvUploadModel.find().sort({ uploadedAt: -1 }).exec();
  }

  private async insertTransactionsInChunks(
    transactions: Partial<Transaction>[],
  ): Promise<void> {
    const chunkSize = 5000;
    for (let index = 0; index < transactions.length; index += chunkSize) {
      const chunk = transactions
        .slice(index, index + chunkSize)
        .map((transaction) => this.sanitizeTransaction(transaction));
      if (chunk.length > 0) {
        await this.transactionModel.insertMany(chunk, { ordered: false });
      }
    }
  }

  private sanitizeTransaction(
    transaction: Partial<Transaction>,
  ): Partial<Transaction> {
    const fallbackDate = new Date();
    const date =
      transaction.date instanceof Date &&
      Number.isFinite(transaction.date.getTime())
        ? transaction.date
        : fallbackDate;

    const quantity = this.safeNumber(transaction.quantity, 1);
    const unitPrice = this.safeNumber(transaction.unitPrice, 0);
    const totalAmount = this.safeNumber(transaction.totalAmount, 0);
    const discount = this.safeNumber(transaction.discount, 0);
    let netSales = this.safeNumber(transaction.netSales, 0);

    if (netSales <= 0 && totalAmount - discount > 0) {
      netSales = totalAmount - discount;
    }

    return {
      ...transaction,
      date,
      transactionId: this.safeRequiredString(
        transaction.transactionId,
        `imported-${date.getTime()}`,
      ),
      productName: this.safeRequiredString(
        transaction.productName,
        'Imported item',
      ),
      category: this.safeRequiredString(transaction.category, 'Uncategorized'),
      sector: this.safeRequiredString(transaction.sector, 'Retail'),
      channel: this.safeRequiredString(transaction.channel, 'POS'),
      quantity,
      unitPrice,
      totalAmount,
      discount,
      netSales,
    };
  }

  private safeRequiredString(value: unknown, fallback: string): string {
    const text = typeof value === 'string' ? value.trim() : '';
    return text.length > 0 ? text : fallback;
  }

  private safeNumber(value: unknown, fallback: number): number {
    const numberValue =
      typeof value === 'number' ? value : Number.parseFloat(String(value));
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }

  private async rollbackUpload(uploadId: Types.ObjectId): Promise<void> {
    await this.transactionModel.deleteMany({ csvUploadId: uploadId }).exec();
    await this.csvUploadModel.findByIdAndDelete(uploadId).exec();
  }

  async deleteUpload(id: string): Promise<{ deleted: boolean }> {
    const objectId = new Types.ObjectId(id);
    await this.transactionModel.deleteMany({ csvUploadId: objectId }).exec();
    await this.csvUploadModel.findByIdAndDelete(objectId).exec();
    return { deleted: true };
  }

  async getMetrics(): Promise<any> {
    const [uploads, channelAgg, totalAgg] = await Promise.all([
      this.csvUploadModel.find().exec(),
      this.transactionModel.aggregate([
        { $group: { _id: '$channel', count: { $sum: 1 }, revenue: { $sum: '$netSales' } } },
      ]),
      this.transactionModel.aggregate([
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            totalTransactions: { $addToSet: '$transactionId' },
            totalQuantity: { $sum: '$quantity' },
            totalRevenue: { $sum: '$netSales' },
          },
        },
      ]),
    ]);

    const totals = totalAgg[0] || { totalRecords: 0, totalTransactions: [], totalQuantity: 0, totalRevenue: 0 };
    const channels: Record<string, { count: number; revenue: number }> = {};
    channelAgg.forEach((c: any) => {
      channels[c._id] = { count: c.count, revenue: Math.round(c.revenue * 100) / 100 };
    });

    return {
      totalRecords: totals.totalRecords,
      totalTransactions: Array.isArray(totals.totalTransactions) ? totals.totalTransactions.length : 0,
      totalQuantity: totals.totalQuantity,
      totalRevenue: Math.round(totals.totalRevenue * 100) / 100,
      channels,
      uploadCount: uploads.length,
    };
  }
}
