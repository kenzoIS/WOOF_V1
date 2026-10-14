export type AlertSeverity = 'critical' | 'warning' | 'advisory';
export type AlertClassification =
  | 'OBSERVED'
  | 'PREDICTED'
  | 'FORECAST'
  | 'SIMULATION'
  | 'SUSPECTED_RISK';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface SystemAlert {
  id: string;
  alertKey: string; // e.g. "ALERT_PEAK_CONGESTION:2026-10-14:13"
  module: 'services' | 'cafe' | 'retail' | 'pipeline' | 'forecast' | 'general';
  severity: AlertSeverity;
  classification: AlertClassification;
  title: string;
  evidence: string;
  targetUrl: string;
  actionLabel: string;
  status: AlertStatus;
  firstTriggeredAt: string;
  lastEvaluatedAt: string;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  snoozeUntil?: string | null;
  resolvedAt?: string | null;
  resolutionType?: 'auto' | 'manual' | null;
  resolutionReason?: string | null;
  metadata?: Record<string, unknown>;
}

export type NotificationType =
  | 'alert'
  | 'opportunity'
  | 'suggestion'
  | 'report'
  | 'system'
  | 'info';

export interface UserNotification {
  id: string;
  recipientEmail: string;
  type: NotificationType;
  title: string;
  message: string;
  targetUrl: string;
  actionLabel: string;
  read: boolean;
  readAt?: string | null;
  dismissed: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export class AcknowledgeAlertDto {
  userEmail?: string;
  snoozeHours?: number;
  note?: string;
}

export class ResolveAlertDto {
  userEmail?: string;
  reason!: string;
}
