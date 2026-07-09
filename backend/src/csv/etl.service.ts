import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from './schemas/transaction.schema';
import { HolidayCache, HolidayCacheDocument } from '../context/schemas/holiday-cache.schema';
import { WeatherLog, WeatherLogDocument } from '../context/schemas/weather-log.schema';
import { CsvUpload, CsvUploadDocument } from './schemas/csv-upload.schema';

@Injectable()
export class EtlService {
  private readonly logger = new Logger(EtlService.name);
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    @InjectModel(HolidayCache.name) private holidayCacheModel: Model<HolidayCacheDocument>,
    @InjectModel(WeatherLog.name) private weatherLogModel: Model<WeatherLogDocument>,
    @InjectModel(CsvUpload.name) private csvUploadModel: Model<CsvUploadDocument>,
  ) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseKey = this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  private getDateId(date: Date): number {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return Number(`${year}${month}${day}`);
  }

  private getIsoDayOfWeek(date: Date): number {
    const day = date.getDay();
    return day === 0 ? 7 : day;
  }

  private getWeekOfYear(date: Date): number {
    const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tempDate.getUTCDay() || 7;
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    return Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private getSeason(month: number): string {
    if ([12, 1, 2, 3, 4, 5].includes(month)) return 'Dry Season';
    return 'Wet Season';
  }

  private normalizeChannel(sourcePlatform: string) {
    const platform = String(sourcePlatform || '').toLowerCase();
    if (platform.includes('shopee')) return { channel_id: 'CH_SHOPEE', channel_name: 'Shopee', channel_type: 'E-Commerce' };
    if (platform.includes('tiktok')) return { channel_id: 'CH_TIKTOK', channel_name: 'TikTok Shop', channel_type: 'E-Commerce' };
    if (platform.includes('pethub')) return { channel_id: 'CH_PETHUB', channel_name: 'PetHub', channel_type: 'Internal Digital Platform' };
    return { channel_id: 'CH_POS', channel_name: 'POS', channel_type: 'Physical Store' };
  }

  private normalizeSegment(sector: string) {
    const name = String(sector || 'Retail').toLowerCase();
    if (name.includes('service') || name.includes('grooming')) return { segment_id: 'SEG_SERVICE', segment_name: 'Service', segment_type: 'Service' };
    if (name.includes('cafe') || name.includes('food')) return { segment_id: 'SEG_CAFE', segment_name: 'Cafe', segment_type: 'Food and Beverage' };
    return { segment_id: 'SEG_RETAIL', segment_name: 'Retail', segment_type: 'Product' };
  }

  // -----------------------------
  // Main Processor (Bulk)
  // -----------------------------
  async processTransactions(transactions: Transaction[], uploadId?: string) {
    this.logger.log(`Starting bulk ETL to Supabase for ${transactions.length} transactions...`);

    try {
      const datesMap = new Map<number, any>();
      const channelsMap = new Map<string, any>();
      const segmentsMap = new Map<string, any>();
      const productsMap = new Map<string, any>();
      const servicesMap = new Map<string, any>();
      const factRows: any[] = [];

      // Pre-fetch all holidays for the dates in the transaction batch to avoid 1x1 mongo queries
      const uniqueDateStrings = new Set<string>();
      for (const t of transactions) {
        const orderDate = new Date(t.date);
        uniqueDateStrings.add(orderDate.toISOString().slice(0, 10));
        
        const dateBefore = new Date(orderDate);
        dateBefore.setDate(dateBefore.getDate() - 1);
        uniqueDateStrings.add(dateBefore.toISOString().slice(0, 10));

        const dateAfter = new Date(orderDate);
        dateAfter.setDate(dateAfter.getDate() + 1);
        uniqueDateStrings.add(dateAfter.toISOString().slice(0, 10));
      }

      const holidayDocs = await this.holidayCacheModel.find({ date: { $in: Array.from(uniqueDateStrings) } });
      const holidayMap = new Map(holidayDocs.map(doc => [doc.date, doc]));

      this.logger.log(`Aggregating dimensions in memory...`);
      for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        
        // Channel
        const channel = this.normalizeChannel(t.channel);
        if (!channelsMap.has(channel.channel_id)) {
          channelsMap.set(channel.channel_id, channel);
        }

        // Segment
        const segment = this.normalizeSegment(t.sector);
        if (!segmentsMap.has(segment.segment_id)) {
          segmentsMap.set(segment.segment_id, segment);
        }

        // Date
        const orderDate = new Date(t.date);
        const dateId = this.getDateId(orderDate);
        if (!datesMap.has(dateId)) {
          const dateString = orderDate.toISOString().slice(0, 10);
          
          const dateBefore = new Date(orderDate);
          dateBefore.setDate(dateBefore.getDate() - 1);
          const dateBeforeString = dateBefore.toISOString().slice(0, 10);
          
          const dateAfter = new Date(orderDate);
          dateAfter.setDate(dateAfter.getDate() + 1);
          const dateAfterString = dateAfter.toISOString().slice(0, 10);

          const holiday = holidayMap.get(dateString);
          const dayBeforeHoliday = holidayMap.get(dateBeforeString);
          const dayAfterHoliday = holidayMap.get(dateAfterString);

          const dayOfWeek = this.getIsoDayOfWeek(orderDate);
          const month = orderDate.getMonth() + 1;

          datesMap.set(dateId, {
            date_id: dateId,
            full_date: orderDate.toISOString(),
            day_of_week: dayOfWeek,
            day_name: orderDate.toLocaleDateString('en-US', { weekday: 'long' }),
            week_of_year: this.getWeekOfYear(orderDate),
            month,
            month_name: orderDate.toLocaleDateString('en-US', { month: 'long' }),
            quarter: Math.ceil(month / 3),
            year: orderDate.getFullYear(),
            is_weekend: dayOfWeek === 6 || dayOfWeek === 7,
            is_holiday: !!holiday,
            day_before_holiday: !!dayBeforeHoliday,
            day_after_holiday: !!dayAfterHoliday,
            holiday_name: holiday ? holiday.name : null,
            season: this.getSeason(month),
          });
        }

        // Product / Service
        const syntheticId = Buffer.from((t.productName || '').trim().toLowerCase()).toString('base64').substring(0, 15);
        let productId: string | null = null;
        let serviceId: string | null = null;

        if (segment.segment_type === 'Service') {
          serviceId = `SRV_${syntheticId}`;
          if (!servicesMap.has(serviceId)) {
            servicesMap.set(serviceId, {
              service_id: serviceId,
              service_name: t.productName ? t.productName.trim() : 'Unnamed Service',
              service_type: t.category || 'Uncategorized',
              base_price: Number(t.unitPrice || 0)
            });
          }
        } else {
          productId = `PRD_${syntheticId}`;
          if (!productsMap.has(productId)) {
            productsMap.set(productId, {
              product_id: productId,
              sku: t.sku ? t.sku.toUpperCase().trim() : null,
              product_name: t.productName ? t.productName.trim() : 'Unnamed Product',
              category: t.category || 'Uncategorized',
              brand: null,
              unit_cost: 0,
              selling_price: Number(t.unitPrice || 0),
            });
          }
        }

        // Fact Row
        const transactionLineId = `${t.transactionId}-${productId || serviceId}-${i + 1}`;
        factRows.push({
          transaction_line_id: transactionLineId,
          transaction_id: t.transactionId,
          source_order_id: null,
          transaction_timestamp: new Date(t.date).toISOString(),
          date_id: dateId,
          product_id: productId,
          customer_id: null,
          channel_id: channel.channel_id,
          service_id: serviceId,
          campaign_id: null,
          segment_id: segment.segment_id,
          quantity_sold: Number(t.quantity || 0),
          gross_sales: Number(t.totalAmount || 0),
          discount_amount: Number(t.discount || 0),
          net_sales: Number(t.netSales || 0),
          order_status: 'completed',
          source_system: channel.channel_name,
        });
      }

      this.logger.log(`Upserting Dimensions...`);

      // Helper to chunk arrays for bulk upsert
      const chunkArray = (array: any[], size: number) => {
        const chunks: any[][] = [];
        for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
        return chunks;
      };

      const upsertTable = async (table: string, data: any[], conflictKey: string) => {
        if (data.length === 0) return;
        const chunks = chunkArray(data, 2000); // 2000 per request
        for (const chunk of chunks) {
          const { error } = await this.supabase.from(table).upsert(chunk, { onConflict: conflictKey });
          if (error) throw new Error(`${table} bulk upsert failed: ${error.message}`);
        }
      };

      await Promise.all([
        upsertTable('date_dim', Array.from(datesMap.values()), 'date_id'),
        upsertTable('channel_dim', Array.from(channelsMap.values()), 'channel_id'),
        upsertTable('business_segment_dim', Array.from(segmentsMap.values()), 'segment_id'),
        upsertTable('product_dim', Array.from(productsMap.values()), 'product_id'),
        upsertTable('service_dim', Array.from(servicesMap.values()), 'service_id'),
      ]);

      this.logger.log(`Upserting ${factRows.length} Fact Rows in chunks...`);
      await upsertTable('fact_cross_channel_transactions', factRows, 'transaction_line_id');

      this.logger.log(`ETL Process completed successfully for ${transactions.length} transactions.`);
      
      if (uploadId) {
        await this.csvUploadModel.findByIdAndUpdate(uploadId, {
          $set: {
            'etlReport.stage2_droppedCount': 0,
            'etlReport.stage2_dropReasons': []
          }
        }).exec();
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Critical ETL Failure: ${errMsg}`);
      
      if (uploadId) {
        await this.csvUploadModel.findByIdAndUpdate(uploadId, {
          $set: {
            'etlReport.stage2_droppedCount': transactions.length,
            'etlReport.stage2_dropReasons': [`Supabase Error: ${errMsg}`]
          }
        }).exec();
      }
    }
  }
}
