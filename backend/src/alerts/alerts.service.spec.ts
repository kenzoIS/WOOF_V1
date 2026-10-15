import { AlertsService } from './alerts.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AuditService } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';

describe('AlertsService - Peak Congested Window & Happy Hour Opportunity', () => {
  let alertsService: AlertsService;
  let mockAnalyticsService: Partial<AnalyticsService>;
  let mockSupabaseService: any;
  let mockAuditService: Partial<AuditService>;
  let mockSettingsService: Partial<SettingsService>;
  let recordedAudits: any[] = [];

  beforeEach(() => {
    recordedAudits = [];

    mockAuditService = {
      record: jest.fn().mockImplementation((payload) => {
        recordedAudits.push(payload);
        return Promise.resolve();
      }),
    };

    mockSupabaseService = {
      client: {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: [], error: null }),
          upsert: jest.fn().mockResolvedValue({ error: null }),
          insert: jest.fn().mockResolvedValue({ error: null }),
          update: jest.fn().mockReturnThis(),
        }),
      },
    };

    mockSettingsService = {
      getAlertThresholds: jest.fn().mockReturnValue({
        capacityWarning: 75,
        lowInventory: 10,
        forecastAccuracyWarning: 80,
        dataStalenessDays: 3,
      }),
    };

    // Manila date for tests
    const now = new Date();
    const manilaDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    mockAnalyticsService = {
      getDataRange: jest.fn().mockResolvedValue({ minDate: manilaDateStr, maxDate: manilaDateStr }),
      getChannelStatus: jest.fn().mockResolvedValue([]),
      getTrafficOptimizer: jest.fn().mockResolvedValue({
        todayContext: {
          date: manilaDateStr,
          dayOfWeek: 'Thursday',
          totalExpectedVisits: 180,
          peakCongestion: {
            hour: 14,
            timeWindow: '14:00 – 15:00',
            startLabel: '14:00',
            endLabel: '15:00',
            predictedVisits: 45,
            demandLevel: 'High',
            scheduledStaff: 2,
            recommendedStaff: 4,
            staffDelta: 2,
            capacityUtilizationPercent: 88,
            sectorVisits: {
              Cafe: { visits: 25, utilizationPercent: 50 },
              Services: { visits: 20, utilizationPercent: 45 },
            },
          },
          hourlyForecast: [
            {
              hour: 14,
              predictedVisits: 45,
              demandLevel: 'high',
              scheduledStaff: 2,
              recommendedStaff: 4,
              capacityUtilizationPercent: 88,
              sectorVisits: { Cafe: 25, Services: 20 },
            },
            {
              hour: 15,
              predictedVisits: 20,
              demandLevel: 'moderate',
              scheduledStaff: 3,
              recommendedStaff: 3,
              capacityUtilizationPercent: 55,
              sectorVisits: { Cafe: 10, Services: 10 },
            },
          ],
          sectorBreakdown: {
            Cafe: { scheduledStaff: 1, recommendedStaff: 2, delta: 1, capacityStatus: 'Congested' },
            Services: { scheduledStaff: 1, recommendedStaff: 2, delta: 1, capacityStatus: 'Congested' },
          },
        },
      } as any),
      getNextQuietPeriod: jest.fn().mockResolvedValue({
        status: 'success',
        targetDate: '2099-01-01',
        targetDayName: 'Monday',
        targetHour: 15,
        predictedTrafficDrop: 65.5,
        probabilityScore: 0.92,
        recommendedItems: [
          { itemKey: 'Americano (iced)', recommendedDiscount: 15 },
          { itemKey: 'Chicken Cordon Bleu With Rice', recommendedDiscount: 15 },
        ],
      } as any),
    };

    alertsService = new AlertsService(
      mockSupabaseService as SupabaseService,
      mockAuditService as AuditService,
      mockAnalyticsService as AnalyticsService,
      mockSettingsService as SettingsService,
    );
  });

  it('evaluates Peak Congested Window and generates a PREDICTED critical/warning alert', async () => {
    await alertsService.evaluateAllRules();

    const activeAlerts = await alertsService.getActiveAlerts();
    const peakAlert = activeAlerts.find((a) => a.alertKey.startsWith('ALERT_PEAK_CONGESTION'));

    expect(peakAlert).toBeDefined();
    expect(peakAlert?.classification).toBe('PREDICTED');
    expect(peakAlert?.severity).toBe('critical'); // 88% util >= 80% or delta >= 2
    expect(peakAlert?.targetUrl).toBe('/traffic-optimizer');
    expect(peakAlert?.evidence).toContain('88% capacity load');
    expect(peakAlert?.evidence).not.toMatch(/Prophet|Erlang|Poisson|heuristic/i);

    // Verify audit log
    const triggeredAudit = recordedAudits.find(
      (a) => a.action === 'ALERT_TRIGGERED' && a.module === 'traffic_optimizer',
    );
    expect(triggeredAudit).toBeDefined();
    expect(triggeredAudit.actor).toBe('System');
    expect(triggeredAudit.metadata.initiatedBy).toBe('Traffic Optimizer');
    expect(triggeredAudit.metadata.classification).toBe('PREDICTED');
  });

  it('does not duplicate ALERT_TRIGGERED or OPPORTUNITY_DETECTED audit logs on successive evaluation cycles', async () => {
    await alertsService.evaluateAllRules();
    const firstCount = recordedAudits.length;

    // Run again
    await alertsService.evaluateAllRules();
    const secondCount = recordedAudits.length;

    // Should not have added any new ALERT_TRIGGERED or OPPORTUNITY_DETECTED logs
    const peakTriggers = recordedAudits.filter(
      (a) => a.action === 'ALERT_TRIGGERED' && a.metadata.alertKey?.startsWith('ALERT_PEAK_CONGESTION'),
    );
    expect(peakTriggers.length).toBe(1);

    const oppDetected = recordedAudits.filter((a) => a.action === 'OPPORTUNITY_DETECTED');
    expect(oppDetected.length).toBe(1);
    expect(secondCount).toBe(firstCount);
  });

  it('detects Happy Hour business opportunity and exposes it via getActiveOpportunities', async () => {
    await alertsService.evaluateAllRules();

    const opportunities = alertsService.getActiveOpportunities();
    expect(opportunities.length).toBeGreaterThan(0);

    const happyHour = opportunities[0];
    expect(happyHour.type).toBe('opportunity');
    expect(happyHour.title).toContain('Business Opportunity: Next Quiet Period');
    expect(happyHour.metadata?.classification).toBe('PREDICTED');
    expect(happyHour.metadata?.predictedTrafficDrop).toBe(66);
  });

  it('records OPPORTUNITY_ACTED and marks opportunity as read when acted upon', async () => {
    await alertsService.evaluateAllRules();

    const opportunities = alertsService.getActiveOpportunities();
    const happyHour = opportunities[0];

    const result = await alertsService.recordOpportunityActed(happyHour.id, 'manager@happytails.com');
    expect(result).not.toBeNull();
    expect(result?.notification?.read).toBe(true);

    const actedAudit = recordedAudits.find((a) => a.action === 'OPPORTUNITY_ACTED');
    expect(actedAudit).toBeDefined();
    expect(actedAudit.actor).toBe('manager@happytails.com');
    expect(actedAudit.module).toBe('cafe');
    expect(actedAudit.metadata.opportunityId).toBe(happyHour.id);
  });

  it('records ALERT_ACKNOWLEDGED and ALERT_RESOLVED with proper audit categorization', async () => {
    await alertsService.evaluateAllRules();

    const activeAlerts = await alertsService.getActiveAlerts();
    const peakAlert = activeAlerts.find((a) => a.alertKey.startsWith('ALERT_PEAK_CONGESTION'));
    expect(peakAlert).toBeDefined();

    // Acknowledge
    await alertsService.acknowledgeAlert(peakAlert!.id, {
      userEmail: 'owner@happytails.com',
      snoozeHours: 4,
      note: 'Reassigning staff from Cafe to Services',
    });

    const ackAudit = recordedAudits.find((a) => a.action === 'ALERT_ACKNOWLEDGED');
    expect(ackAudit).toBeDefined();
    expect(ackAudit.module).toBe('traffic_optimizer');
    expect(ackAudit.actor).toBe('owner@happytails.com');

    // Resolve
    await alertsService.resolveAlert(peakAlert!.id, {
      userEmail: 'owner@happytails.com',
      reason: 'Staff reallocated and rush addressed',
    });

    const resolveAudit = recordedAudits.find((a) => a.action === 'ALERT_RESOLVED');
    expect(resolveAudit).toBeDefined();
    expect(resolveAudit.module).toBe('traffic_optimizer');
    expect(resolveAudit.actor).toBe('owner@happytails.com');
  });

  it('expires past opportunities when their scheduled window has passed and logs OPPORTUNITY_EXPIRED', async () => {
    await alertsService.evaluateAllRules();

    // Now pretend the quiet period window has passed (past date)
    (alertsService as any).notifications.clear();
    await (alertsService as any).upsertOpportunityNotification({
      id: 'NTF-OPP-PAST',
      oppKey: 'OPP_HAPPY_HOUR:2020-01-01:10',
      recipientEmail: 'all',
      type: 'opportunity',
      title: 'Business Opportunity: Expired Quiet Window',
      message: 'Quiet window past',
      targetUrl: '/traffic-optimizer',
      actionLabel: 'PLAN PROMOTION',
      metadata: {
        targetDate: '2020-01-01',
        targetHour: 10,
        predictedTrafficDrop: 50,
      },
    });

    // Run evaluation to trigger expiration check
    await alertsService.evaluateAllRules();

    const expiredAudit = recordedAudits.find((a) => a.action === 'OPPORTUNITY_EXPIRED');
    expect(expiredAudit).toBeDefined();
    expect(expiredAudit.actor).toBe('System');
    expect(expiredAudit.metadata.initiatedBy).toBe('Traffic Optimizer');
    expect(expiredAudit.stateAfter).toBe('expired');
  });
});
