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
}

const OUT_OF_SCOPE_MESSAGE =
  'I can only answer questions related to the WOOF dashboard data, such as sales, orders, quantity sold, channels, sectors, top items, forecasts, and bundle recommendations.';

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
  october: 9,
  november: 10,
  december: 11,
};

@Injectable()
export class ChatbotService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async answer(question: string): Promise<any> {
    const cleanedQuestion = String(question || '').trim();
    if (!cleanedQuestion) {
      throw new BadRequestException('Question is required.');
    }

    const plan = await this.planQuestion(cleanedQuestion);
    if (plan.intent === 'out_of_scope') {
      return {
        answer: OUT_OF_SCOPE_MESSAGE,
        scope: 'out_of_scope',
        queryPlan: plan,
        confidence: 'high',
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
    return {
      answer: this.renderAnswer(plan, result, latestDate),
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
      'Convert the user question into a controlled dashboard SQL query plan.',
      'The chatbot is only allowed to answer WOOF dashboard questions about sales, revenue, orders, quantity sold, average order value, top items, sector breakdown, channel breakdown, forecasts, and bundle recommendations.',
      'If the question is not dashboard-related, set intent to "out_of_scope".',
      'Allowed intents: total_revenue, total_orders, total_quantity, average_order_value, top_items, sector_breakdown, channel_breakdown, best_sector, best_channel, forecast_overview, cross_sell_overview, out_of_scope.',
      'Allowed dateRange values: today, yesterday, last_7_days, this_month, custom, all.',
      'For explicit dates, months, or years, set dateRange to "custom" and return dateStart/dateEnd in YYYY-MM-DD. Example: April 2025 means dateStart "2025-04-01" and dateEnd "2025-04-30".',
      'Allowed sectors: Cafe, Retail, Services.',
      'Allowed channels: POS, Shopee, TikTok Shop, PetHub.',
      'Allowed metrics: netSales, orders, quantity, avgOrderValue.',
      'Use this SQL-safe warehouse model for generatedSql only: fact_cross_channel_transactions(transaction_timestamp, transaction_id, product_id, service_id, channel_id, segment_id, quantity_sold, net_sales).',
      'Do not use DELETE, UPDATE, INSERT, DROP, ALTER, CREATE, TRUNCATE, raw user text, joins, subqueries, comments, or unlisted tables.',
      'Return exactly this JSON shape:',
      JSON.stringify({
        intent: 'total_revenue',
        metric: 'netSales',
        dateRange: 'today',
        dateStart: null,
        dateEnd: null,
        sector: null,
        channel: null,
        limit: 5,
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
      this.safeIsoDate(value.dateStart) ||
      explicitRange?.dateStart ||
      fallback.dateStart;
    const dateEnd =
      this.safeIsoDate(value.dateEnd) ||
      explicitRange?.dateEnd ||
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
      classifier: 'claude',
    };
  }

  private classifyQuestion(question: string): QueryPlan {
    const q = question.toLowerCase();
    if (!this.isDashboardQuestion(q)) {
      return { intent: 'out_of_scope', dateRange: 'all' };
    }

    const dateRange = this.extractRange(q);
    const sector = this.extractSector(q);
    const channel = this.extractChannel(q);
    const limit = this.extractLimit(q);
    const explicitRange = this.extractExplicitDateRange(q) || {};
    const filters = { dateRange, sector, channel, ...explicitRange };

    if (/\b(forecast|predict|projection|projected|tomorrow|next week)\b/.test(q)) {
      return { intent: 'forecast_overview', ...filters };
    }
    if (/\b(bundle|cross[- ]?sell|market basket|pair|recommendation)\b/.test(q)) {
      return { intent: 'cross_sell_overview', ...filters };
    }
    if (/\btop|best selling|highest selling|most sold|popular\b/.test(q)) {
      return { intent: 'top_items', ...filters, limit };
    }
    if (/\bsector|cafe|retail|service|services\b/.test(q) && /\bbreakdown|mix|compare|by\b/.test(q)) {
      return { intent: 'sector_breakdown', ...filters };
    }
    if (/\bchannel|pos|shopee|tiktok|pethub\b/.test(q) && /\bbreakdown|mix|compare|by\b/.test(q)) {
      return { intent: 'channel_breakdown', ...filters };
    }
    if (/\b(best|highest|leading|top)\b/.test(q) && /\bsector\b/.test(q)) {
      return { intent: 'best_sector', ...filters };
    }
    if (/\b(best|highest|leading|top)\b/.test(q) && /\bchannel\b/.test(q)) {
      return { intent: 'best_channel', ...filters };
    }
    if (/\b(order|orders|transaction|transactions)\b/.test(q)) {
      return {
        intent: 'total_orders',
        metric: 'orders',
        ...filters,
      };
    }
    if (/\b(quantity|qty|units|sold)\b/.test(q)) {
      return {
        intent: 'total_quantity',
        metric: 'quantity',
        ...filters,
      };
    }
    if (/\b(aov|average order|avg order)\b/.test(q)) {
      return {
        intent: 'average_order_value',
        metric: 'avgOrderValue',
        ...filters,
      };
    }
    return {
      intent: 'total_revenue',
      metric: 'netSales',
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
    const q = question.toLowerCase();
    const monthNames = Object.keys(MONTHS).join('|');
    const monthYear = q.match(new RegExp(`\\b(${monthNames})\\s+(20\\d{2})\\b`));
    if (monthYear) {
      const month = MONTHS[monthYear[1]];
      const year = Number(monthYear[2]);
      return {
        dateStart: this.isoDate(new Date(year, month, 1)),
        dateEnd: this.isoDate(new Date(year, month + 1, 0)),
      };
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

  private safeIsoDate(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return value;
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
