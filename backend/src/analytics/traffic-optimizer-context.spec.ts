import { AnalyticsService } from './analytics.service';

describe('Traffic Optimizer Context-Aware & Date-Aware Engine', () => {
  let service: AnalyticsService;
  let mockExogenousDataService: any;
  let mockTransactionModel: any;

  beforeEach(() => {
    mockExogenousDataService = {
      getDefaultCoordinates: jest.fn().mockReturnValue({ lat: 13.9397, lng: 121.6145 }),
      fetchWeatherHistory: jest.fn().mockResolvedValue([
        {
          date: '2026-10-02',
          tempCelsius: 28,
          rainfallMm: 0,
          relativeHumidity: 60,
          isSynthetic: false,
        },
      ]),
      fetchHolidayHistory: jest.fn().mockResolvedValue([
        { date: '2026-06-12', name: 'Independence Day', isNational: true },
        { date: '2026-12-25', name: 'Christmas Day', isNational: true },
      ]),
      buildWeatherTransformFields: jest.fn().mockReturnValue({
        isHotDay: 0,
        isCoolRainyDay: 0,
        comfortIndex: 27.5,
      }),
      getLastWeatherSource: jest.fn().mockReturnValue('api'),
    };

    mockTransactionModel = {
      aggregate: jest.fn().mockReturnValue({
        allowDiskUse: jest.fn().mockResolvedValue([]),
      }),
    };

    service = new AnalyticsService(
      mockTransactionModel as any,
      { client: { from: jest.fn() } } as any,
      { get: jest.fn() } as any,
      mockExogenousDataService as any,
      {} as any,
    );
  });

  // 1. Normal weekday
  it('Scenario 1: Evaluates a normal weekday (Wednesday) with standard baseline', async () => {
    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-07', // Wednesday
      targetHour: 14,
    });

    expect(result.dayOfWeek).toBe('Wednesday');
    expect(result.isWeekend).toBe(false);
    expect(result.isHoliday).toBe(false);
    expect(result.targetHour).toBe(14);
    const dowFactor = result.factors.find((f: any) => f.name.includes('Day of Week'));
    expect(dowFactor.impactPercent).toBe(-23);
    expect(dowFactor.description).toContain('baseline recovery');
    expect(dowFactor.source).toBe('historically_estimated');
  });

  // 2. Friday (Empirically Estimated Leisure Lift)
  it('Scenario 2: Evaluates Friday with empirical regression leisure demand surge (+13%)', async () => {
    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-02', // Friday
      targetHour: 14,
    });

    expect(result.dayOfWeek).toBe('Friday');
    expect(result.isWeekend).toBe(false);
    const dowFactor = result.factors.find((f: any) => f.name.includes('Day of Week'));
    expect(dowFactor.impactPercent).toBe(13);
    expect(dowFactor.direction).toBe('positive');
    expect(dowFactor.source).toBe('historically_estimated');
  });

  // 3. Saturday (Empirically Estimated Weekend Surge)
  it('Scenario 3: Evaluates Saturday with empirical weekend family visit surge (+69%)', async () => {
    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-03', // Saturday
      targetHour: 14,
    });

    expect(result.dayOfWeek).toBe('Saturday');
    expect(result.isWeekend).toBe(true);
    const dowFactor = result.factors.find((f: any) => f.name.includes('Day of Week'));
    expect(dowFactor.impactPercent).toBe(69);
    expect(dowFactor.direction).toBe('positive');
    expect(dowFactor.source).toBe('historically_estimated');
  });

  // 4. Sunday (Empirically Estimated Weekend Surge)
  it('Scenario 4: Evaluates Sunday with empirical weekend family visit surge (+74%)', async () => {
    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-04', // Sunday
      targetHour: 11,
    });

    expect(result.dayOfWeek).toBe('Sunday');
    expect(result.isWeekend).toBe(true);
    const dowFactor = result.factors.find((f: any) => f.name.includes('Day of Week'));
    expect(dowFactor.impactPercent).toBe(74);
    expect(dowFactor.source).toBe('historically_estimated');
  });

  // 5. Regular Holiday (Independence Day - Historically Estimated Lull)
  it('Scenario 5: Detects Philippine Regular Holiday and applies empirical observance shift (-5%)', async () => {
    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-06-12', // Independence Day
      targetHour: 14,
    });

    expect(result.isHoliday).toBe(true);
    expect(result.holidayName).toBe('Independence Day');
    expect(result.holidayType).toContain('Regular Holiday');
    const holFactor = result.factors.find((f: any) => f.name.includes('Holiday Status'));
    expect(holFactor.impactPercent).toBe(-5);
    expect(holFactor.direction).toBe('negative');
    expect(holFactor.source).toBe('historically_estimated');
  });

  // 6. Special Non-Working Holiday / Local (Araw ng Quezon - Business Rule Promo)
  it('Scenario 6: Recognizes local Quezon Day / special holiday promo (+25% business_rule)', async () => {
    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-08-19', // Quezon Day
      targetHour: 14,
    });

    expect(result.isHoliday).toBe(true);
    expect(result.holidayName).toContain('Araw ng Quezon');
    expect(result.holidayType).toContain('Special Holiday');
    const holFactor = result.factors.find((f: any) => f.name.includes('Holiday Status'));
    expect(holFactor.impactPercent).toBe(25);
    expect(holFactor.direction).toBe('positive');
    expect(holFactor.source).toBe('business_rule');
  });

  // 7. Rainy Day (Suppression)
  it('Scenario 7: Rainy weather suppresses spontaneous walk-in foot traffic', async () => {
    mockExogenousDataService.fetchWeatherHistory.mockResolvedValueOnce([
      {
        date: '2026-10-02',
        tempCelsius: 26,
        rainfallMm: 4.5,
        relativeHumidity: 88,
        isSynthetic: false,
      },
    ]);

    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-02',
      targetHour: 14,
    });

    expect(result.weather.rainfallMm).toBe(4.5);
    expect(result.weather.condition).toBe('Rainy / Showers');
    const weatherFactor = result.factors.find((f: any) => f.name.includes('Weather'));
    expect(weatherFactor.impactPercent).toBe(-7); // -7% empirical suppression
    expect(weatherFactor.direction).toBe('negative');
    expect(weatherFactor.source).toBe('historically_estimated');
  });

  // 8. Normal / Pleasant Weather
  it('Scenario 8: Pleasant, mild outdoor weather gives a modest footfall lift (+5% empirical)', async () => {
    mockExogenousDataService.fetchWeatherHistory.mockResolvedValueOnce([
      {
        date: '2026-10-02',
        tempCelsius: 26,
        rainfallMm: 0,
        relativeHumidity: 65,
        isSynthetic: false,
      },
    ]);

    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-02',
      targetHour: 14,
    });

    expect(result.weather.tempCelsius).toBe(26);
    const weatherFactor = result.factors.find((f: any) => f.name.includes('Weather'));
    expect(weatherFactor.impactPercent).toBe(5);
    expect(weatherFactor.direction).toBe('positive');
    expect(weatherFactor.source).toBe('historically_estimated');
  });

  // 9. Weather API Unavailable (Fallback)
  it('Scenario 9: Gracefully falls back when Weather API fails or times out', async () => {
    mockExogenousDataService.fetchWeatherHistory.mockRejectedValueOnce(new Error('Open-Meteo connection timeout'));

    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-02',
      targetHour: 14,
    });

    expect(result).toBeDefined();
    expect(result.weather.source).toBe('unavailable');
    expect(result.weather.tempCelsius).toBe(28);
    expect(result.weather.rainfallMm).toBe(0);
  });

  // 10. Holiday API Unavailable (Fallback)
  it('Scenario 10: Gracefully handles Holiday service failure without crashing', async () => {
    mockExogenousDataService.fetchHolidayHistory.mockRejectedValueOnce(new Error('Abstract API error'));

    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-02',
      targetHour: 14,
    });

    expect(result).toBeDefined();
    expect(result.isHoliday).toBe(false);
  });

  // 11. Combined Holiday + Weekend
  it('Scenario 11: Compound surge when a holiday falls on a weekend', async () => {
    mockExogenousDataService.fetchHolidayHistory.mockResolvedValueOnce([
      { date: '2026-10-03', name: 'Special Pet Fiesta', isNational: false },
    ]);

    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-03', // Saturday
      targetHour: 14,
    });

    expect(result.isWeekend).toBe(true);
    expect(result.isHoliday).toBe(true);
    expect(result.predictedTraffic).toBeGreaterThanOrEqual(result.historicalBaseline);
  });

  // 12. Historical Data Unavailable (SME Default Profile)
  it('Scenario 12: Generates valid prescriptive plan even when historical database is empty', async () => {
    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-02',
      targetHour: 14,
    });

    expect(result.historicalBaseline).toBeGreaterThan(0);
    expect(result.predictedTraffic).toBeGreaterThan(0);
    expect(result.sectorBreakdown.length).toBe(3);
    expect(result.hourlyForecast.length).toBe(13); // 07:00 to 19:00
  });

  // 13. Current Date Timezone Boundary (Asia/Manila)
  it('Scenario 13: Correctly anchors current date in Asia/Manila without UTC shift', async () => {
    const result = await service.buildTodayContextAwareTrafficPlan();
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.modelDiagnostics.timezone).toBe('Asia/Manila');
  });

  // 14. Missing Exogenous Variables (Robust Defaulting)
  it('Scenario 14: Accurately defaults when exogenous records contain undefined values', async () => {
    mockExogenousDataService.fetchWeatherHistory.mockResolvedValueOnce([
      {
        date: '2026-10-02',
        tempCelsius: null,
        rainfallMm: null,
        relativeHumidity: null,
        isSynthetic: true,
      },
    ]);

    const result = await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-02',
      targetHour: 14,
    });

    expect(result.weather.tempCelsius).toBe(28);
    expect(result.weather.rainfallMm).toBe(0);
    expect(result.weather.relativeHumidity).toBe(60);
  });

  // 15. Current-Day Prediction Without Future Data Leakage
  it('Scenario 15: Prevents future data leakage by strictly partitioning historical query t < todayStart', async () => {
    await service.buildTodayContextAwareTrafficPlan({
      referenceDate: '2026-10-02',
      targetHour: 10,
    });

    const aggregateCalls = mockTransactionModel.aggregate.mock.calls;
    expect(aggregateCalls.length).toBeGreaterThan(0);
    const matchStage = aggregateCalls[0][0][0].$match;
    expect(matchStage.date.$lt).toBeDefined();
    expect(matchStage.date.$lt.toISOString()).toContain('2026-10-01T16:00:00.000Z'); // 2026-10-02T00:00:00+08:00
  });
});
