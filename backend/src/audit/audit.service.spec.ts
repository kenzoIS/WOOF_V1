import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import { AwsService } from '../aws/aws.service';

describe('AuditService', () => {
  let service: AuditService;
  let supabaseMock: any;
  let awsMock: any;
  let insertedRecords: any[];

  beforeEach(async () => {
    insertedRecords = [];

    supabaseMock = {
      client: {
        from: jest.fn((table: string) => {
          return {
            insert: jest.fn(async (payload: any) => {
              insertedRecords.push(payload);
              return { error: null };
            }),
            select: jest.fn((fields: string, opts?: any) => {
              const chain: any = {
                is: jest.fn(() => chain),
                eq: jest.fn(() => chain),
                neq: jest.fn(() => chain),
                or: jest.fn(() => chain),
                gte: jest.fn(() => chain),
                lte: jest.fn(() => chain),
                lt: jest.fn(() => chain),
                order: jest.fn(() => chain),
                limit: jest.fn(() => chain),
                not: jest.fn(() => chain),
                range: jest.fn(async (from: number, to: number) => {
                  return {
                    data: [
                      {
                        id: 'log-1',
                        actor: 'Traffic Optimizer',
                        actor_type: 'system',
                        action: 'ALERT_TRIGGERED',
                        module: 'traffic_optimizer',
                        category: 'workflow',
                        status: 'pending',
                        created_at: '2026-10-15T10:00:00Z',
                        metadata: {},
                      },
                      {
                        id: 'log-2',
                        actor: 'Owner',
                        actor_type: 'user',
                        action: 'Executed What-If Simulation',
                        module: 'simulation',
                        category: 'ai_system',
                        status: 'success',
                        created_at: '2026-10-15T11:00:00Z',
                        metadata: {},
                      },
                    ],
                    count: 2,
                    error: null,
                  };
                }),
              };
              return chain;
            }),
            delete: jest.fn(() => ({
              in: jest.fn(async () => ({ error: null })),
            })),
          };
        }),
      },
    };

    awsMock = {
      uploadAuditArchive: jest.fn(async (dateStr: string, records: any[], sha256: string) => ({
        uri: `s3://woof-data-lake/audit-archives/2026/10/audit_logs_${dateStr}.json`,
        key: `audit-archives/2026/10/audit_logs_${dateStr}.json`,
      })),
      verifyAuditArchive: jest.fn(async () => true),
      getAuditArchive: jest.fn(async (key: string) => [
        {
          id: 'archived-s3-1',
          actor: 'System',
          actor_type: 'system',
          action: 'AUDIT_LOGS_ARCHIVED_TO_S3',
          module: 'audit',
          category: 'workflow',
          status: 'success',
          created_at: '2026-09-01T02:00:00Z',
          metadata: { sha256: 'mock-hash' },
        },
      ]),
      listAuditArchives: jest.fn(async () => [
        {
          key: 'audit-archives/2026/09/audit_logs_2026-09-01.json',
          size: 1024,
          lastModified: new Date('2026-09-01T02:05:00Z'),
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: AwsService, useValue: awsMock },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('Strict 2-tier Actor Resolution', () => {
    it('classifies authenticated user actions as Owner', async () => {
      await service.record({
        actor: 'woofdash@gmail.com',
        actorType: 'user',
        action: 'Manual System Recalibration',
        module: 'settings',
      });

      expect(insertedRecords.length).toBe(1);
      expect(insertedRecords[0].actor).toBe('Owner');
      expect(insertedRecords[0].actor_type).toBe('user');
      expect(insertedRecords[0].metadata.initiatedBy).toBe('woofdash@gmail.com');
    });

    it('classifies background automated tasks and integrations as System', async () => {
      await service.record({
        actor: 'Traffic Optimizer',
        actorType: 'system',
        action: 'ALERT_TRIGGERED',
        module: 'alerts',
      });

      expect(insertedRecords.length).toBe(1);
      expect(insertedRecords[0].actor).toBe('System');
      expect(insertedRecords[0].actor_type).toBe('system');
      expect(insertedRecords[0].metadata.initiatedBy).toBe('Traffic Optimizer');
    });

    it('normalizes legacy database records strictly to Owner or System in list()', async () => {
      const res = await service.list({ page: 1, limit: 20 });
      expect(res.events).toHaveLength(2);

      // Legacy "Traffic Optimizer" row must be normalized to "System" with initiatedBy preserved
      expect(res.events[0].actor).toBe('System');
      expect(res.events[0].metadata.initiatedBy).toBe('Traffic Optimizer');

      // Owner row remains Owner
      expect(res.events[1].actor).toBe('Owner');
    });
  });

  describe('AWS S3 Historical Archive Retrieval', () => {
    it('merges S3 archived records when includeArchived is requested', async () => {
      // Mock live request to return empty for range
      supabaseMock.client.from = jest.fn(() => ({
        select: jest.fn(() => ({
          is: () => ({
            order: () => ({
              limit: async () => ({
                data: [
                  {
                    id: 'live-1',
                    actor: 'Owner',
                    actor_type: 'user',
                    action: 'Live Event',
                    module: 'auth',
                    status: 'success',
                    created_at: '2026-10-15T12:00:00Z',
                    metadata: {},
                  },
                ],
              }),
            }),
          }),
        })),
      }));

      const res = await service.list({ includeArchived: true, page: 1, limit: 20 });
      expect(awsMock.listAuditArchives).toHaveBeenCalled();
      expect(awsMock.getAuditArchive).toHaveBeenCalledWith('audit-archives/2026/09/audit_logs_2026-09-01.json');

      expect(res.events.length).toBe(2);
      expect(res.events[0].id).toBe('live-1');
      expect(res.events[1].id).toBe('archived-s3-1');
      expect(res.events[1].isArchived).toBe(true);
      expect(res.total).toBe(2);
    });
  });

  describe('10-Day Retention Archival & Tamper Protection', () => {
    it('verifies SHA-256 integrity before deleting source rows from Supabase', async () => {
      const testRecords = [
        {
          id: 'old-1',
          actor: 'System',
          action: 'OLD_EVENT',
          created_at: '2026-09-01T00:00:00Z',
        },
      ];

      supabaseMock.client.from = jest.fn((table: string) => {
        if (table === 'audit_logs') {
          return {
            select: () => ({
              is: () => ({
                lt: () => ({
                  order: () => ({
                    limit: async () => ({ data: testRecords, error: null }),
                  }),
                }),
              }),
            }),
            delete: () => ({
              in: jest.fn(async () => ({ error: null })),
            }),
            insert: jest.fn(async (p: any) => {
              insertedRecords.push(p);
              return { error: null };
            }),
          };
        }
        return {};
      });

      const result = await service.archiveOldLogsToS3(10);
      expect(result.archivedCount).toBe(1);
      expect(awsMock.uploadAuditArchive).toHaveBeenCalled();
      expect(awsMock.verifyAuditArchive).toHaveBeenCalled();

      // Check tamper-evident log
      const archiveEvent = insertedRecords.find((r) => r.action === 'AUDIT_LOGS_ARCHIVED_TO_S3');
      expect(archiveEvent).toBeDefined();
      expect(archiveEvent.actor).toBe('System');
      expect(archiveEvent.metadata.recordCount).toBe(1);
    });

    it('aborts deletion if S3 archive verification fails', async () => {
      awsMock.verifyAuditArchive.mockResolvedValueOnce(false);

      const testRecords = [
        {
          id: 'old-2',
          actor: 'System',
          action: 'OLD_EVENT_2',
          created_at: '2026-09-01T00:00:00Z',
        },
      ];

      supabaseMock.client.from = jest.fn(() => ({
        select: () => ({
          is: () => ({
            lt: () => ({
              order: () => ({
                limit: async () => ({ data: testRecords, error: null }),
              }),
            }),
          }),
        }),
      }));

      await expect(service.archiveOldLogsToS3(10)).rejects.toThrow(/integrity verification failed/);
    });
  });
});
