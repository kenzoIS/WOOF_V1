import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  HolidayCache,
  HolidayCacheDocument,
} from './schemas/holiday-cache.schema';
import {
  WeatherCache,
  WeatherCacheDocument,
} from './schemas/weather-cache.schema';

export interface WeatherRecord {
  date: string;
  tempCelsius: number;
  rainfallMm: number;
  isSynthetic: boolean;
}

export interface HolidayRecord {
  date: string;
  name: string;
  isNational: boolean;
}

export interface ExogenousRow {
  date: string;
  tempCelsius: number;
  rainFlag: number;
  isHoliday: number;
  dayBeforeHoliday: number;
  dayAfterHoliday: number;
}

export interface ExogenousCacheStatus {
  weatherCache: {
    count: number;
    latestFetchedAt: Date | null;
    lastSource: 'api' | 'cache' | 'synthetic' | 'unknown';
  };
  holidayCache: {
    count: number;
    latestFetchedAt: Date | null;
    lastSource: 'api' | 'cache' | 'hardcoded' | 'unknown';
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TEMP_CELSIUS = 28;
const DEFAULT_LUCENA_LAT = 13.9397;
const DEFAULT_LUCENA_LNG = 121.6145;

@Injectable()
export class ExogenousDataService {
  private readonly logger = new Logger(ExogenousDataService.name);
  private lastWeatherSource: 'api' | 'cache' | 'synthetic' | 'unknown' =
    'unknown';
  private lastHolidaySource: 'api' | 'cache' | 'hardcoded' | 'unknown' =
    'unknown';

  constructor(
    @InjectModel(WeatherCache.name)
    private readonly weatherCacheModel: Model<WeatherCacheDocument>,
    @InjectModel(HolidayCache.name)
    private readonly holidayCacheModel: Model<HolidayCacheDocument>,
    private readonly configService: ConfigService,
  ) {}

  getDefaultCoordinates(): { lat: number; lng: number } {
    return {
      lat: Number(
        this.configService.get<string>('LUCENA_LAT') || DEFAULT_LUCENA_LAT,
      ),
      lng: Number(
        this.configService.get<string>('LUCENA_LNG') || DEFAULT_LUCENA_LNG,
      ),
    };
  }

  getLastWeatherSource(): 'api' | 'cache' | 'synthetic' | 'unknown' {
    return this.lastWeatherSource;
  }

  getLastHolidaySource(): 'api' | 'cache' | 'hardcoded' | 'unknown' {
    return this.lastHolidaySource;
  }

  async fetchWeatherHistory(
    lat: number,
    lng: number,
    startDate: string,
    endDate: string,
  ): Promise<WeatherRecord[]> {
    const dates = enumerateDates(startDate, endDate);
    if (dates.length === 0) return [];

    const cachedRows = await this.weatherCacheModel
      .find({ date: { $in: dates }, lat, lng })
      .lean();
    const cachedByDate = new Map(
      cachedRows.map((row: any) => [row.date, this.toWeatherRecord(row)]),
    );
    const results = new Map<string, WeatherRecord>();
    for (const [date, record] of cachedByDate) {
      results.set(date, record);
    }

    const apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');
    let apiFetchCount = 0;
    let syntheticCount = 0;

    for (const date of dates) {
      if (results.has(date)) continue;

      let record: WeatherRecord | null = null;
      if (apiKey) {
        record = await this.fetchOpenWeatherDay(apiKey, lat, lng, date);
      }

      if (record) {
        apiFetchCount += 1;
      } else {
        syntheticCount += 1;
        record = {
          date,
          tempCelsius: DEFAULT_TEMP_CELSIUS,
          rainfallMm: 0,
          isSynthetic: true,
        };
      }

      results.set(date, record);
      await this.upsertWeatherRecord(lat, lng, record);
    }

    this.lastWeatherSource =
      syntheticCount > 0 ? 'synthetic' : apiFetchCount > 0 ? 'api' : 'cache';

    return dates.map(
      (date) =>
        results.get(date) || {
          date,
          tempCelsius: DEFAULT_TEMP_CELSIUS,
          rainfallMm: 0,
          isSynthetic: true,
        },
    );
  }

  async fetchHolidayHistory(year: number): Promise<HolidayRecord[]> {
    const cached = await this.holidayCacheModel
      .findOne({ year, country: 'PH' })
      .lean();
    if (cached?.holidays?.length) {
      this.lastHolidaySource = 'cache';
      return cached.holidays.map((holiday: any) => ({
        date: holiday.date,
        name: holiday.name,
        isNational: Boolean(holiday.isNational),
      }));
    }

    const apiKey = this.configService.get<string>('ABSTRACT_HOLIDAYS_KEY');
    if (apiKey) {
      try {
        const response = await fetch(
          `https://holidays.abstractapi.com/v1/?api_key=${encodeURIComponent(
            apiKey,
          )}&country=PH&year=${year}`,
        );
        if (response.ok) {
          const body = (await response.json()) as any[];
          const holidays = body.map((item) => ({
            date: String(item.date),
            name: String(item.name || item.localName || 'Philippine Holiday'),
            isNational:
              String(item.location || item.type || '')
                .toLowerCase()
                .includes('national') || true,
          }));
          await this.upsertHolidayRecord(year, holidays);
          this.lastHolidaySource = 'api';
          return holidays;
        }
      } catch (error) {
        this.logger.warn(
          `Abstract holiday fetch failed for ${year}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const hardcoded = buildPhilippineNationalHolidays(year);
    await this.upsertHolidayRecord(year, hardcoded);
    this.lastHolidaySource = 'hardcoded';
    return hardcoded;
  }

  buildExogenousMatrix(
    dates: string[],
    weatherRecords: WeatherRecord[],
    holidayRecords: HolidayRecord[],
  ): ExogenousRow[] {
    const weatherByDate = new Map(
      weatherRecords.map((record) => [record.date, record]),
    );
    const holidayDates = new Set(holidayRecords.map((holiday) => holiday.date));

    return dates.map((date) => {
      const weather = weatherByDate.get(date);
      return {
        date,
        tempCelsius: round(weather?.tempCelsius ?? DEFAULT_TEMP_CELSIUS),
        rainFlag: (weather?.rainfallMm ?? 0) > 0.5 ? 1 : 0,
        isHoliday: holidayDates.has(date) ? 1 : 0,
        dayBeforeHoliday: holidayDates.has(addDays(date, 1)) ? 1 : 0,
        dayAfterHoliday: holidayDates.has(addDays(date, -1)) ? 1 : 0,
      };
    });
  }

  async getCacheStatus(): Promise<ExogenousCacheStatus> {
    const [weatherCount, latestWeather, holidayCount, latestHoliday] =
      await Promise.all([
        this.weatherCacheModel.countDocuments(),
        this.weatherCacheModel.findOne().sort({ fetchedAt: -1 }).lean(),
        this.holidayCacheModel.countDocuments(),
        this.holidayCacheModel.findOne().sort({ fetchedAt: -1 }).lean(),
      ]);

    return {
      weatherCache: {
        count: weatherCount,
        latestFetchedAt: (latestWeather as any)?.fetchedAt || null,
        lastSource: this.lastWeatherSource,
      },
      holidayCache: {
        count: holidayCount,
        latestFetchedAt: (latestHoliday as any)?.fetchedAt || null,
        lastSource: this.lastHolidaySource,
      },
    };
  }

  private async fetchOpenWeatherDay(
    apiKey: string,
    lat: number,
    lng: number,
    date: string,
  ): Promise<WeatherRecord | null> {
    try {
      const unixNoon = Math.floor(
        new Date(`${date}T12:00:00.000Z`).getTime() / 1000,
      );
      const response = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lng}&dt=${unixNoon}&appid=${encodeURIComponent(
          apiKey,
        )}&units=metric`,
      );
      if (!response.ok) return null;
      const body = (await response.json()) as any;
      const observation = Array.isArray(body.data) ? body.data[0] : body;
      if (!observation) return null;

      return {
        date,
        tempCelsius: round(Number(observation.temp ?? DEFAULT_TEMP_CELSIUS)),
        rainfallMm: round(Number(observation.rain?.['1h'] ?? 0)),
        isSynthetic: false,
      };
    } catch (error) {
      this.logger.warn(
        `OpenWeather fetch failed for ${date}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private toWeatherRecord(row: any): WeatherRecord {
    return {
      date: row.date,
      tempCelsius: Number(row.tempCelsius),
      rainfallMm: Number(row.rainfallMm),
      isSynthetic: Boolean(row.isSynthetic),
    };
  }

  private async upsertWeatherRecord(
    lat: number,
    lng: number,
    record: WeatherRecord,
  ): Promise<void> {
    await this.weatherCacheModel.updateOne(
      { date: record.date, lat, lng },
      {
        $set: {
          ...record,
          lat,
          lng,
          fetchedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  private async upsertHolidayRecord(
    year: number,
    holidays: HolidayRecord[],
  ): Promise<void> {
    await this.holidayCacheModel.updateOne(
      { year, country: 'PH' },
      {
        $set: {
          year,
          country: 'PH',
          holidays,
          fetchedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
}

function enumerateDates(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    return [];
  }

  const dates: string[] = [];
  for (let timestamp = start; timestamp <= end; timestamp += DAY_MS) {
    dates.push(new Date(timestamp).toISOString().slice(0, 10));
  }
  return dates;
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function buildPhilippineNationalHolidays(year: number): HolidayRecord[] {
  const holyWeek = calculateHolyWeek(year);
  return [
    { date: `${year}-01-01`, name: "New Year's Day", isNational: true },
    { date: holyWeek.maundyThursday, name: 'Maundy Thursday', isNational: true },
    { date: holyWeek.goodFriday, name: 'Good Friday', isNational: true },
    { date: `${year}-05-01`, name: 'Labor Day', isNational: true },
    { date: `${year}-06-12`, name: 'Independence Day', isNational: true },
    {
      date: getLastMondayOfAugust(year),
      name: 'National Heroes Day',
      isNational: true,
    },
    { date: `${year}-11-30`, name: 'Bonifacio Day', isNational: true },
    { date: `${year}-12-25`, name: 'Christmas Day', isNational: true },
    { date: `${year}-12-30`, name: 'Rizal Day', isNational: true },
  ];
}

function calculateHolyWeek(year: number): {
  maundyThursday: string;
  goodFriday: string;
} {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(Date.UTC(year, month - 1, day));
  const maundyThursday = new Date(easter);
  maundyThursday.setUTCDate(easter.getUTCDate() - 3);
  const goodFriday = new Date(easter);
  goodFriday.setUTCDate(easter.getUTCDate() - 2);
  return {
    maundyThursday: maundyThursday.toISOString().slice(0, 10),
    goodFriday: goodFriday.toISOString().slice(0, 10),
  };
}

function getLastMondayOfAugust(year: number): string {
  const date = new Date(Date.UTC(year, 7, 31));
  while (date.getUTCDay() !== 1) {
    date.setUTCDate(date.getUTCDate() - 1);
  }
  return date.toISOString().slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
