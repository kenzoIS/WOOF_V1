import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('home')
  async getHomeOverview(@Query('range') range?: string) {
    return this.analyticsService.getHomeOverview(range);
  }

  @Get('dashboard/:sector')
  async getDashboard(@Param('sector') sector: string) {
    return this.analyticsService.getDashboard(sector);
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
    return this.analyticsService.getForecast(sector, {
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
    });
  }

  @Get('forecast-by-channel/retail')
  async getRetailForecastByChannel() {
    return this.analyticsService.getRetailForecastByChannel();
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
    return this.analyticsService.getCrossSell({
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
      sector,
      forceRefresh,
      dateStart,
      dateEnd,
    });
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
    return this.analyticsService.getPricingCatalog({
      sector,
      dateStart,
      dateEnd,
    });
  }

  @Get('traffic-optimizer')
  async getTrafficOptimizer(
    @Query('hour') hour?: string,
    @Query('dateStart') dateStart?: string,
    @Query('dateEnd') dateEnd?: string,
  ) {
    return this.analyticsService.getTrafficOptimizer({
      hour,
      dateStart,
      dateEnd,
    });
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
    return this.analyticsService.getCrossSellConfig({
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
      sector,
      dateStart,
      dateEnd,
    });
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
    return this.analyticsService.getCrossSellBySector({
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
      sector,
      forceRefresh,
      dateStart,
      dateEnd,
    });
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
    return this.analyticsService.getCrossSellBundles({
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
      sector,
      forceRefresh,
      dateStart,
      dateEnd,
    });
  }

  @Get('promos/quiet-periods')
  async getNextQuietPeriod() {
    return this.analyticsService.getNextQuietPeriod();
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
