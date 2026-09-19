import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { SettingsService } from './settings.service';
import type {
  AlertEvaluationMetrics,
  AlertThresholds,
} from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('alert-thresholds')
  getAlertThresholds() {
    return this.settingsService.getAlertThresholds();
  }

  @Patch('alert-thresholds')
  updateAlertThresholds(@Body() body: Partial<AlertThresholds>) {
    return this.settingsService.updateAlertThresholds(body || {});
  }

  @Post('alert-thresholds/evaluate')
  evaluateAlertThresholds(@Body() body: AlertEvaluationMetrics) {
    return this.settingsService.evaluateAlertThresholds(body || {});
  }
}
