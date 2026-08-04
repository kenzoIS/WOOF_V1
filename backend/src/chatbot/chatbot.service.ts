import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from '../csv/schemas/transaction.schema';

type DashboardIntent =
  | 'total_revenue'
  | 'total_orders'
  | 'total_quantity'
  | 'average_order_value'
  | 'top_items'
  | 'sector_breakdown'
  | 'channel_breakdown'
  | 'best_sector'
  | 'best_channel'
  | 'forecast_overview'
  | 'cross_sell_overview'
  | 'out_of_scope';

type RangeKey =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'this_month'
  | 'custom'
  | 'all';

type AnswerMode = 'compute' | 'clarify' | 'unsupported';

interface QueryPlan {
  intent: DashboardIntent;
  metric?: 'netSales' | 'orders' | 'quantity' | 'avgOrderValue';
  dateRange: RangeKey;
  sector?: 'Cafe' | 'Retail' | 'Services';
  channel?: 'POS' | 'Shopee' | 'TikTok Shop' | 'PetHub';
  limit?: number;
  dateStart?: string;
  dateEnd?: string;
  generatedSql?: string;
  classifier?: 'claude' | 'fallback';
  answerMode?: AnswerMode;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  analysisSteps?: string[];
  warnings?: string[];
}

interface ChatHistoryItem {
  sender?: string;
  text?: string;
}

const OUT_OF_SCOPE_MESSAGE =
  'I can help with WOOF dashboard questions only, like sales, orders, quantity sold, channels, sectors, top items, forecasts, and bundle recommendations. Ask me something from the dashboard and I will compute it for you.';

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  jun: 5,
  jul: 6,
  aug: 7,
};

const MONTH_ALIASES: Record<string, string> = {
  enero: 'january',
  pebrero: 'february',
  marso: 'march',
  abril: 'april',
  mayo: 'may',
  hunyo: 'june',
  hulyo: 'july',
  agosto: 'august',
  setyembre: 'september',
  oktubre: 'october',
  nobyembre: 'november',
  disyembre: 'december',
};

@Injectable()
export class ChatbotService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async answer(question: string, history: ChatHistoryItem[] = []): Promise<any> {
    const cleanedQuestion = String(question || '').trim();
    if (!cleanedQuestion) {
      throw new BadRequestException('Question is required.');
    }

    const conversationContext = this.buildConversationContext(history);
    const questionForPlanning = this.resolveFollowUpQuestion(
      cleanedQuestion,
      conversationContext,
    );
    let plan = await this.planQuestion(questionForPlanning);
    const fallbackClarification = this.getClarificationQuestion(
      questionForPlanning,
      plan,
    );
    if (
      fallbackClarification &&
      plan.intent !== 'out_of_scope' &&
      plan.answerMode !== 'unsupported'
    ) {
      plan = {
        ...plan,
        answerMode: 'clarify',
        needsClarification: true,
        clarificationQuestion:
          plan.clarificationQuestion || fallbackClarification,
        analysisSteps:
          plan.analysisSteps || this.defaultAnalysisSteps(plan),
      };
    }
    if (plan.intent === 'out_of_scope') {
      return {
        answer: OUT_OF_SCOPE_MESSAGE,
        scope: 'out_of_scope',
        queryPlan: plan,
        confidence: 'high',
      };
    }
    if (plan.needsClarification || plan.answerMode === 'clarify') {
      return {
        answer:
          plan.clarificationQuestion ||
          'I can answer that from the dashboard, but I need one more detail first. Which date range or metric should I use?',
        scope: 'dashboard',
        queryPlan: plan,
        confidence: 'needs_clarification',
      };
    }
    if (plan.answerMode === 'unsupported') {
      return {
        answer:
          plan.clarificationQuestion ||
          'That is related to WOOF, but this chatbot can only compute metrics that are already available through the dashboard data. Please ask about sales, orders, quantity sold, sectors, channels, top items, forecasts, or bundle recommendations.',
        scope: 'dashboard',
        queryPlan: plan,
        confidence: 'unsupported',
      };
    }

    const latestDate = await this.getLatestTransactionDate();
    if (!latestDate) {
      return {
        answer:
          'There is no uploaded transaction data yet, so I cannot compute a dashboard answer.',
        scope: 'dashboard',
        queryPlan: plan,
        confidence: 'high',
      };
    }

    const dateMatch = this.buildDateMatch(plan, latestDate);
    const baseMatch = {
      ...dateMatch,
      ...(plan.sector ? { sector: plan.sector } : {}),
      ...(plan.channel ? { channel: plan.channel } : {}),
    };

