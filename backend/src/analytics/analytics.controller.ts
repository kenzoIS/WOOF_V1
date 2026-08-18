import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

const ANALYTICS_CACHE_TTL_MS = 10 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

@Controller('analytics')
export class AnalyticsController {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly analyticsService: AnalyticsService) {}

  private cached<T>(
    key: string,
    loader: () => Promise<T>,
    options?: { forceRefresh?: string },
  ): Promise<T> {
    if (options?.forceRefresh === 'true') {
      this.cache.delete(key);
      return loader();
    }

    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(cached.value as T);
    }

    const active = this.inFlight.get(key);
    if (active) {
      return active as Promise<T>;
    }

    const promise = loader()
      .then((value) => {
        this.cache.set(key, {
          value,
          expiresAt: Date.now() + ANALYTICS_CACHE_TTL_MS,
        });
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  private key(name: string, params?: Record<string, unknown>) {
    const query = Object.entries(params || {})
      .filter(([, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b));
    return `${name}:${JSON.stringify(query)}`;
  }

  @Get('home')
  async getHomeOverview(@Query('range') range?: string) {
    return this.cached(this.key('home', { range }), () =>
      this.analyticsService.getHomeOverview(range),
    );
  }

  @Get('dashboard/:sector')
  async getDashboard(@Param('sector') sector: string) {
    return this.cached(this.key('dashboard', { sector }), () =>
      this.analyticsService.getDashboard(sector),
    );
  }

  @Get('data-range')
  async getDataRange() {
    return this.analyticsService.getDataRange();
  }

  @Get('channel-status')
  async getChannelStatus() {
    return this.analyticsService.getChannelStatus();
  }

  @Get('forecast/:sector')
  async getForecast(
    @Param('sector') sector: string,
    @Query('temp') temp?: string,
    @Query('rain') rain?: string,
    @Query('holiday') holiday?: string,
    @Query('isPayday') isPayday?: string,
    @Query('promoActive') promoActive?: string,
    @Query('days') days?: string,
    @Query('compact') compact?: string,
    @Query('forceRefresh') forceRefresh?: string,
    @Query('forecastMode') forecastMode?: string,
    @Query('holdoutDays') holdoutDays?: string,
    @Query('trainEndDate') trainEndDate?: string,
    @Query('testStartDate') testStartDate?: string,
    @Query('testEndDate') testEndDate?: string,
    @Query('backtestSplit') backtestSplit?: string,
  ) {
    const params = {
      temp,
      rain,
      holiday,
      isPayday,
      promoActive,
      days,
      compact,
      forceRefresh,
      forecastMode,
      holdoutDays,
      trainEndDate,
      testStartDate,
      testEndDate,
      backtestSplit,
    };
    return this.cached(
      this.key('forecast', { sector, ...params }),
      () => this.analyticsService.getForecast(sector, params),
      { forceRefresh },
    );
  }

  @Get('forecast-by-channel/retail')
  async getRetailForecastByChannel() {
    return this.cached(this.key('forecast-by-channel-retail'), () =>
      this.analyticsService.getRetailForecastByChannel(),
    );
  }

  @Get('exogenous/status')
  async getExogenousStatus() {
    return this.analyticsService.getExogenousStatus();
  }

  @Get('weather/current')
  async getCurrentWeather() {
    return this.analyticsService.getCurrentWeather();
  }

  @Get('cross-sell')
  async getCrossSell(
    @Query('minSupport') minSupport?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('minLift') minLift?: string,
    @Query('maxBundleCandidates') maxBundleCandidates?: string,
    @Query('hour') hour?: string,
    @Query('sector') sector?: string,
    @Query('forceRefresh') forceRefresh?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
  ) {
    const params = {
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
      sector,
      forceRefresh,
      dateStart,
      dateEnd,
    };
    return this.cached(
      this.key('cross-sell', params),
      () => this.analyticsService.getCrossSell(params),
      { forceRefresh },
    );
  }

  @Post('cross-sell/campaign-drafts')
  async createCrossSellCampaignDraft(@Body() dto: any) {
    return this.analyticsService.createCrossSellCampaignDraft(dto);
  }

  @Get('pricing-catalog')
  async getPricingCatalog(
    @Query('sector') sector?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
  ) {
    const params = {
      sector,
      dateStart,
      dateEnd,
    };
    return this.cached(this.key('pricing-catalog', params), () =>
      this.analyticsService.getPricingCatalog(params),
    );
  }

  @Get('traffic-optimizer')
  async getTrafficOptimizer(
    @Query('hour') hour?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
  ) {
    const params = {
      hour,
      dateStart,
      dateEnd,
    };
    return this.cached(this.key('traffic-optimizer', params), () =>
      this.analyticsService.getTrafficOptimizer(params),
    );
  }

  @Get('cross-sell/config')
  async getCrossSellConfig(
    @Query('minSupport') minSupport?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('minLift') minLift?: string,
    @Query('maxBundleCandidates') maxBundleCandidates?: string,
    @Query('hour') hour?: string,
    @Query('sector') sector?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
  ) {
    const params = {
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
      sector,
      dateStart,
      dateEnd,
    };
    return this.cached(this.key('cross-sell-config', params), () =>
      this.analyticsService.getCrossSellConfig(params),
    );
  }

  @Get('cross-sell/by-sector')
  async getCrossSellBySector(
    @Query('minSupport') minSupport?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('minLift') minLift?: string,
    @Query('maxBundleCandidates') maxBundleCandidates?: string,
    @Query('hour') hour?: string,
    @Query('sector') sector?: string,
    @Query('forceRefresh') forceRefresh?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
  ) {
    const params = {
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
      sector,
      forceRefresh,
      dateStart,
      dateEnd,
    };
    return this.cached(
      this.key('cross-sell-by-sector', params),
      () => this.analyticsService.getCrossSellBySector(params),
      { forceRefresh },
    );
  }

  @Get('cross-sell/bundles')
  async getCrossSellBundles(
    @Query('minSupport') minSupport?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('minLift') minLift?: string,
    @Query('maxBundleCandidates') maxBundleCandidates?: string,
    @Query('hour') hour?: string,
    @Query('sector') sector?: string,
    @Query('forceRefresh') forceRefresh?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
  ) {
    const params = {
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
      sector,
      forceRefresh,
      dateStart,
      dateEnd,
    };
    return this.cached(
      this.key('cross-sell-bundles', params),
      () => this.analyticsService.getCrossSellBundles(params),
      { forceRefresh },
    );
  }

  @Get('promos/quiet-periods')
  async getNextQuietPeriod() {
    return this.cached(this.key('promos-quiet-periods'), () =>
      this.analyticsService.getNextQuietPeriod(),
    );
  }

  @Get('promos/history')
  async getPastHappyHours() {
    return this.analyticsService.getPastHappyHours();
  }

  @Post('promos/draft')
  async activateHappyHour(@Body() body: { discountPercent: number, targetDate: string, targetHour: number, probabilityScore: number }) {
    return this.analyticsService.activateHappyHour(body.discountPercent, body.targetDate, body.targetHour, body.probabilityScore);
  }
}
