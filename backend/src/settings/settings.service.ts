import { Injectable } from '@nestjs/common';

export type AlertThresholdKey =
  | 'capacityWarning'
  | 'lowInventory'
  | 'forecastAccuracyWarning'
  | 'dataStalenessDays';

export type AlertThresholds = Record<AlertThresholdKey, number>;

export type AlertEvaluationMetrics = Partial<{
  capacityUsage: number;
  lowInventoryPercent: number;
  forecastAccuracy: number;
  dataAgeDays: number;
}>;

type TriggeredAlertRule = {
  key: AlertThresholdKey;
  label: string;
  actual: number;
  threshold: number;
  comparison: '>=' | '<=' | '>';
};

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  capacityWarning: 85,
  lowInventory: 20,
  forecastAccuracyWarning: 80,
  dataStalenessDays: 7,
};

const THRESHOLD_LIMITS: Record<
  AlertThresholdKey,
  { min: number; max: number }
> = {
  capacityWarning: { min: 1, max: 100 },
  lowInventory: { min: 1, max: 100 },
  forecastAccuracyWarning: { min: 1, max: 100 },
  dataStalenessDays: { min: 1, max: 60 },
};

@Injectable()
export class SettingsService {
  private alertThresholds = { ...DEFAULT_ALERT_THRESHOLDS };

  getAlertThresholds() {
    return { ...this.alertThresholds };
  }

  updateAlertThresholds(input: Partial<AlertThresholds>) {
    this.alertThresholds = this.normalizeAlertThresholds({
      ...this.alertThresholds,
      ...input,
    });
    return this.getAlertThresholds();
  }

  evaluateAlertThresholds(metrics: AlertEvaluationMetrics) {
    const thresholds = this.getAlertThresholds();
    const triggered: TriggeredAlertRule[] = [];

    this.pushIfTriggered(triggered, {
      key: 'capacityWarning',
      label: 'Capacity warning threshold',
      actual: metrics.capacityUsage,
      threshold: thresholds.capacityWarning,
      comparison: '>=',
    });
    this.pushIfTriggered(triggered, {
      key: 'lowInventory',
      label: 'Low inventory threshold',
      actual: metrics.lowInventoryPercent,
      threshold: thresholds.lowInventory,
      comparison: '<=',
    });
    this.pushIfTriggered(triggered, {
      key: 'forecastAccuracyWarning',
      label: 'Forecast accuracy warning threshold',
      actual: metrics.forecastAccuracy,
      threshold: thresholds.forecastAccuracyWarning,
      comparison: '<=',
    });
    this.pushIfTriggered(triggered, {
      key: 'dataStalenessDays',
      label: 'Data staleness warning',
      actual: metrics.dataAgeDays,
      threshold: thresholds.dataStalenessDays,
      comparison: '>',
    });

    return { thresholds, metrics, triggered };
  }

  private normalizeAlertThresholds(input: Partial<AlertThresholds>) {
    return (
      Object.keys(DEFAULT_ALERT_THRESHOLDS) as AlertThresholdKey[]
    ).reduce((normalized, key) => {
      const limits = THRESHOLD_LIMITS[key];
      const rawValue = input[key];
      const numericValue =
        typeof rawValue === 'number' && Number.isFinite(rawValue)
          ? rawValue
          : DEFAULT_ALERT_THRESHOLDS[key];
      normalized[key] = Math.min(
        limits.max,
        Math.max(limits.min, Math.round(numericValue)),
      );
      return normalized;
    }, {} as AlertThresholds);
  }

  private pushIfTriggered(
    triggered: TriggeredAlertRule[],
    rule: {
      key: AlertThresholdKey;
      label: string;
      actual: number | undefined;
      threshold: number;
      comparison: '>=' | '<=' | '>';
    },
  ) {
    if (typeof rule.actual !== 'number' || !Number.isFinite(rule.actual)) {
      return;
    }

    const shouldTrigger =
      rule.comparison === '>='
        ? rule.actual >= rule.threshold
        : rule.comparison === '<='
          ? rule.actual <= rule.threshold
          : rule.actual > rule.threshold;

    if (shouldTrigger) {
      triggered.push({
        key: rule.key,
        label: rule.label,
        actual: rule.actual,
        threshold: rule.threshold,
        comparison: rule.comparison,
      });
    }
  }
}
