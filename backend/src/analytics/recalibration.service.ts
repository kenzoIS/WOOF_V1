import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AwsService } from '../aws/aws.service';
import { SupabaseService } from '../common/supabase/supabase.service';

type FeedbackSignal = {
  feedbackId: string;
  category?: string;
  sourceType?: string;
  sourceId?: string;
  feedback: 'helpful' | 'not-helpful';
  notes?: string | null;
  metadata?: Record<string, unknown>;
};

type Route = {
  category: string;
  targetModel: string;
  immediate: boolean;
};

@Injectable()
export class RecalibrationService {
  private readonly logger = new Logger(RecalibrationService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly awsService: AwsService,
  ) {}

  /**
   * Persists the learning signal before attempting any model work.  A model
   * outage can therefore never undo a successfully completed prescription.
   */
  async enqueueCompletedFeedback(signal: FeedbackSignal): Promise<any> {
    const route = this.route(signal.category, signal.sourceType);
    const now = new Date().toISOString();
    const metadata = {
      ...(signal.metadata || {}),
      learningSignal: this.learningSignal(signal.feedback, signal.notes),
      handlerPlan: this.handlerPlan(route.targetModel, signal.feedback),
      routing: {
        category: route.category,
        sourceType: signal.sourceType || 'recommendation_feedback',
        targetModel: route.targetModel,
      },
    };
    const payload = {
      feedback_id: signal.feedbackId,
      category: route.category,
      source_type: signal.sourceType || 'recommendation_feedback',
      source_id: signal.sourceId || null,
      feedback: signal.feedback,
      notes: signal.notes || null,
      target_model: route.targetModel,
      status: 'pending',
      error_message: null,
      metadata,
      updated_at: now,
    };

    const { data: existing, error: lookupError } = await this.supabaseService.client
      .from('prescription_recalibration_events')
      .select('*')
      .eq('feedback_id', signal.feedbackId)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const write = existing?.id
      ? this.supabaseService.client
          .from('prescription_recalibration_events')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single()
      : this.supabaseService.client
          .from('prescription_recalibration_events')
          .insert(payload)
          .select()
          .single();
    const { data, error } = await write;
    if (error) throw error;

    if (!route.immediate) {
      return { ...data, processing: 'queued' };
    }
    return this.processEvent(data);
  }

  @Cron('*/5 * * * *')
  async processPendingEvents(): Promise<void> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('prescription_recalibration_events')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) throw error;
      for (const event of data || []) {
        const route = this.route(event.category, event.source_type);
        if (route.immediate) await this.processEvent(event);
      }
    } catch (error) {
      this.logger.warn(`Could not process recalibration queue: ${this.message(error)}`);
    }
  }

  async listEvents(status?: string): Promise<any[]> {
    let query = this.supabaseService.client
      .from('prescription_recalibration_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (status && ['pending', 'processed', 'failed'].includes(status)) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async processEvent(event: any): Promise<any> {
    const now = new Date().toISOString();
    try {
      const handler = this.route(event.category, event.source_type).targetModel;
      const action = await this.runImmediateHandler(handler, event);
      const metadata = { ...(event.metadata || {}), handler, action };
      const { data, error } = await this.supabaseService.client
        .from('prescription_recalibration_events')
        .update({ status: 'processed', processed_at: now, updated_at: now, error_message: null, metadata })
        .eq('id', event.id)
        .select()
        .single();
      if (error) throw error;
      this.awsService.uploadRecalibrationArchive(handler, { ...event, status: 'processed', action, processedAt: now })
        .catch((archiveError) => this.logger.warn(`Recalibration archive failed: ${this.message(archiveError)}`));
      return { ...data, processing: 'processed' };
    } catch (error) {
      const { data } = await this.supabaseService.client
        .from('prescription_recalibration_events')
        .update({ status: 'failed', error_message: this.message(error), updated_at: now })
        .eq('id', event.id)
        .select()
        .maybeSingle();
      return { ...(data || event), processing: 'failed' };
    }
  }

  private async runImmediateHandler(targetModel: string, event: any): Promise<string> {
    if (targetModel === 'bundle-cross-sell') {
      const { error } = await this.supabaseService.client.from('cross_sell_caches').delete().lt('created_at', new Date().toISOString());
      if (error && !this.isMissingTable(error)) throw error;
      return `${event.feedback} bundle signal recorded; cross-sell candidates invalidated for regeneration`;
    }
    // Staffing/traffic and forecast recommendations share the forecast artefact cache.
    const { error } = await this.supabaseService.client.from('forecast_runs').delete().in('module', ['Cafe', 'Services']);
    if (error && !this.isMissingTable(error)) throw error;
    return `${event.feedback} ${targetModel} signal recorded; forecast artefacts invalidated for the next model run`;
  }

  private route(category?: string, sourceType?: string): Route {
    const value = `${category || ''} ${sourceType || ''}`.toLowerCase();
    if (value.includes('bundle')) return { category: 'bundle', targetModel: 'bundle-cross-sell', immediate: true };
    if (value.includes('staffing') || value.includes('traffic')) return { category: 'staffing', targetModel: 'staffing-traffic-optimizer', immediate: true };
    if (value.includes('happy_hour') || value.includes('happy-hour') || value.includes('dynamic_promo')) return { category: 'happy_hour', targetModel: 'dynamic-promo-timing', immediate: false };
    if (value.includes('pethub') || value.includes('activation_campaign')) return { category: 'pethub_campaign', targetModel: 'campaign-activation-recommender', immediate: false };
    if (value.includes('forecast')) return { category: 'forecast', targetModel: 'forecast-recommendation', immediate: true };
    return { category: 'general', targetModel: 'shared-recommendation-weighting', immediate: false };
  }

  private learningSignal(feedback: FeedbackSignal['feedback'], notes?: string | null) {
    return {
      direction: feedback === 'helpful' ? 'reinforce' : 'penalize',
      notes: notes || null,
      recordedAt: new Date().toISOString(),
    };
  }

  // The deferred models receive a durable, model-specific training example.
  // They intentionally remain pending until a real trainer is connected.
  private handlerPlan(targetModel: string, feedback: FeedbackSignal['feedback']) {
    const direction = feedback === 'helpful' ? 'reinforce' : 'penalize';
    switch (targetModel) {
      case 'bundle-cross-sell':
        return { handler: 'bundle', mode: 'immediate', action: `${direction} bundle affinity and regenerate candidates` };
      case 'staffing-traffic-optimizer':
        return { handler: 'staffing-traffic', mode: 'immediate', action: `${direction} staffing-window confidence and refresh forecasts` };
      case 'dynamic-promo-timing':
        return { handler: 'dynamic-promo', mode: 'queued', action: `${direction} promo timing and discount-pattern example` };
      case 'campaign-activation-recommender':
        return { handler: 'pethub-campaign', mode: 'queued', action: `${direction} campaign audience and activation-pattern example` };
      case 'forecast-recommendation':
        return { handler: 'forecast', mode: 'immediate', action: `${direction} forecast recommendation confidence and refresh artefacts` };
      default:
        return { handler: 'general', mode: 'queued', action: `${direction} shared recommendation weighting example` };
    }
  }

  private isMissingTable(error: any): boolean {
    const message = this.message(error).toLowerCase();
    return message.includes('pgrst205') || message.includes('could not find the table') || message.includes('schema cache');
  }

  private message(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    const detail = error && typeof error === 'object' ? error as Record<string, unknown> : {};
    return [detail.message, detail.details, detail.hint, detail.code].filter(Boolean).join(' | ') || 'Unknown error';
  }
}