    const result = await this.executePlan(plan, baseMatch);
    const factualAnswer = this.renderAnswer(plan, result, latestDate);
    return {
      answer: await this.humanizeAnswer({
        question: cleanedQuestion,
        questionForPlanning,
        factualAnswer,
        plan,
        result,
        latestDate,
        history: conversationContext,
      }),
      scope: 'dashboard',
      queryPlan: {
        ...plan,
        nl2sql:
          'Claude-generated NL2SQL plan validated by backend allowlists, then executed through controlled dashboard aggregations.',
      },
      data: result,
      confidence: 'high',
    };
  }

  private async planQuestion(question: string): Promise<QueryPlan> {
    const fallback = this.classifyQuestion(question);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { ...fallback, classifier: 'fallback' };
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model:
            process.env.ANTHROPIC_CHATBOT_MODEL ||
            process.env.ANTHROPIC_MODEL ||
            'claude-3-5-sonnet-latest',
          max_tokens: 900,
          temperature: 0,
          system:
            'You are the controlled NL2SQL planner for the WOOF dashboard chatbot. Return only valid JSON. Do not answer the user directly.',
          messages: [
            {
              role: 'user',
              content: this.buildPlannerPrompt(question),
            },
          ],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 15000,
        },
      );

      const parsed = this.parseJsonObject(this.extractAnthropicText(response.data));
      return this.validateClaudePlan(parsed, fallback, question);
    } catch {
      return { ...fallback, classifier: 'fallback' };
    }
  }

  private buildPlannerPrompt(question: string): string {
    return [
      'Think through the user question as a controlled WOOF dashboard analyst, then convert it into a safe query plan.',
      'Do not reveal private chain-of-thought. Return only the required JSON with short public analysisSteps.',
      'The chatbot is only allowed to answer WOOF dashboard questions about sales, revenue, orders, quantity sold, average order value, top items, sector breakdown, channel breakdown, forecasts, and bundle recommendations.',
      'If the question is not dashboard-related, set intent to "out_of_scope".',
      'Before selecting SQL, decide whether the question is answerable, ambiguous, unsupported, or needs a clarification question.',
      'Use answerMode "compute" only when the metric, dashboard domain, and date/range are clear enough to compute.',
      'Use answerMode "clarify" when the user mentions a month without year, asks "best" without enough context, asks a correction without prior context, or provides a vague metric like "performance" without saying sales/orders/quantity/channel/sector.',
      'Use answerMode "unsupported" when the topic is WOOF-related but not computable from the current dashboard aggregations.',
      'Allowed intents: total_revenue, total_orders, total_quantity, average_order_value, top_items, sector_breakdown, channel_breakdown, best_sector, best_channel, forecast_overview, cross_sell_overview, out_of_scope.',
      'Allowed dateRange values: today, yesterday, last_7_days, this_month, custom, all.',
      'For explicit dates, months, or years, set dateRange to "custom" and return dateStart/dateEnd in YYYY-MM-DD. Example: April 2025 means dateStart "2025-04-01" and dateEnd "2025-04-30".',
      'For exact dates, set dateStart and dateEnd to the same date. Example: April 13, 2023 means dateStart "2023-04-13" and dateEnd "2023-04-13".',
      'Allowed sectors: Cafe, Retail, Services.',
      'Allowed channels: POS, Shopee, TikTok Shop, PetHub.',
      'Allowed metrics: netSales, orders, quantity, avgOrderValue.',
      'Use this SQL-safe warehouse model for generatedSql only: fact_cross_channel_transactions(transaction_timestamp, transaction_id, product_id, service_id, channel_id, segment_id, quantity_sold, net_sales).',
      'Do not use DELETE, UPDATE, INSERT, DROP, ALTER, CREATE, TRUNCATE, raw user text, joins, subqueries, comments, or unlisted tables.',
      'analysisSteps must be 2 to 4 short audit-friendly phrases, not hidden reasoning. Example: ["Detected sales metric", "Detected exact date", "Mapped to total revenue aggregation"].',
      'Return exactly this JSON shape:',
      JSON.stringify({
        answerMode: 'compute',
        intent: 'total_revenue',
        metric: 'netSales',
        dateRange: 'today',
        dateStart: null,
        dateEnd: null,
        sector: null,
        channel: null,
        limit: 5,
        needsClarification: false,
        clarificationQuestion: null,
        analysisSteps: [
          'Detected revenue question',
          'Resolved date range',
          'Use controlled total revenue aggregation',
        ],
        warnings: [],
        generatedSql:
          'SELECT SUM(net_sales) AS revenue FROM fact_cross_channel_transactions WHERE transaction_timestamp >= :start AND transaction_timestamp <= :end;',
      }),
      `User question: ${question}`,
    ].join('\n');
  }

  private validateClaudePlan(
    value: Record<string, unknown>,
    fallback: QueryPlan,
    question: string,
  ): QueryPlan {
    const intent = this.allowedIntent(value.intent)
      ? value.intent
      : fallback.intent;
    const dateRange = this.allowedRange(value.dateRange)
      ? value.dateRange
      : fallback.dateRange;
    const explicitRange = this.extractExplicitDateRange(question);
    const dateStart =
      explicitRange?.dateStart ||
      this.safeIsoDate(value.dateStart) ||
      fallback.dateStart;
    const dateEnd =
      explicitRange?.dateEnd ||
      this.safeIsoDate(value.dateEnd) ||
      fallback.dateEnd;
    const normalizedDateRange =
      dateStart && dateEnd ? 'custom' : dateRange;
    const metric = this.allowedMetric(value.metric)
      ? value.metric
      : fallback.metric;
    const sector = this.allowedSector(value.sector)
      ? value.sector
      : fallback.sector;
    const channel = this.allowedChannel(value.channel)
      ? value.channel
      : fallback.channel;
    const limit =
      typeof value.limit === 'number'
        ? Math.min(Math.max(Math.round(value.limit), 1), 10)
        : fallback.limit;
    const generatedSql =
      typeof value.generatedSql === 'string' &&
      this.isSafeGeneratedSql(value.generatedSql)
        ? value.generatedSql
        : this.buildSqlPreview({
            intent,
            metric,
            dateRange: normalizedDateRange,
            sector,
            channel,
            limit,
            dateStart,
            dateEnd,
          });
    const answerMode = this.allowedAnswerMode(value.answerMode)
      ? value.answerMode
      : intent === 'out_of_scope'
        ? 'unsupported'
        : 'compute';
    const analysisSteps = Array.isArray(value.analysisSteps)
      ? value.analysisSteps
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim().slice(0, 140))
          .filter(Boolean)
          .slice(0, 4)
      : this.defaultAnalysisSteps({
          intent,
          metric,
          dateRange: normalizedDateRange,
          sector,
          channel,
          dateStart,
          dateEnd,
        });
    const warnings = Array.isArray(value.warnings)
      ? value.warnings
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim().slice(0, 160))
          .filter(Boolean)
          .slice(0, 4)
      : [];
    const clarificationFromClaude =
      typeof value.clarificationQuestion === 'string'
        ? value.clarificationQuestion.trim().slice(0, 240)
        : undefined;
    const backendClarification = this.getClarificationQuestion(question, {
      intent,
      metric,
      dateRange: normalizedDateRange,
      sector,
      channel,
      limit,
      dateStart,
      dateEnd,
      answerMode,
      needsClarification: Boolean(value.needsClarification),
    });
    const needsClarification =
      Boolean(backendClarification) ||
      Boolean(value.needsClarification) ||
      answerMode === 'clarify';

    return {
      intent,
      metric,
      dateRange: normalizedDateRange,
      sector,
      channel,
      limit,
      dateStart,
      dateEnd,
      generatedSql,
      answerMode: needsClarification ? 'clarify' : answerMode,
      needsClarification,
      clarificationQuestion: backendClarification || clarificationFromClaude,
      analysisSteps,
      warnings,
      classifier: 'claude',
    };
  }

  private classifyQuestion(question: string): QueryPlan {
    const q = this.normalizeQuestion(question);
    if (!this.isDashboardQuestion(q)) {
      return { intent: 'out_of_scope', dateRange: 'all', answerMode: 'unsupported' };
    }

    const dateRange = this.extractRange(q);
    const sector = this.extractSector(q);
    const channel = this.extractChannel(q);
    const limit = this.extractLimit(q);
    const explicitRange = this.extractExplicitDateRange(q) || {};
    const filters = { dateRange, sector, channel, ...explicitRange };

    if (/\b(forecast|predict|projection|projected|tomorrow|next week)\b/.test(q)) {
      return { intent: 'forecast_overview', answerMode: 'compute', ...filters };
    }
    if (/\b(bundle|cross[- ]?sell|market basket|pair|recommendation)\b/.test(q)) {
      return { intent: 'cross_sell_overview', answerMode: 'compute', ...filters };
    }
    if (/\btop|best selling|highest selling|most sold|popular\b/.test(q)) {
      return { intent: 'top_items', answerMode: 'compute', ...filters, limit };
    }
    if (/\bsector|cafe|retail|service|services\b/.test(q) && /\bbreakdown|mix|compare|by\b/.test(q)) {
      return { intent: 'sector_breakdown', answerMode: 'compute', ...filters };
    }
    if (/\bchannel|pos|shopee|tiktok|pethub\b/.test(q) && /\bbreakdown|mix|compare|by\b/.test(q)) {
      return { intent: 'channel_breakdown', answerMode: 'compute', ...filters };
    }
    if (/\b(best|highest|leading|top)\b/.test(q) && /\bsector\b/.test(q)) {
      return { intent: 'best_sector', answerMode: 'compute', ...filters };
    }
    if (/\b(best|highest|leading|top)\b/.test(q) && /\bchannel\b/.test(q)) {
      return { intent: 'best_channel', answerMode: 'compute', ...filters };
    }
    if (/\b(order|orders|transaction|transactions)\b/.test(q)) {
      return {
        intent: 'total_orders',
        metric: 'orders',
        answerMode: 'compute',
        ...filters,
      };
    }
    if (/\b(quantity|qty|units|sold)\b/.test(q)) {
      return {
        intent: 'total_quantity',
        metric: 'quantity',
        answerMode: 'compute',
        ...filters,
      };
    }
    if (/\b(aov|average order|avg order)\b/.test(q)) {
      return {
        intent: 'average_order_value',
        metric: 'avgOrderValue',
        answerMode: 'compute',
        ...filters,
      };
    }
    return {
      intent: 'total_revenue',
      metric: 'netSales',
      answerMode: 'compute',
      ...filters,
    };
  }

  private isDashboardQuestion(q: string): boolean {
    const allowedTerms = [
      'sale',
      'sales',
      'revenue',
      'make',
      'made',
      'earn',
      'earned',
      'order',
      'orders',
      'transaction',
      'transactions',
      'quantity',
      'sold',
      'item',
      'items',
      'product',
      'products',
      'sector',
      'channel',
      'cafe',
      'retail',
      'service',
      'services',
      'pos',
      'shopee',
      'tiktok',
      'pethub',
      'forecast',
      'demand',
      'predict',
      'projection',
      'bundle',
      'cross-sell',
      'market basket',
      'dashboard',
      'today',
      'yesterday',
      'week',
      'month',
      ...Object.keys(MONTHS),
    ];
    return allowedTerms.some((term) => q.includes(term));
  }

  private allowedIntent(value: unknown): value is DashboardIntent {
    return [
      'total_revenue',
      'total_orders',
      'total_quantity',
      'average_order_value',
      'top_items',
      'sector_breakdown',
      'channel_breakdown',
      'best_sector',
      'best_channel',
      'forecast_overview',
      'cross_sell_overview',
      'out_of_scope',
    ].includes(String(value));
  }

  private allowedRange(value: unknown): value is RangeKey {
    return [
      'today',
      'yesterday',
      'last_7_days',
      'this_month',
      'custom',
      'all',
    ].includes(String(value));
  }

  private allowedAnswerMode(value: unknown): value is AnswerMode {
    return ['compute', 'clarify', 'unsupported'].includes(String(value));
  }

  private allowedMetric(value: unknown): value is QueryPlan['metric'] {
    return ['netSales', 'orders', 'quantity', 'avgOrderValue'].includes(
      String(value),
    );
  }

  private allowedSector(value: unknown): value is QueryPlan['sector'] {
    return ['Cafe', 'Retail', 'Services'].includes(String(value));
  }

  private allowedChannel(value: unknown): value is QueryPlan['channel'] {
    return ['POS', 'Shopee', 'TikTok Shop', 'PetHub'].includes(String(value));
  }

  private isSafeGeneratedSql(sql: string): boolean {
    const normalized = sql.toLowerCase();
    const forbidden = [
      'delete',
      'update',
      'insert',
      'drop',
      'alter',
      'create',
      'truncate',
      '--',
      '/*',
      '*/',
      ';--',
    ];
    return (
      normalized.startsWith('select') &&
      normalized.includes('fact_cross_channel_transactions') &&
      !forbidden.some((term) => normalized.includes(term))
    );
  }

  private buildSqlPreview(plan: QueryPlan): string {
    const where =
      plan.dateRange === 'custom' && plan.dateStart && plan.dateEnd
        ? [
            `transaction_timestamp >= '${plan.dateStart}'`,
            `transaction_timestamp <= '${plan.dateEnd}'`,
          ]
        : [':date_range'];
    if (plan.sector) where.push(`segment_id = '${plan.sector}'`);
    if (plan.channel) where.push(`channel_id = '${plan.channel}'`);
    const whereClause = `WHERE ${where.join(' AND ')}`;

    if (plan.intent === 'top_items') {
      return `SELECT product_id, service_id, SUM(net_sales) AS revenue, SUM(quantity_sold) AS quantity FROM fact_cross_channel_transactions ${whereClause} GROUP BY product_id, service_id ORDER BY revenue DESC LIMIT ${plan.limit || 5};`;
    }
    if (plan.intent === 'sector_breakdown' || plan.intent === 'best_sector') {
      return `SELECT segment_id, SUM(net_sales) AS revenue, COUNT(DISTINCT transaction_id) AS orders, SUM(quantity_sold) AS quantity FROM fact_cross_channel_transactions ${whereClause} GROUP BY segment_id ORDER BY revenue DESC;`;
    }
    if (plan.intent === 'channel_breakdown' || plan.intent === 'best_channel') {
      return `SELECT channel_id, SUM(net_sales) AS revenue, COUNT(DISTINCT transaction_id) AS orders, SUM(quantity_sold) AS quantity FROM fact_cross_channel_transactions ${whereClause} GROUP BY channel_id ORDER BY revenue DESC;`;
    }
    if (plan.intent === 'total_orders') {
      return `SELECT COUNT(DISTINCT transaction_id) AS orders FROM fact_cross_channel_transactions ${whereClause};`;
    }
    if (plan.intent === 'total_quantity') {
      return `SELECT SUM(quantity_sold) AS quantity FROM fact_cross_channel_transactions ${whereClause};`;
    }
    if (plan.intent === 'average_order_value') {
      return `SELECT SUM(net_sales) / NULLIF(COUNT(DISTINCT transaction_id), 0) AS avg_order_value FROM fact_cross_channel_transactions ${whereClause};`;
    }
    return `SELECT SUM(net_sales) AS revenue, COUNT(DISTINCT transaction_id) AS orders, SUM(quantity_sold) AS quantity FROM fact_cross_channel_transactions ${whereClause};`;
  }

  private extractRange(q: string): RangeKey {
    if (this.extractExplicitDateRange(q)) return 'custom';
    if (/\byesterday\b/.test(q)) return 'yesterday';
    if (/\blast\s*7|7 days|week|weekly\b/.test(q)) return 'last_7_days';
    if (/\bmonth|monthly\b/.test(q)) return 'this_month';
    if (/\btoday|daily|now\b/.test(q)) return 'today';
    return 'last_7_days';
  }

  private extractExplicitDateRange(
    question: string,
  ): Pick<QueryPlan, 'dateStart' | 'dateEnd'> | null {
    const q = this.normalizeQuestion(question);
    const monthNames = Object.keys(MONTHS).join('|');
    const quarter = q.match(/\bq([1-4])\s+(20\d{2})\b/);
    if (quarter) {
      const quarterIndex = Number(quarter[1]) - 1;
      const year = Number(quarter[2]);
      const startMonth = quarterIndex * 3;
      return {
        dateStart: this.isoDate(new Date(year, startMonth, 1)),
        dateEnd: this.isoDate(new Date(year, startMonth + 3, 0)),
      };
    }

    const monthRange = q.match(
      new RegExp(`\\b(${monthNames})\\s+(?:to|until|through|hanggang|-)\\s+(${monthNames})\\s+(20\\d{2})\\b`),
    );
    if (monthRange) {
      const startMonth = MONTHS[monthRange[1]];
      const endMonth = MONTHS[monthRange[2]];
      const year = Number(monthRange[3]);
      return {
        dateStart: this.isoDate(new Date(year, startMonth, 1)),
        dateEnd: this.isoDate(new Date(year, endMonth + 1, 0)),
      };
    }

    const monthYear = q.match(new RegExp(`\\b(${monthNames})\\s+(20\\d{2})\\b`));
    if (monthYear) {
      const month = MONTHS[monthYear[1]];
      const year = Number(monthYear[2]);
      return {
        dateStart: this.isoDate(new Date(year, month, 1)),
        dateEnd: this.isoDate(new Date(year, month + 1, 0)),
      };
    }

    const monthDayYear = q.match(
      new RegExp(`\\b(${monthNames})\\s*(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+(20\\d{2})\\b`),
    );
    if (monthDayYear) {
      const month = MONTHS[monthDayYear[1]];
      const day = Number(monthDayYear[2]);
      const year = Number(monthDayYear[3]);
      const iso = this.validIsoDate(year, month, day);
      if (iso) {
        return { dateStart: iso, dateEnd: iso };
      }
    }

    const dayMonthYear = q.match(
      new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames})[,]?\\s+(20\\d{2})\\b`),
    );
    if (dayMonthYear) {
      const day = Number(dayMonthYear[1]);
      const month = MONTHS[dayMonthYear[2]];
      const year = Number(dayMonthYear[3]);
      const iso = this.validIsoDate(year, month, day);
      if (iso) {
        return { dateStart: iso, dateEnd: iso };
      }
    }

    const isoRange = q.match(
      /\b(20\d{2}-\d{2}-\d{2})\b.*\b(20\d{2}-\d{2}-\d{2})\b/,
    );
    if (isoRange) {
      return {
        dateStart: isoRange[1],
        dateEnd: isoRange[2],
      };
    }

    const isoDate = q.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    if (isoDate) {
      return {
        dateStart: isoDate[1],
        dateEnd: isoDate[1],
      };
    }

    const yearOnly = q.match(/\b(20\d{2})\b/);
    if (yearOnly) {
      const year = Number(yearOnly[1]);
      return {
        dateStart: `${year}-01-01`,
        dateEnd: `${year}-12-31`,
      };
    }

    return null;
  }

  private normalizeQuestion(question: string): string {
    let normalized = question.toLowerCase();
    Object.entries(MONTH_ALIASES).forEach(([local, english]) => {
      normalized = normalized.replace(new RegExp(`\\b${local}\\b`, 'g'), english);
    });
    return normalized
      .replace(/\bbenta\b/g, 'sales')
      .replace(/\bkita\b/g, 'revenue')
      .replace(/\bkinita\b/g, 'revenue')
      .replace(/\bkumita\b/g, 'revenue')
      .replace(/\bmagkano\b/g, 'revenue')
      .replace(/\bilan\b/g, 'count')
      .replace(/\bngayon\b/g, 'today')
      .replace(/\bkahapon\b/g, 'yesterday')
      .replace(/\blinggo\b/g, 'week')
      .replace(/\bbuwan\b/g, 'month')
      .replace(/\btaon\b/g, 'year');
  }

  private safeIsoDate(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return value;
  }

  private validIsoDate(
    year: number,
    monthIndex: number,
    day: number,
  ): string | null {
    const date = new Date(year, monthIndex, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== monthIndex ||
      date.getDate() !== day
    ) {
      return null;
    }
    return this.isoDate(date);
  }

  private isoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private extractSector(q: string): QueryPlan['sector'] {
    if (/\bcafe\b/.test(q)) return 'Cafe';
    if (/\bretail\b/.test(q)) return 'Retail';
    if (/\bservice|services\b/.test(q)) return 'Services';
    return undefined;
  }

  private extractChannel(q: string): QueryPlan['channel'] {
    if (/\bpos\b/.test(q)) return 'POS';
    if (/\bshopee\b/.test(q)) return 'Shopee';
    if (/\btiktok|tik tok\b/.test(q)) return 'TikTok Shop';
    if (/\bpethub|pet hub\b/.test(q)) return 'PetHub';
    return undefined;
  }

  private extractLimit(q: string): number {
    const match = q.match(/\btop\s+(\d+)/);
    const parsed = match ? Number(match[1]) : 5;
    return Math.min(Math.max(parsed || 5, 1), 10);
  }

  private getClarificationQuestion(
    question: string,
    plan: QueryPlan,
  ): string | undefined {
    const q = this.normalizeQuestion(question);
    const monthNames = Object.keys(MONTHS).join('|');
    const mentionsMonth = new RegExp(`\\b(${monthNames})\\b`).test(q);
    const mentionsYear = /\b20\d{2}\b/.test(q);
    const hasExplicitRange = Boolean(this.extractExplicitDateRange(q));
    if (mentionsMonth && !mentionsYear && !hasExplicitRange) {
      return 'Which year should I use for that month? For example, April 2023 or April 2026.';
    }

    if (
      /\b(performance|performing|kumusta|status|insight|overview)\b/.test(q) &&
      !/\b(sale|sales|revenue|order|orders|transaction|transactions|quantity|units|aov|average order|top|best|forecast|demand|bundle|breakdown)\b/.test(
        q,
      )
    ) {
      return 'Which dashboard metric should I check: sales/revenue, orders, quantity sold, average order value, top items, sector breakdown, channel breakdown, forecasts, or bundle recommendations?';
    }

    if (
      /\b(compare|versus|vs\.?|difference|growth|increase|decrease|trend)\b/.test(q) &&
      !/\b(breakdown|by sector|by channel)\b/.test(q)
    ) {
      return 'I can compute one dashboard metric at a time right now. Which exact comparison do you want, and what date ranges should I compare?';
    }

    if (
      plan.intent === 'top_items' &&
      /\b(top|best|popular)\b/.test(q) &&
      !/\b(item|items|product|products|selling|sold)\b/.test(q)
    ) {
      return 'When you say top or best, do you mean top-selling items, best sector, or best channel?';
    }

    return undefined;
  }

  private defaultAnalysisSteps(plan: QueryPlan): string[] {
    const steps = [`Mapped question to ${plan.intent.replace(/_/g, ' ')}`];
    if (plan.dateRange === 'custom' && plan.dateStart && plan.dateEnd) {
      steps.push(`Resolved date range ${plan.dateStart} to ${plan.dateEnd}`);
    } else {
      steps.push(`Using dashboard range ${plan.dateRange.replace(/_/g, ' ')}`);
    }
    if (plan.sector) steps.push(`Applied sector filter ${plan.sector}`);
    if (plan.channel) steps.push(`Applied channel filter ${plan.channel}`);
    steps.push('Use backend-validated dashboard aggregation');
    return steps.slice(0, 4);
  }

  private async executePlan(plan: QueryPlan, match: Record<string, unknown>) {
    if (plan.intent === 'top_items') {
      return this.getTopItems(match, plan.limit || 5);
    }
    if (plan.intent === 'sector_breakdown' || plan.intent === 'best_sector') {
      return this.getBreakdown(match, '$sector');
    }
    if (plan.intent === 'channel_breakdown' || plan.intent === 'best_channel') {
      return this.getBreakdown(match, '$channel');
    }
    if (plan.intent === 'forecast_overview') {
      return {
        message:
          'Forecast answers are limited to the forecast cards in the dashboard. Open Demand Forecasts for model-specific projected values.',
      };
    }
    if (plan.intent === 'cross_sell_overview') {
      return {
        message:
          'Bundle recommendation answers are limited to the Behavioral Bridges and Activation Layer cards.',
      };
    }
    return this.getTotals(match);
  }

  private async getTotals(match: Record<string, unknown>) {
    const [row] = await this.transactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$netSales' },
          orders: { $addToSet: '$transactionId' },
          quantity: { $sum: '$quantity' },
          rows: { $sum: 1 },
        },
      },
    ]);
    const orderCount = Array.isArray(row?.orders) ? row.orders.length : 0;
    const revenue = this.money(row?.revenue || 0);
    return {
      revenue,
      orders: orderCount,
      quantity: Number(row?.quantity) || 0,
      rows: Number(row?.rows) || 0,
      avgOrderValue: orderCount ? this.money(revenue / orderCount) : 0,
    };
  }

  private async getTopItems(match: Record<string, unknown>, limit: number) {
    return this.transactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$productName',
          revenue: { $sum: '$netSales' },
          quantity: { $sum: '$quantity' },
          orders: { $addToSet: '$transactionId' },
        },
      },
      { $addFields: { orderCount: { $size: '$orders' } } },
      { $sort: { revenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          name: '$_id',
          revenue: { $round: ['$revenue', 2] },
          quantity: 1,
          orderCount: 1,
        },
      },
    ]);
  }

  private async getBreakdown(match: Record<string, unknown>, groupBy: string) {
    return this.transactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$netSales' },
          orders: { $addToSet: '$transactionId' },
          quantity: { $sum: '$quantity' },
        },
      },
      { $addFields: { orderCount: { $size: '$orders' } } },
      { $sort: { revenue: -1 } },
      {
        $project: {
          _id: 0,
          label: '$_id',
          revenue: { $round: ['$revenue', 2] },
          orderCount: 1,
          quantity: 1,
        },
      },
    ]);
  }

  private renderAnswer(plan: QueryPlan, result: any, latestDate: Date): string {
    const rangeLabel = this.rangeLabel(plan, latestDate);
    const filters = this.filterLabel(plan);
    if (plan.intent === 'forecast_overview' || plan.intent === 'cross_sell_overview') {
      return result.message;
    }
    if (plan.intent === 'top_items') {
      if (!result.length) return `No item sales found for ${rangeLabel}${filters}.`;
      const items = result
        .slice(0, plan.limit || 5)
        .map(
          (item: any, index: number) =>
            `${index + 1}. ${item.name}: ${this.currency(item.revenue)} revenue, ${item.quantity} units`,
        )
        .join('\n');
      return `Top items for ${rangeLabel}${filters}:\n${items}`;
    }
    if (plan.intent === 'sector_breakdown' || plan.intent === 'channel_breakdown') {
      if (!result.length) return `No breakdown data found for ${rangeLabel}${filters}.`;
      return result
        .map(
          (row: any) =>
            `${row.label || 'Unknown'}: ${this.currency(row.revenue)} revenue, ${row.orderCount} orders, ${row.quantity} units`,
        )
        .join('\n');
    }
    if (plan.intent === 'best_sector' || plan.intent === 'best_channel') {
      const best = result[0];
      if (!best) return `No data found for ${rangeLabel}${filters}.`;
      return `The leading ${plan.intent === 'best_sector' ? 'sector' : 'channel'} for ${rangeLabel}${filters} is ${best.label}, with ${this.currency(best.revenue)} revenue, ${best.orderCount} orders, and ${best.quantity} units sold.`;
    }
    if (typeof result?.rows === 'number' && result.rows === 0) {
      return `No matching dashboard records were found for ${rangeLabel}${filters}.`;
    }
    if (plan.intent === 'total_orders') {
      return `For ${rangeLabel}${filters}, there are ${result.orders} orders/transactions.`;
    }
    if (plan.intent === 'total_quantity') {
      return `For ${rangeLabel}${filters}, total quantity sold is ${result.quantity} units.`;
    }
    if (plan.intent === 'average_order_value') {
      return `For ${rangeLabel}${filters}, average order value is ${this.currency(result.avgOrderValue)}.`;
    }
    return `For ${rangeLabel}${filters}, total sales/revenue is ${this.currency(result.revenue)} from ${result.orders} orders and ${result.quantity} units sold.`;
  }

  private async getLatestTransactionDate(): Promise<Date | null> {
    const [row] = await this.transactionModel.aggregate([
      { $group: { _id: null, latestDate: { $max: '$date' } } },
    ]);
    return row?.latestDate ? new Date(row.latestDate) : null;
  }

  private buildDateMatch(plan: QueryPlan, latestDate: Date) {
    const range = plan.dateRange;
    if (range === 'all') return {};
    if (range === 'custom' && plan.dateStart && plan.dateEnd) {
      return {
        date: {
          $gte: this.startOfDay(new Date(plan.dateStart)),
          $lte: this.endOfDay(new Date(plan.dateEnd)),
        },
      };
    }
    const end = this.endOfDay(latestDate);
    if (range === 'today') {
      return { date: { $gte: this.startOfDay(latestDate), $lte: end } };
    }
    if (range === 'yesterday') {
      const yesterday = new Date(latestDate);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        date: { $gte: this.startOfDay(yesterday), $lte: this.endOfDay(yesterday) },
      };
    }
    if (range === 'this_month') {
      const start = new Date(latestDate);
      start.setDate(1);
      return { date: { $gte: this.startOfDay(start), $lte: end } };
    }
    const start = new Date(latestDate);
    start.setDate(start.getDate() - 6);
    return { date: { $gte: this.startOfDay(start), $lte: end } };
  }

  private startOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
  }

  private endOfDay(date: Date): Date {
    const value = new Date(date);
    value.setHours(23, 59, 59, 999);
    return value;
  }

  private rangeLabel(plan: QueryPlan, latestDate: Date): string {
    const range = plan.dateRange;
    const date = latestDate.toISOString().slice(0, 10);
    if (range === 'custom' && plan.dateStart && plan.dateEnd) {
      return `${plan.dateStart} to ${plan.dateEnd}`;
    }
    if (range === 'today') return `the latest dashboard day (${date})`;
    if (range === 'yesterday') return 'the previous dashboard day';
    if (range === 'this_month') return 'the current dashboard month';
    if (range === 'all') return 'all uploaded dashboard data';
    return 'the last 7 dashboard days';
  }

  private filterLabel(plan: QueryPlan): string {
    const filters = [plan.sector, plan.channel].filter(Boolean);
    return filters.length ? ` for ${filters.join(' / ')}` : '';
  }

  private money(value: number): number {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  private currency(value: number): string {
    return `₱${this.money(value).toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private buildConversationContext(history: ChatHistoryItem[]): ChatHistoryItem[] {
    if (!Array.isArray(history)) return [];
    return history
      .filter(
        (item) =>
          (item?.sender === 'user' || item?.sender === 'woof') &&
          typeof item?.text === 'string' &&
          item.text.trim(),
      )
      .slice(-6)
      .map((item) => ({
        sender: item.sender,
        text: String(item.text).trim().slice(0, 500),
      }));
  }

  private resolveFollowUpQuestion(
    question: string,
    history: ChatHistoryItem[],
  ): string {
    const normalized = this.normalizeQuestion(question);
    const previousUserQuestion = this.findPreviousDashboardQuestion(history);
    if (!previousUserQuestion) return question;

    const asksToVerifyPrevious =
      /\b(is this accurate|is that accurate|accurate ba|tama ba|correct ba|sure ka|are you sure|verify|check that|check this)\b/.test(
        normalized,
      );
    if (asksToVerifyPrevious) {
      return `Recompute and verify this previous WOOF dashboard question: ${previousUserQuestion}`;
    }

    const hasExplicitRange = Boolean(this.extractExplicitDateRange(question));
    const hasDashboardMetric =
      /\b(sale|sales|revenue|order|orders|transaction|transactions|quantity|qty|units|sold|aov|average order|top|best|forecast|demand|bundle|item|items|product|products)\b/.test(
        normalized,
      );
    const looksLikeFollowUp =
      /^(how about|what about|and|then|next|same for|paano naman|eh yung|yung|for)\b/.test(
        normalized,
      ) ||
      hasExplicitRange ||
      Boolean(this.extractSector(normalized)) ||
      Boolean(this.extractChannel(normalized));

    if (!looksLikeFollowUp || hasDashboardMetric) return question;

    return [
      question,
      `Use the same WOOF dashboard metric and filters as this previous question: ${previousUserQuestion}`,
      'If the new message includes a date, sector, channel, or range, replace only that part with the new value.',
    ].join('\n');
  }

  private findPreviousDashboardQuestion(
    history: ChatHistoryItem[],
  ): string | undefined {
    return [...history]
      .reverse()
      .find(
        (item) =>
          item.sender === 'user' &&
          item.text &&
          this.isDashboardQuestion(this.normalizeQuestion(item.text)),
      )?.text;
  }

  private async humanizeAnswer(input: {
    question: string;
    questionForPlanning: string;
    factualAnswer: string;
    plan: QueryPlan;
    result: any;
    latestDate: Date;
    history: ChatHistoryItem[];
  }): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return input.factualAnswer;

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model:
            process.env.ANTHROPIC_CHATBOT_MODEL ||
            process.env.ANTHROPIC_MODEL ||
            'claude-3-5-sonnet-latest',
          max_tokens: 220,
          temperature: 0.2,
          system: [
            'You are WOOF, a friendly AI revenue assistant inside the Happy Tails dashboard.',
            'Reply conversationally, but only using the validated dashboard facts provided by the backend.',
            'Do not add new calculations, estimates, advice, or facts that are not in the factual answer.',
            'If the factual answer says no records were found, acknowledge it clearly and suggest checking another date or range.',
            'Keep the answer concise: 1 to 3 short sentences. No markdown tables.',
          ].join(' '),
          messages: [
            {
              role: 'user',
              content: [
                'Recent chat context:',
                input.history
                  .map((item) => `${item.sender === 'user' ? 'User' : 'WOOF'}: ${item.text}`)
                  .join('\n') || 'None',
                `Latest user question: ${input.question}`,
                `Validated planning question: ${input.questionForPlanning}`,
                `Validated backend answer: ${input.factualAnswer}`,
                `Validated intent: ${input.plan.intent}`,
                `Validated date range: ${this.rangeLabel(input.plan, input.latestDate)}`,
                'Write the final user-facing answer now.',
              ].join('\n'),
            },
          ],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 15000,
        },
      );
      const text = this.extractAnthropicText(response.data);
      return text || input.factualAnswer;
    } catch {
      return input.factualAnswer;
    }
  }

  private extractAnthropicText(data: any): string {
    const textBlocks = Array.isArray(data?.content)
      ? data.content
          .filter((block: any) => block?.type === 'text' && block?.text)
          .map((block: any) => block.text)
      : [];
    return textBlocks.join('\n').trim();
  }

  private parseJsonObject(text: string): Record<string, unknown> {
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return {};
      try {
        return JSON.parse(match[0]);
      } catch {
        return {};
      }
    }
  }
}
