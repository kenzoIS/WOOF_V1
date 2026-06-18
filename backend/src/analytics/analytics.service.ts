import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from '../csv/schemas/transaction.schema';
import {
  CsvUpload,
  CsvUploadDocument,
} from '../csv/schemas/csv-upload.schema';
import { spawn } from 'child_process';
import * as path from 'path';
import { existsSync } from 'fs';
import {
  ForecastModule,
  NormalizedDailyValue,
  normalizeDailySeries,
} from '../common/time-series';
import { ExogenousDataService } from '../common/exogenous-data.service';
import {
  ForecastRun,
  ForecastRunDocument,
} from './schemas/forecast-run.schema';

/**
 * Forecasting limitations for the current capstone implementation:
 * 1. Python child process timeout is not implemented yet; long-running fits can
 *    block the Node request path until Python exits. Phase 2 should add
 *    process-level cancellation from Node.
 * 2. Forecast results are not cached; every API call re-runs the selected
 *    Python model. Phase 3 should cache recent ForecastRun results.
 * 3. Services forecasting now attempts SARIMAX with weather and holiday
 *    regressors when exogenous data is available, then degrades to pure SARIMA.
 *    Deeper exogenous validation remains a Phase 1 improvement.
 */
interface ModelResult {
  modelName: string;
  mase: number;
  mape: number;
  accuracy: number;
  forecast: {
    date: string;
    forecast: number;
    confidenceLow?: number;
    confidenceHigh?: number;
  }[];
  modelMetadata?: Record<string, unknown>;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(ForecastRun.name)
    private forecastRunModel: Model<ForecastRunDocument>,
    @InjectModel(CsvUpload.name)
    private csvUploadModel: Model<CsvUploadDocument>,
    private readonly configService: ConfigService,
    private readonly exogenousDataService: ExogenousDataService,
  ) {}

  /**
   * Get dashboard KPIs for a given sector
   */
  async getDashboard(sector: string): Promise<any> {
    const normalizedSector =
      sector === 'all' ? 'all' : this.normalizeSector(sector);
    const sectorFilter =
      normalizedSector === 'all'
        ? {}
        : {
            sector: normalizedSector,
            ...(normalizedSector === 'Cafe' || normalizedSector === 'Services'
              ? { channel: 'POS' }
              : {}),
          };

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

    const kpi = kpis[0] || {
      totalRevenue: 0,
      totalOrders: [],
      totalQuantity: 0,
      totalItems: 0,
    };

    return {
      kpis: {
        totalRevenue: Math.round(kpi.totalRevenue * 100) / 100,
        totalOrders: Array.isArray(kpi.totalOrders)
          ? kpi.totalOrders.length
          : 0,
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
   * Cafe uses Prophet and Services uses pure SARIMA. Both are validated
   * against held-out POS history before the strict SMA fallback is applied.
   */
  async getForecast(
    sector: string,
    overrides?: { temp?: string; rain?: string; holiday?: string },
  ): Promise<any> {
    if (this.normalizeSector(sector) === 'Retail') {
      return this.getLegacyRetailForecast();
    }
    const module = this.normalizeForecastModule(sector);

    // Caching check
    const cachedForecast = await this.forecastRunModel
      .findOne({ module })
      .sort({ generatedAt: -1 })
      .exec();

    const latestUpload = await this.csvUploadModel.findOne().sort({ uploadedAt: -1 }).exec();
    const uploadCount = await this.csvUploadModel.countDocuments().exec();

    if (cachedForecast) {
      const metadata = cachedForecast.modelMetadata || {};
      const cacheUploadCount = metadata.csvUploadCount;
      const cacheLatestUploadId = metadata.latestCsvUploadId;
      const cacheLatestUploadTime = metadata.latestCsvUploadTime;

      const currentLatestUploadId = latestUpload ? latestUpload._id.toString() : null;
      const currentLatestUploadTime = latestUpload ? latestUpload.uploadedAt.getTime() : null;

      const isCsvStateMatch =
        cacheUploadCount === uploadCount &&
        cacheLatestUploadId === currentLatestUploadId &&
        cacheLatestUploadTime === currentLatestUploadTime;

      // Check overrides match
      const reqTemp = overrides?.temp !== undefined && overrides.temp !== '' ? Number(overrides.temp) : undefined;
      const cacheTemp = metadata.tempOverride !== undefined ? Number(metadata.tempOverride) : undefined;
      
      const reqRain = overrides?.rain !== undefined && overrides.rain !== '' ? (overrides.rain === '1' ? 1 : 0) : undefined;
      const cacheRain = metadata.rainOverride !== undefined ? Number(metadata.rainOverride) : undefined;

      const reqHoliday = overrides?.holiday !== undefined && overrides.holiday !== '' ? (overrides.holiday === '1' ? 1 : 0) : undefined;
      const cacheHoliday = metadata.holidayOverride !== undefined ? Number(metadata.holidayOverride) : undefined;

      const isOverridesMatch =
        reqTemp === cacheTemp &&
        reqRain === cacheRain &&
        reqHoliday === cacheHoliday;

      if (isCsvStateMatch && isOverridesMatch) {
        return cachedForecast.toObject();
      }
    }
    const dailyData = await this.transactionModel.aggregate([
      { $match: { sector: module, channel: 'POS' } },
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
    const historical = normalizeDailySeries(
      dailyData.map((point: any) => ({
        date: point._id,
        actual: point.revenue,
        orders: point.orderCount,
      })),
      module,
    );
    const dashboard = await this.getDashboard(module);
    const forecastDays = module === 'Services' ? 30 : 14;
    let exogenousPayload: Record<string, unknown> = {};
    let exogenousMetadata: Record<string, unknown> = {};

    let selectedModel: ModelResult | null = null;
    let rejectionReason = '';
    if (historical.length >= 21) {
      try {
        if (module === 'Services') {
          const servicesExogenous = await this.buildServicesExogenousPayload(
            historical,
            forecastDays,
            overrides,
          );
          exogenousPayload = servicesExogenous.payload;
          exogenousMetadata = servicesExogenous.metadata;
        }
        selectedModel = await this.runForecastModel(
          module,
          historical,
          forecastDays,
          exogenousPayload,
        );
        if (!Number.isFinite(selectedModel.mase)) {
          rejectionReason = 'Model returned a non-finite MASE score';
          selectedModel = null;
        } else if (selectedModel.mase > 1.2) {
          rejectionReason = `${selectedModel.modelName} MASE ${selectedModel.mase} exceeded 1.2`;
        }
      } catch (error) {
        rejectionReason =
          error instanceof Error ? error.message : 'Forecast model failed';
      }
    } else {
      rejectionReason = 'At least 21 daily observations are required';
    }

    const useFallback = !selectedModel || selectedModel.mase > 1.2;
    const finalModel: ModelResult =
      useFallback || !selectedModel
        ? this.buildSmaFallback(historical, forecastDays, rejectionReason)
        : selectedModel;
    const payload = {
      module,
      modelName: finalModel.modelName,
      mase: finalModel.mase,
      mape: finalModel.mape,
      accuracy: finalModel.accuracy,
      isFallback: useFallback,
      rejectionReason: useFallback ? rejectionReason : undefined,
      historical: historical.map(({ date, actual, normalized, orders }) => ({
        date,
        actual,
        normalized,
        orders,
      })),
      forecast: finalModel.forecast,
      kpis: dashboard.kpis,
      topItems: dashboard.topItems,
      modelMetadata: {
        ...finalModel.modelMetadata,
        emaAlpha: module === 'Cafe' ? 0.3 : 0.4,
        missingDaysFilled: historical.filter((point) => point.isMissingDate)
          .length,
        sourceChannel: 'POS',
        ...exogenousMetadata,
        ...(useFallback && selectedModel
          ? {
              rejectedModel: selectedModel.modelName,
              rejectedModelMase: selectedModel.mase,
            }
          : {}),
        csvUploadCount: uploadCount,
        latestCsvUploadId: latestUpload ? latestUpload._id.toString() : null,
        latestCsvUploadTime: latestUpload ? latestUpload.uploadedAt.getTime() : null,
      },
      generatedAt: new Date(),
    };

    const savedRun = await this.forecastRunModel.create(payload);
    return savedRun.toObject();
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
      return {
        rules: [],
        totalBaskets: baskets.length,
        message: 'Not enough multi-item transactions',
      };
    }

    const inputData = baskets.map((b) => ({
      transactionId: b._id,
      items: b.items,
      sectors: b.sectors,
    }));

    return new Promise((resolve, reject) => {
      const scriptPath = path.join(
        process.cwd(),
        'src',
        'analytics',
        'python',
        'cross_sell.py',
      );
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
          console.error(
            `Python script exited with code ${code}: ${errorString}`,
          );
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
            const crossSectorBaskets = baskets.filter(
              (b: any) => b.sectors.length > 1,
            );
            const crossSectorRate =
              totalBaskets > 0 ? crossSectorBaskets.length / totalBaskets : 0;

            result.crossSectorBaskets = crossSectorBaskets.length;
            result.crossSectorRate =
              Math.round(crossSectorRate * 10000) / 10000;
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
        {
          $match: {
            ...sectorFilter,
            channel: { $in: ['Shopee', 'TikTok Shop'] },
          },
        },
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
      data.map((d) => ({
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

  async getExogenousStatus(): Promise<any> {
    const cacheStatus = await this.exogenousDataService.getCacheStatus();
    const lastServicesForecast = await this.forecastRunModel
      .findOne({ module: 'Services' })
      .sort({ generatedAt: -1 })
      .lean();
    const modelName = (lastServicesForecast as any)?.modelName || null;

    return {
      ...cacheStatus,
      lastServicesForecast: lastServicesForecast
        ? {
            modelName,
            modelType: String(modelName).includes('SARIMAX')
              ? 'SARIMAX'
              : 'SARIMA',
            exogenousVariables:
              (lastServicesForecast as any)?.modelMetadata
                ?.exogenousVariables || [],
            weatherDataSource:
              (lastServicesForecast as any)?.modelMetadata
                ?.weatherDataSource || 'unknown',
            holidayDataSource:
              (lastServicesForecast as any)?.modelMetadata
                ?.holidayDataSource || 'unknown',
            generatedAt: (lastServicesForecast as any)?.generatedAt,
          }
        : null,
    };
  }

  private normalizeForecastModule(sector: string): ForecastModule {
    const normalized = this.normalizeSector(sector);
    if (normalized === 'Cafe' || normalized === 'Services') {
      return normalized;
    }
    throw new BadRequestException(
      'Forecasting is restricted to Cafe and Services',
    );
  }

  private async runForecastModel(
    module: ForecastModule,
    historical: NormalizedDailyValue[],
    forecastDays: number,
    extraPayload: Record<string, unknown> = {},
  ): Promise<ModelResult> {
    const scriptName =
      module === 'Cafe' ? 'cafe_prophet.py' : 'services_sarima.py';
    return this.runPython<ModelResult>(scriptName, {
      data: historical,
      forecastDays,
      ...extraPayload,
    });
  }

  private async buildServicesExogenousPayload(
    historical: NormalizedDailyValue[],
    forecastDays: number,
    overrides?: { temp?: string; rain?: string; holiday?: string },
  ): Promise<{
    payload: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }> {
    if (historical.length === 0) {
      return { payload: {}, metadata: {} };
    }

    try {
      const historicalDates = historical.map((point) => point.date);
      const futureDates = this.buildFutureDates(
        historicalDates[historicalDates.length - 1],
        forecastDays,
      );
      const allDates = [...historicalDates, ...futureDates];
      const { lat, lng } = this.exogenousDataService.getDefaultCoordinates();
      const weatherRecords =
        await this.exogenousDataService.fetchWeatherHistory(
          lat,
          lng,
          allDates[0],
          allDates[allDates.length - 1],
        );
      const years = [...new Set(allDates.map((date) => Number(date.slice(0, 4))))];
      const holidayRecords = (
        await Promise.all(
          years.map((year) => this.exogenousDataService.fetchHolidayHistory(year)),
        )
      ).flat();

      const exogenousForecast = this.exogenousDataService.buildExogenousMatrix(
        futureDates,
        weatherRecords,
        holidayRecords,
      );

      const metadata: Record<string, unknown> = {
        weatherDataSource: this.exogenousDataService.getLastWeatherSource(),
        holidayDataSource: this.exogenousDataService.getLastHolidaySource(),
      };

      if (overrides) {
        if (overrides.temp !== undefined && overrides.temp !== '') {
          const tempVal = Number(overrides.temp);
          if (!Number.isNaN(tempVal)) {
            exogenousForecast.forEach((row) => {
              row.tempCelsius = tempVal;
            });
            metadata.tempOverride = tempVal;
          }
        }
        if (overrides.rain !== undefined && overrides.rain !== '') {
          const rainVal = overrides.rain === '1' ? 1 : 0;
          exogenousForecast.forEach((row) => {
            row.rainFlag = rainVal;
          });
          metadata.rainOverride = rainVal;
        }
        if (overrides.holiday !== undefined && overrides.holiday !== '') {
          const holidayVal = overrides.holiday === '1' ? 1 : 0;
          exogenousForecast.forEach((row) => {
            row.isHoliday = holidayVal;
            row.dayBeforeHoliday = holidayVal;
            row.dayAfterHoliday = holidayVal;
          });
          metadata.holidayOverride = holidayVal;
        }
      }

      return {
        payload: {
          exogenous: this.exogenousDataService.buildExogenousMatrix(
            historicalDates,
            weatherRecords,
            holidayRecords,
          ),
          exogenousForecast,
        },
        metadata,
      };
    } catch (error) {
      console.warn(
        `Services exogenous data unavailable; falling back to pure SARIMA: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        payload: { exogenous: [], exogenousForecast: [] },
        metadata: {
          weatherDataSource: 'synthetic',
          holidayDataSource: 'hardcoded',
        },
      };
    }
  }

  private buildFutureDates(lastDate: string, days: number): string[] {
    const baseDate = new Date(`${lastDate}T00:00:00.000Z`);
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(baseDate);
      date.setUTCDate(date.getUTCDate() + index + 1);
      return date.toISOString().slice(0, 10);
    });
  }

  private runPython<T>(
    scriptName: string,
    input: Record<string, unknown>,
  ): Promise<T> {
    const scriptPath = path.join(
      process.cwd(),
      'src',
      'analytics',
      'python',
      scriptName,
    );
    const localPython = path.join(
      process.cwd(),
      '.venv',
      process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
    );
    const pythonCommand =
      this.configService.get<string>('PYTHON_PATH') ||
      (existsSync(localPython)
        ? localPython
        : process.platform === 'win32'
          ? 'python'
          : 'python3');

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(pythonCommand, [scriptPath], {
        cwd: process.cwd(),
      });
      let stdout = '';
      let stderr = '';
      let settled = false;

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      pythonProcess.on('error', (error) => {
        if (!settled) {
          settled = true;
          reject(
            new Error(
              `Unable to start Python using "${pythonCommand}": ${error.message}`,
            ),
          );
        }
      });
      pythonProcess.on('close', (code) => {
        if (settled) return;
        settled = true;
        if (code !== 0) {
          reject(
            new Error(
              `${scriptName} exited with code ${code}: ${stderr.trim()}`,
            ),
          );
          return;
        }
        try {
          const result = JSON.parse(stdout) as T & { error?: string };
          if (result.error) {
            reject(new Error(result.error));
            return;
          }
          resolve(result);
        } catch {
          reject(
            new Error(
              `Invalid JSON returned by ${scriptName}: ${stdout.slice(0, 300)}`,
            ),
          );
        }
      });

      pythonProcess.stdin.on('error', (error) => {
        if (!settled) {
          settled = true;
          reject(
            new Error(
              `Failed to send input to ${scriptName}: ${error.message}`,
            ),
          );
        }
      });

      const payload = JSON.stringify(input);
      const rowCount = Array.isArray(input.data) ? input.data.length : 0;
      const chunkSize = rowCount > 5000 ? 16 * 1024 : 64 * 1024;
      let offset = 0;

      const writeNextChunk = () => {
        if (settled) return;
        if (offset >= payload.length) {
          pythonProcess.stdin.end();
          return;
        }

        const nextOffset = Math.min(offset + chunkSize, payload.length);
        const canContinue = pythonProcess.stdin.write(
          payload.slice(offset, nextOffset),
        );
        offset = nextOffset;
        if (canContinue) {
          setImmediate(writeNextChunk);
        } else {
          pythonProcess.stdin.once('drain', writeNextChunk);
        }
      };

      writeNextChunk();
    });
  }

  private buildSmaFallback(
    historical: NormalizedDailyValue[],
    forecastDays: number,
    reason: string,
  ): ModelResult {
    if (historical.length === 0) {
      return {
        modelName: 'SMA (7-day fallback)',
        mase: 0,
        mape: 0,
        accuracy: 0,
        forecast: [],
        modelMetadata: { fallbackReason: reason, windowDays: 7 },
      };
    }

    const actuals = historical.map((point) => point.actual);
    const windowSize = Math.min(7, actuals.length);
    const forecastValue = this.average(actuals.slice(-windowSize));
    const lastDate = new Date(
      `${historical[historical.length - 1].date}T00:00:00.000Z`,
    );
    const forecast = Array.from({ length: forecastDays }, (_, index) => {
      const date = new Date(lastDate);
      date.setUTCDate(date.getUTCDate() + index + 1);
      return {
        date: date.toISOString().slice(0, 10),
        forecast: this.round(forecastValue),
        confidenceLow: this.round(Math.max(0, forecastValue * 0.9)),
        confidenceHigh: this.round(forecastValue * 1.1),
      };
    });

    const validationActual: number[] = [];
    const validationPredicted: number[] = [];
    for (let index = 7; index < actuals.length; index += 1) {
      validationActual.push(actuals[index]);
      validationPredicted.push(this.average(actuals.slice(index - 7, index)));
    }
    const metrics = this.calculateMetrics(
      validationActual,
      validationPredicted,
      actuals.slice(0, Math.max(1, actuals.length - validationActual.length)),
    );

    return {
      modelName: 'SMA (7-day fallback)',
      ...metrics,
      forecast,
      modelMetadata: { fallbackReason: reason, windowDays: 7 },
    };
  }

  private calculateMetrics(
    actual: number[],
    predicted: number[],
    training: number[],
  ): Pick<ModelResult, 'mase' | 'mape' | 'accuracy'> {
    if (actual.length === 0) {
      return { mase: 0, mape: 0, accuracy: 0 };
    }
    const absoluteErrors = actual.map((value, index) =>
      Math.abs(value - predicted[index]),
    );
    const mae = this.average(absoluteErrors);
    const naiveErrors = training
      .slice(1)
      .map((value, index) => Math.abs(value - training[index]));
    const naiveMae = this.average(naiveErrors);
    const percentageErrors = actual
      .map((value, index) =>
        value === 0 ? null : Math.abs((value - predicted[index]) / value) * 100,
      )
      .filter((value): value is number => value !== null);
    const mape = this.average(percentageErrors);
    return {
      mase: this.round(naiveMae > 0 ? mae / naiveMae : mae === 0 ? 0 : 999),
      mape: this.round(mape),
      accuracy: this.round(Math.max(0, 100 - mape)),
    };
  }

  private async getLegacyRetailForecast(): Promise<any> {
    const dailyData = await this.transactionModel.aggregate([
      { $match: { sector: 'Retail' } },
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
    ]);
    const inputData = dailyData.map((point: any) => ({
      date: point._id,
      revenue: this.round(point.revenue),
      orders: point.orderCount,
    }));
    if (inputData.length < 14) {
      return {
        historical: inputData.map((point: any) => ({
          date: point.date,
          actual: point.revenue,
          orders: point.orders,
        })),
        forecast: [],
        modelInfo: { model: 'Insufficient data', accuracy: 0 },
      };
    }
    const result = await this.runPython<any>('forecast.py', inputData as any);
    return {
      ...result,
      historical: (result.historical || []).map((point: any) => ({
        date: point.date,
        actual: point.revenue ?? point.actual,
        orders: point.orders,
      })),
    };
  }

  private average(values: number[]): number {
    return values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private normalizeSector(sector: string): string {
    const lower = sector.toLowerCase();
    if (lower === 'cafe' || lower === 'coffee') return 'Cafe';
    if (lower === 'retail' || lower === 'pet supplies') return 'Retail';
    if (lower === 'services' || lower === 'grooming') return 'Services';
    return sector;
  }
}
