import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/:sector')
  async getDashboard(@Param('sector') sector: string) {
    return this.analyticsService.getDashboard(sector);
  }

  @Get('forecast/:sector')
  async getForecast(
    @Param('sector') sector: string,
    @Query('temp') temp?: string,
    @Query('rain') rain?: string,
    @Query('holiday') holiday?: string,
  ) {
    return this.analyticsService.getForecast(sector, { temp, rain, holiday });
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
  async getCrossSell() {
    return this.analyticsService.getCrossSell();
  }
}
