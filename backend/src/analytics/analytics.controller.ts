import { Controller, Get, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/:sector')
  async getDashboard(@Param('sector') sector: string) {
    return this.analyticsService.getDashboard(sector);
  }

  @Get('forecast/:sector')
  async getForecast(@Param('sector') sector: string) {
    return this.analyticsService.getForecast(sector);
  }

  @Get('forecast-by-channel/retail')
  async getRetailForecastByChannel() {
    return this.analyticsService.getRetailForecastByChannel();
  }

  @Get('exogenous/status')
  async getExogenousStatus() {
    return this.analyticsService.getExogenousStatus();
  }

  @Get('cross-sell')
  async getCrossSell() {
    return this.analyticsService.getCrossSell();
  }
}
