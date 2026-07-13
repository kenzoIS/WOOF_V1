import { ExogenousDataService } from './exogenous-data.service';

describe('ExogenousDataService', () => {
  const weatherCacheModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    updateOne: jest.fn(),
  };
  const holidayCacheModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    updateOne: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
  };

  let service: ExogenousDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    weatherCacheModel.updateOne.mockResolvedValue({});
    holidayCacheModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    holidayCacheModel.updateOne.mockResolvedValue({});
    configService.get.mockReturnValue(undefined);
    service = new ExogenousDataService(
      weatherCacheModel as any,
      holidayCacheModel as any,
      configService as any,
    );
  });

  it('marks holiday, day-before-holiday, and day-after-holiday flags', () => {
    const result = service.buildExogenousMatrix(
      ['2026-12-24', '2026-12-25', '2026-12-26'],
      [
        {
          date: '2026-12-24',
          tempCelsius: 29,
          rainfallMm: 0,
          isSynthetic: false,
        },
        {
          date: '2026-12-25',
          tempCelsius: 30,
          rainfallMm: 0,
          isSynthetic: false,
        },
        {
          date: '2026-12-26',
          tempCelsius: 31,
          rainfallMm: 0,
          isSynthetic: false,
        },
      ],
      [{ date: '2026-12-25', name: 'Christmas Day', isNational: true }],
    );

    expect(result[0]).toEqual(
      expect.objectContaining({
        isHoliday: 0,
        dayBeforeHoliday: 1,
        dayAfterHoliday: 0,
      }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        isHoliday: 1,
        dayBeforeHoliday: 0,
        dayAfterHoliday: 0,
      }),
    );
    expect(result[2]).toEqual(
      expect.objectContaining({
        isHoliday: 0,
        dayBeforeHoliday: 0,
        dayAfterHoliday: 1,
      }),
    );
  });

  it('uses fallback weather values when weather is missing', () => {
    const result = service.buildExogenousMatrix(
      ['2026-01-01', '2026-01-02'],
      [
        {
          date: '2026-01-01',
          tempCelsius: 31,
          rainfallMm: 1,
          isSynthetic: false,
        },
      ],
      [],
    );

    expect(result[0]).toEqual(
      expect.objectContaining({ tempCelsius: 31, rainFlag: 1 }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({ tempCelsius: 28, rainFlag: 0 }),
    );
  });

  it('falls back to hardcoded Philippine holidays when no API key is configured', async () => {
    const holidays = await service.fetchHolidayHistory(2026);

    expect(holidays.length).toBeGreaterThanOrEqual(8);
    expect(holidays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: '2026-12-25',
          name: 'Christmas Day',
          isNational: true,
        }),
      ]),
    );
    expect(holidayCacheModel.updateOne).toHaveBeenCalledWith(
      { date: '2026-12-25', location: 'PH' },
      expect.any(Object),
      { upsert: true },
    );
  });
});
