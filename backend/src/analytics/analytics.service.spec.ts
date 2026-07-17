import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { AnalyticsService } from './analytics.service';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

describe('AnalyticsService getForecast', () => {
  const transactionModel = {
    aggregate: jest.fn(),
  };
  const forecastRunModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const crossSellCacheModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const csvUploadModel = {
    findOne: jest.fn(),
    countDocuments: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
  };
  const exogenousDataService = {
    getDefaultCoordinates: jest.fn(),
    fetchWeatherHistory: jest.fn(),
    fetchHolidayHistory: jest.fn(),
    buildExogenousMatrix: jest.fn(),
    getLastWeatherSource: jest.fn(),
    getLastHolidaySource: jest.fn(),
    getCacheStatus: jest.fn(),
  };

  let service: AnalyticsService;

  const dailyRows = (days: number) =>
    Array.from({ length: days }, (_, index) => {
      const date = new Date(Date.UTC(2026, 0, index + 1));
      return {
        _id: date.toISOString().slice(0, 10),
        revenue: (10 + index) * 120,
        orderCount: 2 + index,
        quantity: 10 + index,
      };
    });

  const forecastRows = (days: number) =>
    Array.from({ length: days }, (_, index) => {
      const date = new Date(Date.UTC(2026, 0, 22 + index));
      return {
        date: date.toISOString().slice(0, 10),
        forecast: 150 + index,
        confidenceLow: 140 + index,
        confidenceHigh: 160 + index,
      };
    });

  const forecastRowsFromActuals = (
    rows: Array<{ _id: string; quantity: number }>,
    startIndex: number,
    days: number,
  ) =>
    Array.from({ length: days }, (_, index) => {
      const row = rows[startIndex + index];
      if (row) {
        return {
          date: row._id,
          forecast: row.quantity,
          confidenceLow: Math.max(0, row.quantity - 1),
          confidenceHigh: row.quantity + 1,
        };
      }
      const lastDate = new Date(`${rows[rows.length - 1]._id}T00:00:00.000Z`);
      lastDate.setUTCDate(lastDate.getUTCDate() + index - (rows.length - startIndex) + 1);
      return {
        date: lastDate.toISOString().slice(0, 10),
        forecast: 120,
        confidenceLow: 110,
        confidenceHigh: 130,
      };
    });

  const mockForecastAggregates = (days: number) => {
    const rows = dailyRows(days);
    transactionModel.aggregate
      .mockResolvedValueOnce(rows)
      .mockResolvedValueOnce([
        {
          totalRevenue: 2500,
          totalOrders: ['txn-1', 'txn-2'],
          totalQuantity: 50,
          totalItems: 25,
        },
      ])
      .mockResolvedValueOnce([
        {
          _id: 'Latte',
          revenue: 900,
          quantity: 12,
          orderCount: 8,
          avgPrice: 120,
          category: 'Coffee',
        },
      ])
      .mockResolvedValueOnce(rows)
      .mockResolvedValueOnce([{ _id: 'POS', revenue: 2500, count: 25 }])
      .mockResolvedValueOnce([{ date: rows[rows.length - 1]?._id ? new Date(`${rows[rows.length - 1]._id}T00:00:00.000Z`) : new Date() }])
      .mockResolvedValueOnce([
        {
          weightedRevenue: 12000,
          quantity: 100,
        },
      ]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    forecastRunModel.create.mockImplementation(async (payload) => ({
      ...payload,
      toObject: () => payload,
    }));
    forecastRunModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    });
    crossSellCacheModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    });
    crossSellCacheModel.create.mockImplementation(async (payload) => payload);
    configService.get.mockImplementation((key: string) =>
      key === 'CURRENT_UNIT_COST_CAFE'
        ? '45'
        : key === 'CURRENT_UNIT_COST_SERVICES'
          ? '120'
          : undefined,
    );
    csvUploadModel.findOne.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(null),
    });
    csvUploadModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(0),
    });
    service = new AnalyticsService(
      transactionModel as any,
      forecastRunModel as any,
      crossSellCacheModel as any,
      csvUploadModel as any,
      configService as any,
      exogenousDataService as any,
    );
  });

  it('returns a successful Cafe Prophet forecast payload', async () => {
    mockForecastAggregates(21);
    jest.spyOn(service as any, 'runPython').mockResolvedValue({
      modelName: 'Prophet (weekly + yearly seasonality + PH holidays)',
      mase: 0.8,
      smape: 15,
      accuracy: 85,
      forecast: forecastRows(30),
      fittedValues: Array.from({ length: 21 }, (_, index) => 95 + index),
    });

    const result = await service.getForecast('cafe');

    expect(result).toEqual(
      expect.objectContaining({
        module: 'Cafe',
        modelName: 'Prophet (weekly + yearly seasonality + PH holidays)',
        mase: 0.8,
        smape: 15,
        accuracy: 85,
        isFallback: false,
        kpis: expect.any(Object),
        topItems: expect.any(Array),
        generatedAt: expect.any(Date),
      }),
    );
    expect(result.historical).toHaveLength(21);
    expect(result.forecast).toHaveLength(30);
    expect(result.historical[0].actual).toBe(10);
    expect(result.historical[0].revenue).toBe(1200);
    expect(result.historical[0].normalized).toBe(10);
    expect(result.forecast[0]).toEqual(
      expect.objectContaining({
        forecast: 150,
        forecastQuantity: 150,
        projectedNetSales: 18000,
        projectedConfidenceLow: 16800,
        projectedConfidenceHigh: 19200,
        projectedGrossProfit: 11250,
        unitPrice: 120,
        unitCost: 45,
      }),
    );
    expect(result.modelMetadata.targetVariable).toBe('quantity_volume');
    expect(result.modelMetadata.forecastRevenuePayloadVersion).toBe(6);
    expect(result.modelMetadata.annualDemandQuantity).toBeGreaterThan(0);
    expect(result.volumeForecast).toHaveLength(30);
    expect(result.revenueForecast).toHaveLength(30);
    expect(result.historical.slice(0, -1).every((point) => point.fitted === undefined)).toBe(true);
    expect(result.historical[20].fitted).toBe(result.historical[20].actual);
    expect(result.modelMetadata.predictionStartsAt).toBe(result.historical[20].date);
    expect(result.modelMetadata.predictionTrendMode).toBe('future-anchor');
    expect(result).toHaveProperty('module');
    expect(result).toHaveProperty('modelName');
    expect(result).toHaveProperty('mase');
    expect(result).toHaveProperty('smape');
    expect(result).toHaveProperty('accuracy');
    expect(result).toHaveProperty('historical');
    expect(result).toHaveProperty('forecast');
    expect((service as any).runPython).toHaveBeenCalledWith(
      'cafe_prophet.py',
      expect.objectContaining({ forecastDays: 30 }),
    );
  });

  it('falls back to SMA when selected Cafe model MASE is at or above 1.2', async () => {
    mockForecastAggregates(21);
    jest.spyOn(service as any, 'runPython').mockResolvedValue({
      modelName: 'Prophet (weekly + yearly seasonality + PH holidays)',
      mase: 1.5,
      smape: 25,
      accuracy: 75,
      forecast: forecastRows(30),
    });

    const result = await service.getForecast('cafe');

    expect(result.isFallback).toBe(true);
    expect(result.modelName).toBe('SMA (7-day fallback)');
    expect(result.rejectionReason).toContain('exceeded the 1.2 threshold');
    expect(result.forecast.map((point) => point.projectedNetSales).slice(0, 14)).toEqual([
      3240, 3240, 3240, 3240, 3240, 3240, 3240, 3240, 3240, 3240, 3240,
      3240, 3240, 3240,
    ]);
  });

  it('uses the most recent complete window for latest-holdout backtesting', async () => {
    const rows = dailyRows(180);
    mockForecastAggregates(180);
    const runPythonSpy = jest.spyOn(service as any, 'runPython').mockResolvedValue({
      modelName: 'Prophet (weekly + yearly seasonality + PH holidays)',
      mase: 0.8,
      smape: 15,
      accuracy: 85,
      forecast: forecastRowsFromActuals(rows, 166, 44),
    });

    const result = await service.getForecast('cafe', {
      forecastMode: 'latest-holdout',
      holdoutDays: '14',
    });

    expect(result.isFallback).toBe(false);
    expect(result.modelMetadata.forecastMode).toBe('latest-holdout');
    expect(result.modelMetadata.holdoutDays).toBe(14);
    expect(result.modelMetadata.backtestMetricSource).toBe('latest_complete_holdout');
    expect(result.modelMetadata.trainEndDate).toBe(rows[165]._id);
    expect(result.modelMetadata.testStartDate).toBe(rows[166]._id);
    expect(result.modelMetadata.testEndDate).toBe(rows[179]._id);
    expect(runPythonSpy).toHaveBeenCalledWith(
      'cafe_prophet.py',
      expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ date: rows[165]._id })]),
        forecastDays: 44,
        splitRatio: '80-10-10',
      }),
    );
    expect((runPythonSpy.mock.calls[0][1] as any).data).toHaveLength(166);
  });

  it('keeps the April-May thesis window available as fixed-window backtesting', async () => {
    const rows = dailyRows(160);
    mockForecastAggregates(160);
    const runPythonSpy = jest.spyOn(service as any, 'runPython').mockResolvedValue({
      modelName: 'Prophet (weekly + yearly seasonality + PH holidays)',
      mase: 0.8,
      smape: 15,
      accuracy: 85,
      forecast: forecastRowsFromActuals(rows, 90, 91),
    });

    const result = await service.getForecast('cafe', {
      forecastMode: 'fixed-window',
    });

    expect(result.isFallback).toBe(false);
    expect(result.modelMetadata.forecastMode).toBe('fixed-window');
    expect(result.modelMetadata.backtestMetricSource).toBe('fixed_window_overlap');
    expect(result.modelMetadata.trainEndDate).toBe('2026-03-31');
    expect(result.modelMetadata.testStartDate).toBe('2026-04-01');
    expect(result.modelMetadata.testEndDate).toBe('2026-05-31');
    expect(result.modelMetadata.testDays).toBe(61);
    expect(runPythonSpy).toHaveBeenCalledWith(
      'cafe_prophet.py',
      expect.objectContaining({
        forecastDays: 91,
        splitRatio: '80-10-10',
      }),
    );
    expect((runPythonSpy.mock.calls[0][1] as any).data).toHaveLength(90);
  });

  it('falls back to SMA when fewer than 21 daily observations exist', async () => {
    mockForecastAggregates(10);
    const runPythonSpy = jest.spyOn(service as any, 'runPython');

    const result = await service.getForecast('cafe');

    expect(runPythonSpy).not.toHaveBeenCalled();
    expect(result.isFallback).toBe(true);
    expect(result.rejectionReason).toContain('21 daily observations');
  });

  describe('home overview', () => {
    it('returns uploaded-data KPIs, POS-vs-marketplace channel balance, and dated heatmap rows', async () => {
      transactionModel.aggregate
        .mockResolvedValueOnce([
          { latestDate: new Date('2026-07-04T10:30:00.000Z') },
        ])
        .mockResolvedValueOnce([
          {
            totalRevenue: 5000,
            totalOrders: ['txn-1', 'txn-2', 'txn-3'],
            totalQuantity: 9,
            totalItems: 6,
          },
        ])
        .mockResolvedValueOnce([
          {
            totalRevenue: 2500,
            totalOrders: ['old-1', 'old-2'],
            totalQuantity: 4,
            totalItems: 3,
          },
        ])
        .mockResolvedValueOnce([
          { _id: 'Cafe', revenue: 1500, orderCount: 1 },
          { _id: 'Services', revenue: 1500, orderCount: 1 },
          { _id: 'Retail', revenue: 2000, orderCount: 1 },
        ])
        .mockResolvedValueOnce([
          { _id: 'POS', revenue: 4200, count: 5 },
          { _id: 'Shopee', revenue: 800, count: 1 },
        ])
        .mockResolvedValueOnce([
          {
            _id: { date: '2026-07-04', sector: 'Retail', channel: 'POS' },
            revenue: 2000,
          },
          {
            _id: { date: '2026-07-04', sector: 'Retail', channel: 'Shopee' },
            revenue: 800,
          },
        ])
        .mockResolvedValueOnce([
          { _id: 'POS', revenue: 4200, count: 5 },
          { _id: 'Shopee', revenue: 800, count: 1 },
        ])
        .mockResolvedValueOnce([
          {
            _id: {
              date: '2026-07-04',
              dayOfWeek: 7,
              hourBucket: 10,
              sector: 'Retail',
            },
            revenue: 2000,
          },
          {
            _id: {
              date: '2026-07-03',
              dayOfWeek: 6,
              hourBucket: 10,
              sector: 'Cafe',
            },
            revenue: 1000,
          },
        ])
        .mockResolvedValueOnce([
          {
            _id: {
              productName: 'Premium Treats',
              sector: 'Retail',
              category: 'Pet Supplies',
            },
            revenue: 2000,
            quantity: 3,
            orderCount: 1,
          },
        ]);

      const result = await service.getHomeOverview('week');

      expect(result.kpis).toEqual(
        expect.objectContaining({
          totalRevenue: 5000,
          totalOrders: 3,
          retailRevenue: 2000,
          pendingSuggestions: 3,
        }),
      );
      expect(result.channelBalance).toEqual([
        {
          category: 'Offline Channel (POS)',
          channel: 'POS',
          physical: 4200,
          online: 0,
          count: 5,
        },
        {
          category: 'Online Channel (Shopee)',
          channel: 'Shopee',
          physical: 0,
          online: 800,
          count: 1,
        },
      ]);
      expect(result.heatmapDays).toHaveLength(7);
      expect(result.heatmapDays[result.heatmapDays.length - 1]).toEqual(
        expect.objectContaining({ date: '2026-07-04' }),
      );
      expect(result.heatmap).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            date: '2026-07-04',
            dayLabel: 'Sat',
            hourBucket: 10,
            sector: 'Retail',
            intensity: 100,
          }),
          expect.objectContaining({
            date: '2026-07-03',
            dayLabel: 'Fri',
            hourBucket: 10,
            sector: 'Cafe',
            intensity: 50,
          }),
        ]),
      );
    });
  });
  describe('caching behavior', () => {
    it('returns cached forecast run if CSV state and overrides match', async () => {
      const cached = {
        module: 'Cafe',
        modelName: 'Prophet (weekly + yearly seasonality + PH holidays)',
        mase: 0.8,
        smape: 15,
        accuracy: 85,
        isFallback: false,
        historical: [
          { date: '2026-01-01', actual: 100, normalized: 100, orders: 1, revenue: 10000, fitted: 98 },
          { date: '2026-01-02', actual: 120, normalized: 120, orders: 2, revenue: 12000, fitted: 118 },
        ],
        forecast: [],
        kpis: {},
        topItems: [],
        itemHistory: [],
        modelMetadata: {
          csvUploadCount: 2,
          latestCsvUploadId: 'upload-id-1',
          latestCsvUploadTime: 123456789,
          forecastRevenuePayloadVersion: 6,
        },
        generatedAt: new Date(),
        toObject: function() { return this; }
      };

      forecastRunModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(cached),
      });

      csvUploadModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: 'upload-id-1',
          uploadedAt: new Date(123456789),
        }),
      });

      csvUploadModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });

      const result = await service.getForecast('cafe');
      expect(result.modelMetadata.csvUploadCount).toBe(2);
      expect(result.historical[0].fitted).toBeUndefined();
      expect(result.historical[1].fitted).toBe(120);
      expect(result.modelMetadata.predictionStartsAt).toBe('2026-01-02');
      expect(transactionModel.aggregate).toHaveBeenCalledTimes(1);
      expect(transactionModel.aggregate.mock.calls[0][0]).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ $sort: expect.any(Object) })]),
      );
      expect(result.itemHistory).toEqual([]);
    });

    it('rebuilds legacy cached revenue forecasts that lack the current payload version', async () => {
      const cached = {
        module: 'Cafe',
        modelName: 'Prophet (weekly + yearly seasonality + PH holidays)',
        mase: 0.8,
        smape: 15,
        accuracy: 85,
        isFallback: false,
        historical: [
          { date: '2026-01-01', actual: 100, normalized: 100, orders: 1, revenue: 10000 },
          { date: '2026-01-02', actual: 120, normalized: 120, orders: 2, revenue: 12000 },
        ],
        forecast: [{ date: '2026-01-03', forecast: 130, projectedNetSales: 13000 }],
        kpis: {},
        topItems: [],
        modelMetadata: {
          csvUploadCount: 2,
          latestCsvUploadId: 'upload-id-1',
          latestCsvUploadTime: 123456789,
          forecastRevenuePayloadVersion: 2,
        },
        generatedAt: new Date(),
        toObject: function() { return this; }
      };

      forecastRunModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(cached),
      });
      csvUploadModel.findOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: 'upload-id-1',
          uploadedAt: new Date(123456789),
        }),
      });
      csvUploadModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });
      mockForecastAggregates(21);
      const runPythonSpy = jest.spyOn(service as any, 'runPython').mockResolvedValue({
        modelName: 'Prophet (weekly + yearly seasonality + PH holidays)',
        mase: 0.8,
        smape: 15,
        accuracy: 85,
        forecast: forecastRows(30),
      });

      const result = await service.getForecast('cafe');

      expect(runPythonSpy).toHaveBeenCalled();
      expect(result.modelMetadata.forecastRevenuePayloadVersion).toBe(6);
      expect(result.volumeForecast).toHaveLength(30);
      expect(result.revenueForecast).toHaveLength(30);
    });
  });

  describe('cross-sell analysis', () => {
    const syntheticBaskets = () =>
      Array.from({ length: 10 }, (_, index) => ({
        _id: `txn-${index + 1}`,
        items:
          index % 2 === 0
            ? ['Latte', 'Dog Treats', 'Grooming']
            : ['Latte', 'Dog Treats'],
        sectors:
          index % 2 === 0 ? ['Cafe', 'Retail', 'Services'] : ['Cafe', 'Retail'],
        totalAmount: 200 + index,
      }));

    const mockPythonSpawn = (output: Record<string, unknown>) => {
      const processMock = new EventEmitter() as any;
      processMock.stdout = new EventEmitter();
      processMock.stderr = new EventEmitter();

      const stdin = new EventEmitter() as any;
      stdin.write = jest.fn().mockReturnValue(true);
      stdin.end = jest.fn(() => {
        setImmediate(() => {
          processMock.stdout.emit('data', JSON.stringify(output));
          processMock.emit('close', 0);
        });
      });
      processMock.stdin = stdin;

      (spawn as jest.Mock).mockReturnValue(processMock);
    };

    it('returns cross-sell metadata and reuses the 24-hour cache', async () => {
      let cachedCrossSell: any = null;
      const pythonOutput = {
        rules: [
          {
            itemA: 'Latte',
            itemB: 'Dog Treats',
            antecedents: ['Latte'],
            consequents: ['Dog Treats'],
            antecedentSectors: ['cafe'],
            consequentSectors: ['retail'],
            support: 0.8,
            confidence: 0.9,
            lift: 1.5,
            isMultiItem: false,
            crossSector: true,
          },
        ],
        bundleCandidates: [
          {
            anchorItem: 'Latte',
            bundleItem: 'Grooming',
            anchorVelocity: 'fast',
            bundleVelocity: 'slow',
            opportunityScore: 0.42,
            isLowAssociation: true,
          },
        ],
        totalBaskets: 10,
        multiItemBaskets: 10,
      };

      crossSellCacheModel.findOne.mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockImplementation(async () => cachedCrossSell),
      }));
      crossSellCacheModel.create.mockImplementation(async (payload) => {
        cachedCrossSell = payload;
        return payload;
      });
      transactionModel.aggregate
        .mockResolvedValueOnce(syntheticBaskets())
        .mockResolvedValueOnce([
          {
            totalLineItems: 25,
            totalRevenue: 2500,
            totalTransactions: 10,
            uniqueItemCount: 3,
          },
        ])
        .mockResolvedValueOnce([
          { _id: 13, transactions: 10 },
          { _id: 14, transactions: 4 },
        ])
        .mockResolvedValueOnce([
          { sector: 'Cafe', lineItems: 10, transactionCount: 10 },
          { sector: 'Retail', lineItems: 10, transactionCount: 10 },
          { sector: 'Services', lineItems: 5, transactionCount: 5 },
        ]);
      mockPythonSpawn(pythonOutput);

      const first = await service.getCrossSell();
      const second = await service.getCrossSell();

      expect(first.rules).toEqual(expect.any(Array));
      expect(first.bundleCandidates).toEqual(expect.any(Array));
      expect(first).toEqual(
        expect.objectContaining({
          crossSectorBaskets: expect.any(Number),
          crossSectorRate: expect.any(Number),
        }),
      );
      expect(second.cached).toBe(true);
      expect(spawn).toHaveBeenCalledTimes(1);
      expect(transactionModel.aggregate).toHaveBeenCalledTimes(4);
    });
  });
});

