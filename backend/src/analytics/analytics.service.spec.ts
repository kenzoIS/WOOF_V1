import { AnalyticsService } from './analytics.service';

describe('AnalyticsService getForecast', () => {
  const transactionModel = {
    aggregate: jest.fn(),
  };
  const forecastRunModel = {
    create: jest.fn(),
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
        revenue: 100 + index,
        orderCount: 2 + index,
        quantity: 3 + index,
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
      .mockResolvedValueOnce([{ _id: 'POS', revenue: 2500, count: 25 }]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    forecastRunModel.create.mockImplementation(async (payload) => ({
      ...payload,
      toObject: () => payload,
    }));
    service = new AnalyticsService(
      transactionModel as any,
      forecastRunModel as any,
      configService as any,
      exogenousDataService as any,
    );
  });

  it('returns a successful Cafe Prophet forecast payload', async () => {
    mockForecastAggregates(21);
    jest.spyOn(service as any, 'runPython').mockResolvedValue({
      modelName: 'Prophet (weekly seasonality + PH holidays)',
      mase: 0.8,
      mape: 15,
      accuracy: 85,
      forecast: forecastRows(14),
    });

    const result = await service.getForecast('cafe');

    expect(result).toEqual(
      expect.objectContaining({
        module: 'Cafe',
        modelName: 'Prophet (weekly seasonality + PH holidays)',
        mase: 0.8,
        mape: 15,
        accuracy: 85,
        isFallback: false,
        kpis: expect.any(Object),
        topItems: expect.any(Array),
        generatedAt: expect.any(Date),
      }),
    );
    expect(result.historical).toHaveLength(21);
    expect(result.forecast).toHaveLength(14);
    expect(result).toHaveProperty('module');
    expect(result).toHaveProperty('modelName');
    expect(result).toHaveProperty('mase');
    expect(result).toHaveProperty('mape');
    expect(result).toHaveProperty('accuracy');
    expect(result).toHaveProperty('historical');
    expect(result).toHaveProperty('forecast');
  });

  it('falls back to SMA when the selected model MASE exceeds 1.2', async () => {
    mockForecastAggregates(21);
    jest.spyOn(service as any, 'runPython').mockResolvedValue({
      modelName: 'Prophet (weekly seasonality + PH holidays)',
      mase: 1.5,
      mape: 25,
      accuracy: 75,
      forecast: forecastRows(14),
    });

    const result = await service.getForecast('cafe');

    expect(result.isFallback).toBe(true);
    expect(result.modelName).toContain('SMA');
    expect(result.rejectionReason).toContain('exceeded 1.2');
  });

  it('falls back to SMA when fewer than 21 daily observations exist', async () => {
    mockForecastAggregates(10);
    const runPythonSpy = jest.spyOn(service as any, 'runPython');

    const result = await service.getForecast('cafe');

    expect(runPythonSpy).not.toHaveBeenCalled();
    expect(result.isFallback).toBe(true);
    expect(result.rejectionReason).toContain('21 daily observations');
  });
});
