import {
  DEFAULT_ALERT_THRESHOLDS,
  DEFAULT_DATA_RETENTION_DAYS,
  SettingsService,
} from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    service = new SettingsService();
  });

  it('returns default alert thresholds', () => {
    expect(service.getAlertThresholds()).toEqual(DEFAULT_ALERT_THRESHOLDS);
  });

  it('clamps and normalizes updated threshold values', () => {
    const updated = service.updateAlertThresholds({
      capacityWarning: 101,
      dataStalenessDays: -5,
    });

    expect(updated.capacityWarning).toBe(100);
    expect(updated.dataStalenessDays).toBe(1);
  });

  it('evaluates metrics against the configured alert thresholds', () => {
    service.updateAlertThresholds({
      capacityWarning: 80,
      forecastAccuracyWarning: 85,
      dataStalenessDays: 3,
    });

    const result = service.evaluateAlertThresholds({
      capacityUsage: 91,
      forecastAccuracy: 82,
      dataAgeDays: 4,
      lowInventoryPercent: 25,
    });

    expect(result.triggered.map((rule) => rule.key)).toEqual([
      'capacityWarning',
      'forecastAccuracyWarning',
      'dataStalenessDays',
    ]);
  });

  it('normalizes data retention settings and marks historical sales as protected', () => {
    expect(service.getDataRetentionSettings()).toEqual({
      retentionDays: DEFAULT_DATA_RETENTION_DAYS,
      protectedHistoricalSales: true,
      scope: expect.arrayContaining([
        'audit_logs',
        'smart_reports',
        'recommendation_feedback',
        'cross_sell_caches',
      ]),
    });

    const updated = service.updateDataRetentionSettings({
      retentionDays: 999,
    });

    expect(updated.retentionDays).toBe(365);
    expect(updated.protectedHistoricalSales).toBe(true);
  });

  it('builds an export manifest without treating sales history as cleanup data', async () => {
    const exportResult = await service.buildDataExport();

    expect(exportResult.filename).toMatch(/^WOOF_Data_Export_/);
    expect(exportResult.payload.manifest.protectedHistoricalSales).toEqual(
      expect.objectContaining({
        protected: true,
        tables: expect.arrayContaining(['transactions', 'fact_transactions']),
      }),
    );
    expect(exportResult.payload.settings.dataRetention.protectedHistoricalSales).toBe(
      true,
    );
  });

  it('allows CSV export only for one flat dataset', async () => {
    const csvExport = await service.buildDataExport({
      exportAll: false,
      format: 'csv',
      datasets: ['csvUploads'],
    });

    expect(csvExport.filename).toMatch(/^WOOF_csvUploads_/);
    expect(csvExport.contentType).toContain('text/csv');

    await expect(
      service.buildDataExport({
        exportAll: false,
        format: 'csv',
        datasets: ['forecastRuns'],
      }),
    ).rejects.toThrow('CSV export is available only for one flat dataset');
  });
});
