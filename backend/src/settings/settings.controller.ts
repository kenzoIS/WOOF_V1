import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { Res } from '@nestjs/common';
import type { Response } from 'express';
import { SettingsService } from './settings.service';
import type {
  AlertEvaluationMetrics,
  ExportDatasetKey,
  ExportFormat,
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

  @Get('data-retention')
  getDataRetentionSettings() {
    return this.settingsService.getDataRetentionSettings();
  }

  @Patch('data-retention')
  updateDataRetentionSettings(
    @Body() body: Partial<{ retentionDays: number }>,
  ) {
    return this.settingsService.updateDataRetentionSettings(body || {});
  }

  @Post('data-retention/apply')
  applyDataRetention(@Body() body: Partial<{ retentionDays: number }>) {
    return this.settingsService.applyDataRetention(body || {});
  }

  @Get('export')
  async exportAllData(
    @Res() response: Response,
    @Query('format') format?: ExportFormat,
    @Query('datasets') datasets?: string,
    @Query('all') all?: string,
  ) {
    const { filename, payload, contentType } =
      await this.settingsService.buildDataExport({
        format,
        exportAll: all !== 'false',
        datasets: datasets
          ? (datasets.split(',').filter(Boolean) as ExportDatasetKey[])
          : undefined,
      });
    response.setHeader('Content-Type', contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    response.send(
      typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
    );
  }
}
