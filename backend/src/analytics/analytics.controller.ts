import { Controller, Get, Param, Query } from '@nestjs/common';
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
    @Query('days') days?: string,
    @Query('forceRefresh') forceRefresh?: string,
  ) {
    return this.analyticsService.getForecast(sector, { temp, rain, holiday, days, forceRefresh });
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
    @Query('forceRefresh') forceRefresh?: string,
  ) {
    return this.analyticsService.getCrossSell({
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
      forceRefresh,
    });
  }

  @Get('cross-sell/config')
  async getCrossSellConfig(
    @Query('minSupport') minSupport?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('minLift') minLift?: string,
    @Query('maxBundleCandidates') maxBundleCandidates?: string,
    @Query('hour') hour?: string,
  ) {
    return this.analyticsService.getCrossSellConfig({
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
    });
  }

  @Get('cross-sell/by-sector')
  async getCrossSellBySector(
    @Query('minSupport') minSupport?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('minLift') minLift?: string,
    @Query('maxBundleCandidates') maxBundleCandidates?: string,
    @Query('hour') hour?: string,
    @Query('forceRefresh') forceRefresh?: string,
  ) {
    return this.analyticsService.getCrossSellBySector({
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
      forceRefresh,
    });
  }

  @Get('cross-sell/bundles')
  async getCrossSellBundles(
    @Query('minSupport') minSupport?: string,
    @Query('minConfidence') minConfidence?: string,
    @Query('minLift') minLift?: string,
    @Query('maxBundleCandidates') maxBundleCandidates?: string,
    @Query('hour') hour?: string,
    @Query('forceRefresh') forceRefresh?: string,
  ) {
    return this.analyticsService.getCrossSellBundles({
      minSupport,
      minConfidence,
      minLift,
      maxBundleCandidates,
      hour,
      forceRefresh,
    });
  }
}
