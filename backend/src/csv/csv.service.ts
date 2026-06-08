import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CsvUpload, CsvUploadDocument } from './schemas/csv-upload.schema';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

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
  return SECTOR_MAP[category] || 'Retail';
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
  constructor(
    @InjectModel(CsvUpload.name) private csvUploadModel: Model<CsvUploadDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async processUpload(file: Express.Multer.File, userChannel?: string): Promise<CsvUploadDocument> {
    const channel = userChannel || detectChannel(file.originalname);
    const isExcel = file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls');

    let transactions: Partial<Transaction>[];

    if (channel === 'POS') {
      transactions = this.parsePOS(file.buffer);
    } else if (channel === 'Shopee') {
      if (isExcel) {
        transactions = this.parseShopeeExcel(file.buffer);
      } else {
        transactions = this.parseShopeeCsv(file.buffer);
      }
    } else {
      transactions = this.parseTikTok(file.buffer);
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

    if (transactionsWithUploadId.length > 0) {
      await this.transactionModel.insertMany(transactionsWithUploadId, { ordered: false });
    }

    return upload;
  }

  private parsePOS(buffer: Buffer): Partial<Transaction>[] {
    const content = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records.map((row: any) => {
      const category = row['Category'] || '';
      return {
        date: new Date(row['Transaction Date']),
        transactionId: row['Transaction ID'] || '',
        productName: row['Item Names'] || '',
        sku: row['SKU'] || '',
        category,
        sector: mapCategoryToSector(category),
        quantity: parseInt(row['Items Sold'] || '0', 10),
        unitPrice: parseFloat(row['Gross Sales'] || '0') / Math.max(parseInt(row['Items Sold'] || '1', 10), 1),
        totalAmount: parseFloat(row['Gross Sales'] || '0'),
        discount: parseFloat(row['Discounts'] || '0'),
        netSales: parseFloat(row['Net Sales'] || '0'),
        paymentType: row['Payment Type'] || '',
      };
    });
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
    // Fallback CSV parsing for Shopee
    const content = buffer.toString('utf-8').replace(/\r\n/g, '\n');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
    return this.parseShopeeExcel(buffer); // Reuse logic
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
