import { DEFAULT_ALERT_THRESHOLDS, SettingsService } from './settings.service';

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
});
