import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

export type AuditLogInput = {
  actor?: string;
  actorType?: 'user' | 'system' | 'integration';
  action: string;
  module: string;
  category?: 'workflow' | 'ai_system' | 'security';
  target?: string;
  status?: 'success' | 'failed' | 'pending';
  stateBefore?: string;
  stateAfter?: string;
  durationMs?: number;
  method?: string;
  path?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async record(input: AuditLogInput) {
    try {
      const { error } = await this.supabaseService.client
        .from('audit_logs')
        .insert({
          actor: input.actor || 'System',
          actor_type: input.actorType || 'system',
          action: input.action,
          module: input.module,
          category:
            input.category ||
            (input.module === 'auth' || input.module === 'security'
              ? 'security'
              : input.actorType === 'user'
                ? 'workflow'
                : 'ai_system'),
          target: input.target || null,
          status: input.status || 'success',
          state_before: input.stateBefore || null,
          state_after: input.stateAfter || null,
          duration_ms: input.durationMs ?? null,
          method: input.method || null,
          path: input.path || null,
          ip_address: input.ipAddress || null,
          user_agent: input.userAgent || null,
          metadata: input.metadata || {},
        });
      if (error) throw error;
    } catch (error) {
      this.logger.warn(
        `Audit event could not be persisted: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async list(query: {
    search?: string;
    module?: string;
    status?: string;
    category?: string;
    limit?: number;
  }) {
    let request = this.supabaseService.client
      .from('audit_logs')
      .select('*')
      // Audit records are explicit business events. Older request-level rows
      // may still exist from the previous interceptor-based implementation.
      .is('method', null)
      .order('created_at', { ascending: false })
      .limit(Math.min(Math.max(query.limit || 200, 1), 1000));

    if (query.module && query.module !== 'all')
      request = request.eq('module', query.module);
    if (query.status && query.status !== 'all')
      request = request.eq('status', query.status);
    if (query.category && query.category !== 'all')
      request = request.eq('category', query.category);
    if (query.search) {
      const value = query.search.replace(/[%(),]/g, ' ');
      request = request.or(
        `actor.ilike.%${value}%,action.ilike.%${value}%,module.ilike.%${value}%,target.ilike.%${value}%`,
      );
    }

    const { data, error } = await request;
    if (error) throw error;
    return data || [];
  }

  async summary() {
    const events = await this.list({ limit: 1000 });
    const completed = events.filter(
      (event) => event.status === 'success',
    ).length;
    const pending = events.filter((event) => event.status === 'pending').length;
    const automated = events.filter(
      (event) => event.actor_type !== 'user',
    ).length;
    const durations = events
      .map((event) => Number(event.duration_ms))
      .filter(Number.isFinite);
    return {
      total: events.length,
      pendingApprovals: pending,
      automatedTriggers: automated,
      systemBottlenecks: events.filter((event) => event.status === 'failed')
        .length,
      averageDurationMs: durations.length
        ? Math.round(
            durations.reduce((sum, value) => sum + value, 0) / durations.length,
          )
        : 0,
      successful: completed,
    };
  }
}
