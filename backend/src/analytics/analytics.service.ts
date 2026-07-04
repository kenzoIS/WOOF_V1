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
import {
  CrossSellCache,
  CrossSellCacheDocument,
} from './schemas/cross-sell-cache.schema';

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
    forecastQuantity?: number;
    projectedNetSales?: number;
    projectedConfidenceLow?: number;
    projectedConfidenceHigh?: number;
    projectedGrossProfit?: number;
    unitPrice?: number;
    unitCost?: number;
  }[];
  fittedValues?: number[];
  modelMetadata?: Record<string, unknown>;
}

interface CrossSellOptions {
  minSupport?: number | string;
  minConfidence?: number | string;
  minLift?: number | string;
  maxBundleCandidates?: number | string;
  hour?: number | string;
  forceRefresh?: boolean | string;
}

type HomeRange = 'today' | 'week' | 'month' | 'custom';
const FORECAST_REVENUE_PAYLOAD_VERSION = 3;
const DEFAULT_FORECAST_DAYS = 30;
const MAX_FORECAST_DAYS = 90;

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(ForecastRun.name)
    private forecastRunModel: Model<ForecastRunDocument>,
    @InjectModel(CrossSellCache.name)
    private crossSellCacheModel: Model<CrossSellCacheDocument>,
    @InjectModel(CsvUpload.name)
    private csvUploadModel: Model<CsvUploadDocument>,
    private readonly configService: ConfigService,
    private readonly exogenousDataService: ExogenousDataService,
  ) {}

  /**
   * Get dashboard KPIs for a given sector
   */
  async getHomeOverview(range = 'week'): Promise<any> {
    const normalizedRange = this.normalizeHomeRange(range);
    const latestRows = await this.transactionModel.aggregate([
      { $group: { _id: null, latestDate: { $max: '$date' } } },
    ]);
    const latestDate = latestRows[0]?.latestDate
      ? new Date(latestRows[0].latestDate)
      : null;

    if (!latestDate || Number.isNaN(latestDate.getTime())) {
      return this.emptyHomeOverview(normalizedRange);
    }

    const { start, end, previousStart, previousEnd } =
      this.getHomeDateWindow(normalizedRange, latestDate);
    const dateFilter = { date: { $gte: start, $lte: end } };
    const previousDateFilter = {
      date: { $gte: previousStart, $lte: previousEnd },
    };

    const [
      currentTotals,
      previousTotals,
      sectorTotals,
      channelTotals,
      series,
      channelBalance,
      heatmap,
      topItems,
    ] = await Promise.all([
      this.aggregateHomeTotals(dateFilter),
      this.aggregateHomeTotals(previousDateFilter),
      this.transactionModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$sector',
            revenue: { $sum: '$netSales' },
            orders: { $addToSet: '$transactionId' },
          },
        },
        { $addFields: { orderCount: { $size: '$orders' } } },
      ]),
      this.transactionModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$channel',
            revenue: { $sum: '$netSales' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.aggregateHomeSeries(dateFilter, normalizedRange),
      this.transactionModel.aggregate([
        {
          $match: {
            ...dateFilter,
            channel: { $in: ['POS', 'Shopee', 'TikTok Shop'] },
          },
        },
        {
          $group: {
            _id: '$channel',
            revenue: { $sum: '$netSales' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.transactionModel.aggregate([
        { $match: { date: { $gte: this.getHeatmapStartDate(end), $lte: end } } },
        {
          $project: {
            sector: 1,
            netSales: 1,
            dateKey: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date',
                timezone: 'Asia/Manila',
              },
            },
            dayOfWeek: {
              $dayOfWeek: {
                date: '$date',
                timezone: 'Asia/Manila',
              },
            },
            hour: {
              $hour: {
                date: '$date',
                timezone: 'Asia/Manila',
              },
            },
          },
        },
        {
          $group: {
            _id: {
              date: '$dateKey',
              dayOfWeek: '$dayOfWeek',
              hourBucket: {
                $subtract: ['$hour', { $mod: ['$hour', 2] }],
              },
              sector: '$sector',
            },
            revenue: { $sum: '$netSales' },
          },
        },
      ]),
      this.transactionModel.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              productName: '$productName',
              sector: '$sector',
              category: '$category',
            },
            revenue: { $sum: '$netSales' },
            quantity: { $sum: '$quantity' },
            orders: { $addToSet: '$transactionId' },
          },
        },
        { $addFields: { orderCount: { $size: '$orders' } } },
        { $sort: { revenue: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const sectorSummary = this.formatHomeSectorSummary(sectorTotals);
    const channelSummary = this.formatHomeChannelSummary(channelTotals);
    const totalRevenue = currentTotals.totalRevenue;
    const totalOrders = currentTotals.totalOrders;
    const retailRevenue =
      sectorSummary.find((item) => item.sector === 'Retail')?.revenue || 0;
    const busiestSector =
      [...sectorSummary].sort((a, b) => b.revenue - a.revenue)[0]?.sector ||
      'None';
    const suggestions = this.buildHomeSuggestions({
      sectorSummary,
      channelSummary,
      topItems,
      totalRevenue,
    });

    return {
      range: normalizedRange,
      anchorDate: latestDate.toISOString(),
      window: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      kpis: {
        totalRevenue: this.round(totalRevenue),
        totalOrders,
        totalQuantity: currentTotals.totalQuantity,
        totalItems: currentTotals.totalItems,
        retailRevenue: this.round(retailRevenue),
        avgOrderValue: totalOrders
          ? this.round(totalRevenue / totalOrders)
          : 0,
        revenueChangePercent: this.percentChange(
          currentTotals.totalRevenue,
          previousTotals.totalRevenue,
        ),
        ordersChangePercent: this.percentChange(
          currentTotals.totalOrders,
          previousTotals.totalOrders,
        ),
        busiestSector,
        pendingSuggestions: suggestions.length,
      },
      insight: this.buildHomeInsight(sectorSummary, channelSummary, suggestions),
      omnichannelSeries: this.formatHomeSeries(series, normalizedRange),
      sectorSummary,
      channelSummary,
      channelBalance: this.formatHomeChannelBalance(channelBalance),
      heatmapDays: this.buildHomeHeatmapDays(end),
      heatmap: this.formatHomeHeatmap(heatmap),
      suggestions,
      nextAction: suggestions[0] || null,
    };
  }

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
      const hasRevenuePayload =
        metadata.forecastRevenuePayloadVersion ===
        FORECAST_REVENUE_PAYLOAD_VERSION;

      if (isCsvStateMatch && isOverridesMatch && hasRevenuePayload) {
        return this.withForecastStartAnchor(cachedForecast.toObject());
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
        actual: point.quantity,
        orders: point.orderCount,
      })),
      module,
    );
    const revenueByDate = new Map(
      dailyData.map((point: any) => [
        point._id,
        this.round(Number(point.revenue) || 0),
      ]),
    );
    const dashboard = await this.getDashboard(module);
    const forecastDays = this.normalizeForecastDays(DEFAULT_FORECAST_DAYS);
    let exogenousPayload: Record<string, unknown> = {};
    let exogenousMetadata: Record<string, unknown> = {};

    let selectedModel: ModelResult | null = null;
    let rejectionReason = '';
    let modelQualityWarning = '';
    if (historical.length >= 21) {
      try {
        if (module === 'Services' || module === 'Cafe') {
          const servicesExogenous = await this.buildServicesExogenousPayload(
            historical,
            forecastDays,
            overrides,
            module,
            dailyData,
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
          modelQualityWarning = `${selectedModel.modelName} MASE ${selectedModel.mase} exceeded 1.2; using the selected model output instead of flattening to an SMA fallback.`;
        }
      } catch (error) {
        rejectionReason =
          error instanceof Error ? error.message : 'Forecast model failed';
      }
    } else {
      rejectionReason = 'At least 21 daily observations are required';
    }

    const useFallback = !selectedModel;
    const finalModel: ModelResult =
      useFallback || !selectedModel
        ? this.buildSmaFallback(historical, forecastDays, rejectionReason)
        : selectedModel;
    const priceCostMatrix = await this.getActivePriceCostMatrix(module);
    const calibratedForecast = this.applyPriceCalibration(
      finalModel.forecast,
      priceCostMatrix,
    );
    const payload = {
      module,
      modelName: finalModel.modelName,
      mase: finalModel.mase,
      mape: finalModel.mape,
      accuracy: finalModel.accuracy,
      isFallback: useFallback,
      rejectionReason: useFallback ? rejectionReason : undefined,
      historical: this.buildAnchoredHistoricalPayload(historical, revenueByDate),
      forecast: calibratedForecast,
      kpis: dashboard.kpis,
      topItems: dashboard.topItems,
      modelMetadata: {
        ...finalModel.modelMetadata,
        emaAlpha: module === 'Cafe' ? 0.3 : 0.4,
        missingDaysFilled: historical.filter((point) => point.isMissingDate)
          .length,
        sourceChannel: 'POS',
        targetVariable: 'quantity_volume',
        forecastRevenuePayloadVersion: FORECAST_REVENUE_PAYLOAD_VERSION,
        forecastUnit: module === 'Services' ? 'service_bookings' : 'items_sold',
        priceCalibration: priceCostMatrix,
        annualDemandQuantity: this.round(
          calibratedForecast.reduce(
            (sum, point) => sum + (point.forecastQuantity ?? point.forecast),
            0,
          ) * (365 / Math.max(calibratedForecast.length, 1)),
        ),
        ...(modelQualityWarning ? { modelQualityWarning } : {}),
        ...exogenousMetadata,
        csvUploadCount: uploadCount,
        latestCsvUploadId: latestUpload ? latestUpload._id.toString() : null,
        latestCsvUploadTime: latestUpload ? latestUpload.uploadedAt.getTime() : null,
      },
      generatedAt: new Date(),
    };

    const savedRun = await this.forecastRunModel.create(payload);
    return this.withForecastStartAnchor(savedRun.toObject());
  }

  /**
   * Cross-selling analysis using association rule mining (FP-Growth) via Python
   * Finds items frequently purchased together in the same transaction
   */
  async getCrossSell(options: CrossSellOptions = {}): Promise<any> {
    const thresholds = this.normalizeCrossSellThresholds(options);
    const hour = this.parseHour(options.hour);
    const transactionMatch = this.buildHourMatch(hour);
    const forceRefresh =
      options.forceRefresh === true || options.forceRefresh === 'true';
    const cacheCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const uploadState = await this.getCsvUploadState();

    if (!forceRefresh) {
      const cached = await this.crossSellCacheModel
        .findOne({
          computedAt: { $gte: cacheCutoff },
          'thresholds.minSupport': thresholds.minSupport,
          'thresholds.minConfidence': thresholds.minConfidence,
          'thresholds.minLift': thresholds.minLift,
          'thresholds.maxBundleCandidates': thresholds.maxBundleCandidates,
          'thresholds.hour': thresholds.hour,
          'uploadState.uploadCount': uploadState.uploadCount,
          'uploadState.latestUploadId': uploadState.latestUploadId,
          'uploadState.latestUploadTime': uploadState.latestUploadTime,
        })
        .sort({ computedAt: -1 })
        .lean()
        .exec();

      if (cached) {
        const cachedResult =
          cached.result && Object.keys(cached.result).length > 0
            ? (cached.result as any)
            : cached;
        const rules = Array.isArray(cachedResult.rules) ? cachedResult.rules : [];
        return {
          ...cachedResult,
          rules,
          thresholds,
          cached: true,
          cacheAgeMs: Date.now() - new Date(cached.computedAt).getTime(),
          sectorBreakdown:
            cachedResult.sectorBreakdown ||
            cached.sectorBreakdown ||
            this.groupRulesBySector(rules),
          computedAt: cached.computedAt,
        };
      }
    }

    // Group items by transaction to build baskets
    const [baskets, rawSummaryRows, hourlyRows, sectorRows] =
      await Promise.all([
        this.transactionModel.aggregate([
          ...(transactionMatch ? [{ $match: transactionMatch }] : []),
          {
            $group: {
              _id: '$transactionId',
              items: { $addToSet: '$productName' },
              sectors: { $addToSet: '$sector' },
              itemSectors: {
                $addToSet: {
                  item: '$productName',
                  sector: '$sector',
                },
              },
              totalAmount: { $sum: '$netSales' },
            },
          },
          { $match: { 'items.1': { $exists: true } } }, // Only baskets with 2+ items
        ]),
        this.transactionModel.aggregate([
          ...(transactionMatch ? [{ $match: transactionMatch }] : []),
          {
            $group: {
              _id: null,
              totalLineItems: { $sum: 1 },
              totalRevenue: { $sum: '$netSales' },
              uniqueTransactions: { $addToSet: '$transactionId' },
              uniqueItems: { $addToSet: '$productName' },
            },
          },
          {
            $project: {
              _id: 0,
              totalLineItems: 1,
              totalRevenue: 1,
              totalTransactions: { $size: '$uniqueTransactions' },
              uniqueItemCount: { $size: '$uniqueItems' },
            },
          },
        ]),
        this.transactionModel.aggregate([
          {
            $group: {
              _id: {
                transactionId: '$transactionId',
                hour: {
                  $hour: {
                    date: '$date',
                    timezone: 'Asia/Manila',
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: '$_id.hour',
              transactions: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        this.transactionModel.aggregate([
          ...(transactionMatch ? [{ $match: transactionMatch }] : []),
          {
            $group: {
              _id: '$sector',
              lineItems: { $sum: 1 },
              transactions: { $addToSet: '$transactionId' },
            },
          },
          {
            $project: {
              _id: 0,
              sector: '$_id',
              lineItems: 1,
              transactionCount: { $size: '$transactions' },
            },
          },
          { $sort: { transactionCount: -1 } },
        ]),
      ]);
    const rawAnalysis = this.buildCrossSellRawAnalysis(
      rawSummaryRows[0],
      hourlyRows,
      sectorRows,
      baskets,
      hour,
    );

    if (baskets.length < 5) {
      return {
        rules: [],
        bundleCandidates: [],
        itemMetrics: [],
        rawAnalysis,
        totalBaskets: baskets.length,
        multiItemBaskets: baskets.length,
        crossSectorBaskets: 0,
        crossSectorRate: 0,
        sectorBreakdown: this.groupRulesBySector([]),
        thresholds,
        uploadState,
        message: 'Not enough multi-item transactions',
      };
    }

    const inputData = baskets.map((b) => ({
      transactionId: b._id,
      items: b.items,
      sectors: b.sectors,
      itemSectors: b.itemSectors,
    }));

    const startedAt = Date.now();
    try {
      const result = await this.runPython<any>('cross_sell.py', {
        baskets: inputData,
        ...thresholds,
      });
      const rules = Array.isArray(result.rules) ? result.rules : [];
      const bundleCandidates = Array.isArray(result.bundleCandidates)
        ? result.bundleCandidates
        : [];
      const itemMetrics = Array.isArray(result.itemMetrics)
        ? result.itemMetrics
        : [];
      const totalBaskets = result.totalBaskets ?? baskets.length;
      const crossSectorBaskets = baskets.filter(
        (b: any) => Array.isArray(b.sectors) && b.sectors.length > 1,
      ).length;
      const crossSectorRate =
        totalBaskets > 0
          ? Math.round((crossSectorBaskets / totalBaskets) * 10000) / 10000
          : 0;
      const payload = {
        ...result,
        rules,
        bundleCandidates,
        itemMetrics,
        rawAnalysis,
        totalBaskets,
        multiItemBaskets: result.multiItemBaskets ?? baskets.length,
        crossSectorBaskets,
        crossSectorRate,
        sectorBreakdown: this.groupRulesBySector(rules),
        thresholds,
        uploadState,
        computationDurationMs: Date.now() - startedAt,
        cached: false,
      };

      await this.crossSellCacheModel.create({
        computedAt: new Date(),
        result: payload,
        rules: payload.rules,
        bundleCandidates: payload.bundleCandidates,
        totalBaskets: payload.totalBaskets,
        multiItemBaskets: payload.multiItemBaskets,
        crossSectorRate: payload.crossSectorRate,
        computationDurationMs: payload.computationDurationMs,
        thresholds,
        uploadState,
        message: payload.message,
        cleanedItems: payload.cleanedItems,
        sectorBreakdown: payload.sectorBreakdown,
      });

      return payload;
    } catch (error) {
      console.error(
        `Cross-sell computation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        rules: [],
        bundleCandidates: [],
        itemMetrics: [],
        rawAnalysis,
        error: 'Cross-sell computation failed',
        totalBaskets: baskets.length,
        multiItemBaskets: baskets.length,
        crossSectorBaskets: 0,
        crossSectorRate: 0,
        sectorBreakdown: this.groupRulesBySector([]),
        thresholds,
        uploadState,
      };
    }
  }

  async getCrossSellConfig(options: CrossSellOptions = {}): Promise<any> {
    const thresholds = this.normalizeCrossSellThresholds(options);
    const cached = await this.crossSellCacheModel
      .findOne({
        'thresholds.minSupport': thresholds.minSupport,
        'thresholds.minConfidence': thresholds.minConfidence,
        'thresholds.minLift': thresholds.minLift,
        'thresholds.maxBundleCandidates': thresholds.maxBundleCandidates,
        'thresholds.hour': thresholds.hour,
      })
      .sort({ computedAt: -1 })
      .lean()
      .exec();

    return {
      thresholds,
      cache: cached
        ? {
            exists: true,
            computedAt: cached.computedAt,
            ageMs: Date.now() - new Date(cached.computedAt).getTime(),
            isFresh:
              Date.now() - new Date(cached.computedAt).getTime() <
              24 * 60 * 60 * 1000,
          }
        : {
            exists: false,
            computedAt: null,
            ageMs: null,
            isFresh: false,
          },
    };
  }

  async getCrossSellBySector(options: CrossSellOptions = {}): Promise<any> {
    const result = await this.getCrossSell(options);
    const rules = (Array.isArray(result.rules) ? result.rules : [])
      .filter((rule: any) => rule.crossSector)
      .sort(
        (a: any, b: any) =>
          (Number(b.lift) || 0) - (Number(a.lift) || 0) ||
          (Number(b.confidence) || 0) - (Number(a.confidence) || 0),
      );

    return {
      ...result,
      rules,
      sectorBreakdown: this.groupRulesBySector(rules),
    };
  }

  async getCrossSellBundles(options: CrossSellOptions = {}): Promise<any> {
    const result = await this.getCrossSell(options);
    const bundleCandidates = (
      Array.isArray(result.bundleCandidates) ? result.bundleCandidates : []
    ).sort(
      (a: any, b: any) =>
        (Number(b.opportunityScore) || 0) -
          (Number(a.opportunityScore) || 0) ||
        (Number(b.anchorSupport) || 0) - (Number(a.anchorSupport) || 0),
    );

    return {
      ...result,
      bundleCandidates,
    };
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

  async getCurrentWeather(): Promise<any> {
    const { lat, lng } = this.exogenousDataService.getDefaultCoordinates();
    const todayStr = new Date().toISOString().slice(0, 10);
    try {
      const records = await this.exogenousDataService.fetchWeatherHistory(
        lat,
        lng,
        todayStr,
        todayStr,
      );
      return records[0] || {
        date: todayStr,
        tempCelsius: 28,
        rainfallMm: 0,
        isSynthetic: true,
      };
    } catch (error) {
      return {
        date: todayStr,
        tempCelsius: 28,
        rainfallMm: 0,
        isSynthetic: true,
        error: error.message,
      };
    }
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

  private normalizeCrossSellThresholds(options: CrossSellOptions): {
    minSupport: number;
    minConfidence: number;
    minLift: number;
    maxBundleCandidates: number;
    hour?: number;
  } {
    return {
      minSupport: Math.max(this.parseThreshold(options.minSupport, 0.05), 0.05),
      minConfidence: Math.max(
        this.parseThreshold(options.minConfidence, 0.6),
        0.6,
      ),
      minLift: Math.max(this.parseThreshold(options.minLift, 1.2), 1.2),
      maxBundleCandidates: this.parseThreshold(
        options.maxBundleCandidates,
        20,
      ),
      ...(this.parseHour(options.hour) !== undefined
        ? { hour: this.parseHour(options.hour) }
        : {}),
    };
  }

  private parseHour(value: number | string | undefined): number | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 23) {
      return undefined;
    }

    return parsed;
  }

  private buildHourMatch(hour: number | undefined): Record<string, unknown> | null {
    if (hour === undefined) {
      return null;
    }

    return {
      $expr: {
        $eq: [
          {
            $hour: {
              date: '$date',
              timezone: 'Asia/Manila',
            },
          },
          hour,
        ],
      },
    };
  }

  private parseThreshold(value: number | string | undefined, fallback: number): number {
    if (value === undefined || value === '') {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }

  private normalizeForecastDays(value: number | string | undefined): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_FORECAST_DAYS;
    }
    return Math.min(Math.max(Math.trunc(parsed), 1), MAX_FORECAST_DAYS);
  }

  private async getCsvUploadState(): Promise<{
    uploadCount: number;
    latestUploadId: string | null;
    latestUploadTime: number | null;
  }> {
    const [latestUpload, uploadCount] = await Promise.all([
      this.csvUploadModel.findOne().sort({ uploadedAt: -1 }).exec(),
      this.csvUploadModel.countDocuments().exec(),
    ]);

    return {
      uploadCount,
      latestUploadId: latestUpload ? latestUpload._id.toString() : null,
      latestUploadTime: latestUpload ? latestUpload.uploadedAt.getTime() : null,
    };
  }

  private buildCrossSellRawAnalysis(
    summary: any,
    hourlyRows: any[],
    sectorRows: any[],
    baskets: any[],
    selectedHour?: number,
  ): Record<string, unknown> {
    const hourlyTransactionVolume = Array.from({ length: 24 }, (_, hour) => {
      const row = hourlyRows.find((item) => Number(item._id) === hour);
      return {
        hour,
        label: this.formatHourLabel(hour),
        transactions: row ? Number(row.transactions) || 0 : 0,
      };
    });
    const totalBaskets = baskets.length;
    const totalBasketItems = baskets.reduce(
      (sum, basket) => sum + (Array.isArray(basket.items) ? basket.items.length : 0),
      0,
    );
    const crossSectorBaskets = baskets.filter(
      (basket) => Array.isArray(basket.sectors) && basket.sectors.length > 1,
    ).length;

    return {
      totalTransactions: Number(summary?.totalTransactions) || 0,
      totalLineItems: Number(summary?.totalLineItems) || 0,
      uniqueItemCount: Number(summary?.uniqueItemCount) || 0,
      totalRevenue: this.round(Number(summary?.totalRevenue) || 0),
      selectedHour: selectedHour ?? null,
      multiItemBaskets: totalBaskets,
      avgItemsPerBasket:
        totalBaskets > 0 ? this.round(totalBasketItems / totalBaskets) : 0,
      crossSectorBasketRate:
        totalBaskets > 0
          ? Math.round((crossSectorBaskets / totalBaskets) * 10000) / 10000
          : 0,
      peakHour:
        hourlyTransactionVolume.reduce(
          (peak, row) =>
            row.transactions > peak.transactions ? row : peak,
          hourlyTransactionVolume[0],
        ) || null,
      hourlyTransactionVolume,
      sectorMix: sectorRows.map((row) => ({
        sector: row.sector || 'Unknown',
        lineItems: Number(row.lineItems) || 0,
        transactionCount: Number(row.transactionCount) || 0,
      })),
    };
  }

  private formatHourLabel(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  }

  private groupRulesBySector(rules: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {
      cafeCafe: [],
      cafeRetail: [],
      cafeServices: [],
      retailRetail: [],
      retailServices: [],
      servicesServices: [],
      unknownUnknown: [],
    };

    for (const rule of rules) {
      const leftSector = this.firstRuleSector(rule?.antecedentSectors);
      const rightSector = this.firstRuleSector(rule?.consequentSectors);
      const key = this.buildSectorPairKey(leftSector, rightSector);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(rule);
    }

    for (const key of Object.keys(grouped)) {
      grouped[key].sort(
        (a: any, b: any) =>
          (Number(b.lift) || 0) - (Number(a.lift) || 0) ||
          (Number(b.confidence) || 0) - (Number(a.confidence) || 0),
      );
    }

    return grouped;
  }

  private firstRuleSector(sectors: unknown): string {
    if (!Array.isArray(sectors) || sectors.length === 0) {
      return 'unknown';
    }

    return this.normalizeSectorSlug(String(sectors[0]));
  }

  private buildSectorPairKey(leftSector: string, rightSector: string): string {
    const order = ['cafe', 'retail', 'services', 'unknown'];
    const sectors = [leftSector, rightSector].sort(
      (a, b) => order.indexOf(a) - order.indexOf(b),
    );
    return `${sectors[0]}${this.capitalize(sectors[1])}`;
  }

  private normalizeSectorSlug(sector: string): string {
    const lower = sector.toLowerCase();
    if (lower === 'cafe' || lower === 'coffee') return 'cafe';
    if (lower === 'retail' || lower === 'pet supplies') return 'retail';
    if (lower === 'services' || lower === 'grooming') return 'services';
    return 'unknown';
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private resolvePythonCommand(): string {
    const localPython = path.join(
      process.cwd(),
      '.venv',
      process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python',
    );

    return (
      this.configService.get<string>('PYTHON_PATH') ||
      (existsSync(localPython)
        ? localPython
        : process.platform === 'win32'
          ? 'python'
          : 'python3')
    );
  }

  private async buildServicesExogenousPayload(
    historical: NormalizedDailyValue[],
    forecastDays: number,
    overrides?: { temp?: string; rain?: string; holiday?: string },
    module?: ForecastModule,
    dailyData: any[] = [],
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
      const historicalPriceByDate = this.buildHistoricalUnitPriceMap(dailyData);
      const defaultUnitPrice = await this.getCurrentUnitPriceFromTransactions(
        historical[historical.length - 1]?.date,
        module || 'Services',
      );
      const historicalExogenous = this.exogenousDataService
        .buildExogenousMatrix(historicalDates, weatherRecords, holidayRecords)
        .map((row) => ({
          ...row,
          average_unit_price:
            historicalPriceByDate.get(row.date) ?? defaultUnitPrice,
        }));
      (
        exogenousForecast as unknown as Array<Record<string, number | string>>
      ).forEach((row) => {
        row.average_unit_price = defaultUnitPrice;
      });

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
          exogenous: historicalExogenous,
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

  private buildAnchoredHistoricalPayload(
    historical: NormalizedDailyValue[],
    revenueByDate = new Map<string, number>(),
  ): Array<{
    date: string;
    actual: number;
    normalized: number;
    orders: number;
    revenue: number;
    fitted?: number;
  }> {
    const lastIndex = historical.length - 1;
    return historical.map(({ date, actual, normalized, orders }, index) => ({
      date,
      actual,
      normalized,
      orders,
      revenue: revenueByDate.get(date) || 0,
      fitted: index === lastIndex ? actual : undefined,
    }));
  }

  private applyPriceCalibration(
    forecast: ModelResult['forecast'],
    matrix: {
      unitPrice: number;
      unitCost: number;
      source: string;
    },
  ): ModelResult['forecast'] {
    return forecast.map((point) => {
      const forecastQuantity = this.round(Math.max(0, Number(point.forecast) || 0));
      const confidenceLow =
        point.confidenceLow === undefined
          ? undefined
          : this.round(Math.max(0, Number(point.confidenceLow) || 0));
      const confidenceHigh =
        point.confidenceHigh === undefined
          ? undefined
          : this.round(Math.max(0, Number(point.confidenceHigh) || 0));

      return {
        ...point,
        forecast: forecastQuantity,
        forecastQuantity,
        confidenceLow,
        confidenceHigh,
        projectedNetSales: this.round(forecastQuantity * matrix.unitPrice),
        projectedConfidenceLow:
          confidenceLow === undefined
            ? undefined
            : this.round(confidenceLow * matrix.unitPrice),
        projectedConfidenceHigh:
          confidenceHigh === undefined
            ? undefined
            : this.round(confidenceHigh * matrix.unitPrice),
        projectedGrossProfit: this.round(
          forecastQuantity * (matrix.unitPrice - matrix.unitCost),
        ),
        unitPrice: matrix.unitPrice,
        unitCost: matrix.unitCost,
      };
    });
  }

  private async getActivePriceCostMatrix(module: ForecastModule): Promise<{
    unitPrice: number;
    unitCost: number;
    source: string;
  }> {
    const rows = await this.transactionModel.aggregate([
      {
        $match: {
          sector: module,
          channel: 'POS',
          date: { $gte: new Date('2026-01-01T00:00:00.000Z') },
          unitPrice: { $gt: 0 },
          quantity: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          weightedRevenue: { $sum: { $multiply: ['$unitPrice', '$quantity'] } },
          quantity: { $sum: '$quantity' },
        },
      },
    ]);
    const row = Array.isArray(rows) ? rows[0] : undefined;
    const unitPrice =
      row?.quantity > 0 ? this.round(row.weightedRevenue / row.quantity) : 0;
    const configuredCost = this.configService.get<string>(
      `CURRENT_UNIT_COST_${module.toUpperCase()}`,
    );
    const parsedCost =
      configuredCost === undefined ? NaN : Number(configuredCost);

    return {
      unitPrice,
      unitCost: Number.isFinite(parsedCost) ? this.round(parsedCost) : 0,
      source: unitPrice > 0 ? '2026_pos_weighted_average' : 'unavailable',
    };
  }

  private buildHistoricalUnitPriceMap(dailyData: any[]): Map<string, number> {
    const byDate = new Map<string, number>();
    for (const point of dailyData) {
      const quantity = Number(point.quantity) || 0;
      const revenue = Number(point.revenue) || 0;
      if (point._id && quantity > 0) {
        byDate.set(point._id, this.round(revenue / quantity));
      }
    }
    return byDate;
  }

  private async getCurrentUnitPriceFromTransactions(
    anchorDate?: string,
    module?: ForecastModule,
  ): Promise<number> {
    const minDate = anchorDate
      ? new Date(`${anchorDate.slice(0, 4)}-01-01T00:00:00.000Z`)
      : new Date('2026-01-01T00:00:00.000Z');
    const rows = await this.transactionModel.aggregate([
      {
        $match: {
          ...(module ? { sector: module, channel: 'POS' } : {}),
          date: { $gte: minDate },
          unitPrice: { $gt: 0 },
          quantity: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          weightedRevenue: { $sum: { $multiply: ['$unitPrice', '$quantity'] } },
          quantity: { $sum: '$quantity' },
        },
      },
    ]);
    const row = Array.isArray(rows) ? rows[0] : undefined;
    return row?.quantity > 0 ? this.round(row.weightedRevenue / row.quantity) : 0;
  }

  private withForecastStartAnchor<T extends { historical?: any[]; modelMetadata?: Record<string, unknown> }>(
    run: T,
  ): T {
    const historical = Array.isArray(run.historical) ? run.historical : [];
    const lastIndex = historical.length - 1;
    const anchoredHistorical = historical.map((point, index) => {
      const { fitted: _fitted, ...rest } = point;
      return index === lastIndex ? { ...rest, fitted: point.actual } : rest;
    });

    return {
      ...run,
      historical: anchoredHistorical,
      modelMetadata: {
        ...(run.modelMetadata || {}),
        predictionStartsAt:
          lastIndex >= 0 ? anchoredHistorical[lastIndex].date : null,
        predictionAnchorValue:
          lastIndex >= 0 ? anchoredHistorical[lastIndex].actual : null,
        predictionTrendMode: 'future-anchor',
      },
    };
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
    const pythonCommand = this.resolvePythonCommand();

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

    const fittedValues: number[] = [];
    for (let index = 0; index < actuals.length; index += 1) {
      if (index < 7) {
        fittedValues.push(actuals[index]);
      } else {
        fittedValues.push(this.round(this.average(actuals.slice(index - 7, index))));
      }
    }

    return {
      modelName: 'SMA (7-day fallback)',
      ...metrics,
      forecast,
      fittedValues,
      modelMetadata: { fallbackReason: reason, windowDays: 7 },
    };
  }

  private normalizeHomeRange(range: string): HomeRange {
    const lower = range.toLowerCase();
    if (lower === 'today') return 'today';
    if (lower === 'month') return 'month';
    if (lower === 'custom') return 'custom';
    return 'week';
  }

  private getHomeDateWindow(range: HomeRange, latestDate: Date): {
    start: Date;
    end: Date;
    previousStart: Date;
    previousEnd: Date;
  } {
    const end = new Date(latestDate);
    const start = new Date(latestDate);
    start.setHours(0, 0, 0, 0);

    const dayCount =
      range === 'today' ? 1 : range === 'month' ? 30 : range === 'custom' ? 90 : 7;
    if (dayCount > 1) {
      start.setDate(start.getDate() - dayCount + 1);
    }

    const previousEnd = new Date(start);
    previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - dayCount + 1);
    previousStart.setHours(0, 0, 0, 0);

    return { start, end, previousStart, previousEnd };
  }

  private async aggregateHomeTotals(match: Record<string, unknown>): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalQuantity: number;
    totalItems: number;
  }> {
    const rows = await this.transactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$netSales' },
          totalOrders: { $addToSet: '$transactionId' },
          totalQuantity: { $sum: '$quantity' },
          totalItems: { $sum: 1 },
        },
      },
    ]);
    const row = rows[0];
    return {
      totalRevenue: Number(row?.totalRevenue) || 0,
      totalOrders: Array.isArray(row?.totalOrders) ? row.totalOrders.length : 0,
      totalQuantity: Number(row?.totalQuantity) || 0,
      totalItems: Number(row?.totalItems) || 0,
    };
  }

  private aggregateHomeSeries(
    match: Record<string, unknown>,
    range: HomeRange,
  ): Promise<any[]> {
    const groupId =
      range === 'today'
        ? {
            hour: { $hour: '$date' },
            sector: '$sector',
            channel: '$channel',
          }
        : {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            sector: '$sector',
            channel: '$channel',
          };

    return this.transactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupId,
          revenue: { $sum: '$netSales' },
        },
      },
      { $sort: range === 'today' ? { '_id.hour': 1 } : { '_id.date': 1 } },
    ]);
  }

  private formatHomeSeries(rows: any[], range: HomeRange): any[] {
    const points = new Map<string, any>();
    for (const row of rows) {
      const id = row._id || {};
      const label =
        range === 'today'
          ? this.formatHourLabel(Number(id.hour) || 0)
          : String(id.date || '');
      if (!points.has(label)) {
        points.set(label, { hour: label, cafe: 0, services: 0, retail: 0, online: 0 });
      }
      const point = points.get(label);
      const revenue = this.round(Number(row.revenue) || 0);
      if (id.channel && id.channel !== 'POS') {
        point.online += revenue;
      } else if (id.sector === 'Cafe') {
        point.cafe += revenue;
      } else if (id.sector === 'Services') {
        point.services += revenue;
      } else {
        point.retail += revenue;
      }
    }

    return Array.from(points.values()).map((point) => ({
      ...point,
      cafe: this.round(point.cafe),
      services: this.round(point.services),
      retail: this.round(point.retail),
      online: this.round(point.online),
    }));
  }

  private formatHomeSectorSummary(rows: any[]): any[] {
    const sectors = ['Cafe', 'Services', 'Retail'];
    return sectors.map((sector) => {
      const row = rows.find((entry) => entry._id === sector);
      return {
        sector,
        revenue: this.round(Number(row?.revenue) || 0),
        orders: Number(row?.orderCount) || 0,
      };
    });
  }

  private formatHomeChannelSummary(rows: any[]): any[] {
    return rows.map((row) => ({
      channel: row._id || 'Unknown',
      revenue: this.round(Number(row.revenue) || 0),
      count: Number(row.count) || 0,
    }));
  }

  private formatHomeChannelBalance(rows: any[]): any[] {
    const labels: Record<string, string> = {
      POS: 'Offline Channel (POS)',
      Shopee: 'Online Channel (Shopee)',
      'TikTok Shop': 'Online Channel (TikTok Shop)',
    };
    const order = ['POS', 'Shopee', 'TikTok Shop'];
    const byChannel = new Map(rows.map((row) => [row._id, row]));

    return order
      .map((channel) => {
        const row = byChannel.get(channel);
        const revenue = this.round(Number(row?.revenue) || 0);
        if (revenue <= 0) return null;
        return {
          category: labels[channel],
          channel,
          physical: channel === 'POS' ? revenue : 0,
          online: channel === 'POS' ? 0 : revenue,
          count: Number(row?.count) || 0,
        };
      })
      .filter(Boolean);
  }

  private getHeatmapStartDate(end: Date): Date {
    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return start;
  }

  private buildHomeHeatmapDays(end: Date): any[] {
    const anchorDate = this.formatDateInTimeZone(end, 'Asia/Manila');
    const anchor = new Date(`${anchorDate}T12:00:00.000Z`);

    return Array.from({ length: 7 }, (_, index) => {
      const value = new Date(anchor);
      value.setUTCDate(anchor.getUTCDate() - 6 + index);
      const date = value.toISOString().slice(0, 10);
      return {
        date,
        dayLabel: this.formatHeatmapWeekday(date),
        label: this.formatHeatmapDisplayLabel(date),
      };
    });
  }

  private formatHomeHeatmap(rows: any[]): any[] {
    const maxRevenue = Math.max(
      1,
      ...rows.map((row) => Number(row.revenue) || 0),
    );
    return rows.map((row) => ({
      date: String(row._id?.date || ''),
      dayOfWeek: Number(row._id?.dayOfWeek) || 1,
      dayLabel: row._id?.date
        ? this.formatHeatmapWeekday(String(row._id.date))
        : '',
      hourBucket: Number(row._id?.hourBucket) || 0,
      sector: row._id?.sector || 'Unknown',
      revenue: this.round(Number(row.revenue) || 0),
      intensity: this.round(((Number(row.revenue) || 0) / maxRevenue) * 100),
    }));
  }

  private formatDateInTimeZone(date: Date, timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  }

  private formatHeatmapWeekday(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00.000Z`));
  }

  private formatHeatmapDisplayLabel(date: string): string {
    const value = new Date(`${date}T12:00:00.000Z`);
    const weekday = this.formatHeatmapWeekday(date);
    const monthDay = new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(value);
    return `${weekday} ${monthDay}`;
  }

  private buildHomeSuggestions(input: {
    sectorSummary: any[];
    channelSummary: any[];
    topItems: any[];
    totalRevenue: number;
  }): any[] {
    const topSector = [...input.sectorSummary].sort(
      (a, b) => b.revenue - a.revenue,
    )[0];
    const topItem = input.topItems[0];
    const onlineRevenue = input.channelSummary
      .filter((row) => row.channel !== 'POS')
      .reduce((sum, row) => sum + row.revenue, 0);
    const posRevenue = input.channelSummary
      .filter((row) => row.channel === 'POS')
      .reduce((sum, row) => sum + row.revenue, 0);

    const suggestions: any[] = [];
    if (topItem) {
      const confidence = Math.min(
        95,
        Math.max(60, Math.round((topItem.revenue / Math.max(input.totalRevenue, 1)) * 100 + 60)),
      );
      suggestions.push({
        id: 1,
        title: `Promote ${topItem._id.productName}`,
        trigger: 'Next high-traffic sales window',
        discount: 'Targeted bundle or featured placement',
        expectedLift: `+${this.formatPeso(topItem.revenue * 0.08)}`,
        confidence: `${confidence}%`,
        reason: `${topItem._id.productName} is currently the top revenue driver in ${topItem._id.sector}.`,
        detailedExplanation: `This recommendation is based on uploaded transaction data. ${topItem._id.productName} generated ${this.formatPeso(topItem.revenue)} across ${topItem.orderCount} orders in the selected period, making it the strongest candidate for promotion or bundling.`,
      });
    }

    if (topSector?.revenue > 0) {
      suggestions.push({
        id: 2,
        title: `Prioritize ${topSector.sector} inventory and staffing`,
        trigger: 'Current selected period',
        discount: 'Operational action',
        expectedLift: `+${this.formatPeso(topSector.revenue * 0.05)}`,
        confidence: '82%',
        reason: `${topSector.sector} is the busiest sector by revenue.`,
        detailedExplanation: `${topSector.sector} produced ${this.formatPeso(topSector.revenue)} from ${topSector.orders} orders. Keep high-demand items visible and staff this area first during peak periods.`,
      });
    }

    if (onlineRevenue > 0 || posRevenue > 0) {
      const weaker = onlineRevenue < posRevenue ? 'online' : 'physical POS';
      suggestions.push({
        id: 3,
        title: `Rebalance ${weaker} channel performance`,
        trigger: 'Channel balance monitor',
        discount: 'Channel-specific offer',
        expectedLift: `+${this.formatPeso(Math.abs(posRevenue - onlineRevenue) * 0.04)}`,
        confidence: '76%',
        reason: `Uploaded sales show a visible gap between physical and online channels.`,
        detailedExplanation: `Physical POS revenue is ${this.formatPeso(posRevenue)} while online revenue is ${this.formatPeso(onlineRevenue)}. Use this gap to decide whether to push marketplace promos or in-store conversion tactics.`,
      });
    }

    return suggestions;
  }

  private buildHomeInsight(
    sectorSummary: any[],
    channelSummary: any[],
    suggestions: any[],
  ): string {
    const topSector = [...sectorSummary].sort((a, b) => b.revenue - a.revenue)[0];
    const topChannel = [...channelSummary].sort((a, b) => b.revenue - a.revenue)[0];
    if (!topSector || topSector.revenue === 0) {
      return 'Upload transaction data to activate live Home insights.';
    }
    return `${topSector.sector} is leading revenue at ${this.formatPeso(topSector.revenue)}. ${topChannel?.channel || 'POS'} is the strongest channel, and ${suggestions.length} data-driven actions are ready for review.`;
  }

  private emptyHomeOverview(range: HomeRange): any {
    return {
      range,
      anchorDate: null,
      window: null,
      kpis: {
        totalRevenue: 0,
        totalOrders: 0,
        totalQuantity: 0,
        totalItems: 0,
        retailRevenue: 0,
        avgOrderValue: 0,
        revenueChangePercent: 0,
        ordersChangePercent: 0,
        busiestSector: 'None',
        pendingSuggestions: 0,
      },
      insight: 'Upload transaction data to activate live Home insights.',
      omnichannelSeries: [],
      sectorSummary: [
        { sector: 'Cafe', revenue: 0, orders: 0 },
        { sector: 'Services', revenue: 0, orders: 0 },
        { sector: 'Retail', revenue: 0, orders: 0 },
      ],
      channelSummary: [],
      channelBalance: [],
      heatmapDays: [],
      heatmap: [],
      suggestions: [],
      nextAction: null,
    };
  }

  private percentChange(current: number, previous: number): number {
    if (!previous) return current > 0 ? 100 : 0;
    return this.round(((current - previous) / previous) * 100);
  }

  private addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private formatPeso(value: number): string {
    return `PHP ${this.round(value).toLocaleString('en-US')}`;
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
    const forecastDays = this.normalizeForecastDays(DEFAULT_FORECAST_DAYS);
    const result = await this.runPython<any>('forecast.py', {
      data: inputData,
      forecastDays,
    });
    return {
      ...result,
      historical: (result.historical || []).map((point: any, index: number) => ({
        date: point.date,
        actual: point.revenue ?? point.actual,
        orders: point.orders,
        fitted: result.fittedValues && result.fittedValues[index] !== undefined 
          ? result.fittedValues[index] 
          : undefined,
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
