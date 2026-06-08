import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionDocument } from '../csv/schemas/transaction.schema';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  /**
   * Get dashboard KPIs for a given sector
   */
  async getDashboard(sector: string): Promise<any> {
    const sectorFilter = sector === 'all' ? {} : { sector: this.normalizeSector(sector) };

    const [kpis, topItems, dailyRevenue, channelBreakdown] = await Promise.all([
      // KPIs
      this.transactionModel.aggregate([
        { $match: sectorFilter },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$netSales' },
            totalOrders: { $addToSet: '$transactionId' },
            totalQuantity: { $sum: '$quantity' },
            totalItems: { $sum: 1 },
          },
        },
      ]),
      // Top items by revenue
      this.transactionModel.aggregate([
        { $match: sectorFilter },
        {
          $group: {
            _id: '$productName',
            revenue: { $sum: '$netSales' },
            quantity: { $sum: '$quantity' },
            transactions: { $addToSet: '$transactionId' },
            avgPrice: { $avg: '$unitPrice' },
            category: { $first: '$category' },
          },
        },
        { $addFields: { orderCount: { $size: '$transactions' } } },
        { $sort: { revenue: -1 } },
        { $limit: 20 },
        { $project: { transactions: 0 } },
      ]),
      // Daily revenue over time
      this.transactionModel.aggregate([
        { $match: sectorFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            revenue: { $sum: '$netSales' },
            orders: { $addToSet: '$transactionId' },
            quantity: { $sum: '$quantity' },
          },
        },
        { $addFields: { orderCount: { $size: '$orders' } } },
        { $sort: { _id: 1 } },
        { $project: { orders: 0 } },
      ]),
      // Channel breakdown
      this.transactionModel.aggregate([
        { $match: sectorFilter },
        {
          $group: {
            _id: '$channel',
            revenue: { $sum: '$netSales' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const kpi = kpis[0] || { totalRevenue: 0, totalOrders: [], totalQuantity: 0, totalItems: 0 };

    return {
      kpis: {
        totalRevenue: Math.round(kpi.totalRevenue * 100) / 100,
        totalOrders: Array.isArray(kpi.totalOrders) ? kpi.totalOrders.length : 0,
        totalQuantity: kpi.totalQuantity,
        totalItems: kpi.totalItems,
        avgOrderValue: kpi.totalOrders?.length
          ? Math.round((kpi.totalRevenue / kpi.totalOrders.length) * 100) / 100
          : 0,
      },
      topItems: topItems.map((item: any) => ({
        name: item._id,
        revenue: Math.round(item.revenue * 100) / 100,
        quantity: item.quantity,
        orderCount: item.orderCount,
        avgPrice: Math.round(item.avgPrice * 100) / 100,
        category: item.category || 'Uncategorized',
      })),
      dailyRevenue: dailyRevenue.map((d: any) => ({
        date: d._id,
        revenue: Math.round(d.revenue * 100) / 100,
        orders: d.orderCount,
        quantity: d.quantity,
      })),
      channelBreakdown: channelBreakdown.map((c: any) => ({
        channel: c._id,
        revenue: Math.round(c.revenue * 100) / 100,
        count: c.count,
      })),
    };
  }

  /**
   * Get demand forecast data for a sector
   * Uses Prophet + SARIMAX running in Python sub-process
   */
  async getForecast(sector: string): Promise<any> {
    const sectorFilter = sector === 'all' ? {} : { sector: this.normalizeSector(sector) };

    // Get daily aggregated data
    const dailyData = await this.transactionModel.aggregate([
      { $match: sectorFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          revenue: { $sum: '$netSales' },
          orders: { $addToSet: '$transactionId' },
          quantity: { $sum: '$quantity' },
        },
      },
      { $addFields: { orderCount: { $size: '$orders' } } },
      { $sort: { _id: 1 } },
      { $project: { orders: 0 } },
    ]);

    if (dailyData.length < 14) {
      return {
        historical: dailyData.map((d: any) => ({
          date: d._id,
          actual: Math.round(d.revenue * 100) / 100,
          orders: d.orderCount,
        })),
        forecast: [],
        modelInfo: { model: 'Insufficient data (needs 14+ days for Prophet)', accuracy: 0 },
      };
    }

    const inputData = dailyData.map(d => ({
      date: d._id,
      revenue: Math.round(d.revenue * 100) / 100,
      orders: d.orderCount,
    }));

    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'src', 'analytics', 'python', 'forecast.py');
      const pythonCmd = path.join(process.cwd(), 'venv', 'bin', 'python3');
      const pythonProcess = spawn(pythonCmd, [scriptPath]);
      
      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python script exited with code ${code}: ${errorString}`);
          reject(new Error(`Python forecast failed: ${errorString}`));
          return;
        }
        try {
          const result = JSON.parse(dataString);
          if (result.error) {
            reject(new Error(`Python forecast error: ${result.error}`));
          } else {
            // Normalize historical field names: Python returns 'revenue', frontend expects 'actual'
            if (result.historical) {
              result.historical = result.historical.map((d: any) => ({
                date: d.date,
                actual: d.revenue ?? d.actual,
                orders: d.orders,
              }));
            }
            resolve(result);
          }
        } catch (e) {
          console.error('Failed to parse Python output:', dataString);
          reject(new Error('Failed to parse Python forecast output'));
        }
      });

      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();
    });
  }

  /**
   * Cross-selling analysis using association rule mining (FP-Growth) via Python
   * Finds items frequently purchased together in the same transaction
   */
  async getCrossSell(): Promise<any> {
    // Group items by transaction to build baskets
    const baskets = await this.transactionModel.aggregate([
      {
        $group: {
          _id: '$transactionId',
          items: { $addToSet: '$productName' },
          sectors: { $addToSet: '$sector' },
          totalAmount: { $sum: '$netSales' },
        },
      },
      { $match: { 'items.1': { $exists: true } } }, // Only baskets with 2+ items
    ]);

    if (baskets.length < 5) {
      return { rules: [], totalBaskets: baskets.length, message: 'Not enough multi-item transactions' };
    }

    const inputData = baskets.map(b => ({
      transactionId: b._id,
      items: b.items,
      sectors: b.sectors
    }));

    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), 'src', 'analytics', 'python', 'cross_sell.py');
      const pythonCmd = path.join(process.cwd(), 'venv', 'bin', 'python3');
      const pythonProcess = spawn(pythonCmd, [scriptPath]);
      
      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python script exited with code ${code}: ${errorString}`);
          reject(new Error(`Python cross-sell failed: ${errorString}`));
          return;
        }
        try {
          const result = JSON.parse(dataString);
          if (result.error) {
            reject(new Error(`Python cross-sell error: ${result.error}`));
          } else {
            // Re-append cross-sector analytics logic on node side
            const totalBaskets = baskets.length;
            const crossSectorBaskets = baskets.filter((b: any) => b.sectors.length > 1);
            const crossSectorRate = totalBaskets > 0 ? crossSectorBaskets.length / totalBaskets : 0;
            
            result.crossSectorBaskets = crossSectorBaskets.length;
            result.crossSectorRate = Math.round(crossSectorRate * 10000) / 10000;
            resolve(result);
          }
        } catch (e) {
          console.error('Failed to parse Python output:', dataString);
          reject(new Error('Failed to parse Python cross-sell output'));
        }
      });

      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();
    });
  }

  /**
   * Get Retail forecast split by channel type: Physical (POS) vs Online (Shopee/TikTok)
   */
  async getRetailForecastByChannel(): Promise<any> {
    const sectorFilter = { sector: 'Retail' };

    // Aggregate daily data split by channel type
    const [physicalData, onlineData] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: { ...sectorFilter, channel: 'POS' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            revenue: { $sum: '$netSales' },
            orders: { $addToSet: '$transactionId' },
          },
        },
        { $addFields: { orderCount: { $size: '$orders' } } },
        { $sort: { _id: 1 } },
        { $project: { orders: 0 } },
      ]),
      this.transactionModel.aggregate([
        { $match: { ...sectorFilter, channel: { $in: ['Shopee', 'TikTok Shop'] } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            revenue: { $sum: '$netSales' },
            orders: { $addToSet: '$transactionId' },
          },
        },
        { $addFields: { orderCount: { $size: '$orders' } } },
        { $sort: { _id: 1 } },
        { $project: { orders: 0 } },
      ]),
    ]);

    const formatSeries = (data: any[]) =>
      data.map(d => ({
        date: d._id,
        revenue: Math.round(d.revenue * 100) / 100,
        orders: d.orderCount,
      }));

    return {
      physical: {
        historical: formatSeries(physicalData),
      },
      online: {
        historical: formatSeries(onlineData),
      },
    };
  }

  private normalizeSector(sector: string): string {
    const lower = sector.toLowerCase();
    if (lower === 'cafe' || lower === 'coffee') return 'Cafe';
    if (lower === 'retail' || lower === 'pet supplies') return 'Retail';
    if (lower === 'services' || lower === 'grooming') return 'Services';
    return sector;
  }
}
