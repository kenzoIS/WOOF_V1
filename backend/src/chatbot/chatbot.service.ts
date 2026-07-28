import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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

type RangeKey = 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'all';

interface QueryPlan {
  intent: DashboardIntent;
  metric?: 'netSales' | 'orders' | 'quantity' | 'avgOrderValue';
  dateRange: RangeKey;
  sector?: 'Cafe' | 'Retail' | 'Services';
  channel?: 'POS' | 'Shopee' | 'TikTok Shop' | 'PetHub';
  limit?: number;
}

const OUT_OF_SCOPE_MESSAGE =
  'I can only answer questions related to the WOOF dashboard data, such as sales, orders, quantity sold, channels, sectors, top items, forecasts, and bundle recommendations.';

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

    const plan = this.classifyQuestion(cleanedQuestion);
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

    const dateMatch = this.buildDateMatch(plan.dateRange, latestDate);
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
          'Controlled query plan mapped to whitelisted MongoDB aggregations over dashboard transaction fields.',
      },
      data: result,
      confidence: 'high',
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

    if (/\b(forecast|predict|projection|projected|tomorrow|next week)\b/.test(q)) {
      return { intent: 'forecast_overview', dateRange, sector, channel };
    }
    if (/\b(bundle|cross[- ]?sell|market basket|pair|recommendation)\b/.test(q)) {
      return { intent: 'cross_sell_overview', dateRange, sector, channel };
    }
    if (/\btop|best selling|highest selling|most sold|popular\b/.test(q)) {
      return { intent: 'top_items', dateRange, sector, channel, limit };
    }
    if (/\bsector|cafe|retail|service|services\b/.test(q) && /\bbreakdown|mix|compare|by\b/.test(q)) {
      return { intent: 'sector_breakdown', dateRange, sector, channel };
    }
    if (/\bchannel|pos|shopee|tiktok|pethub\b/.test(q) && /\bbreakdown|mix|compare|by\b/.test(q)) {
      return { intent: 'channel_breakdown', dateRange, sector, channel };
    }
    if (/\b(best|highest|leading|top)\b/.test(q) && /\bsector\b/.test(q)) {
      return { intent: 'best_sector', dateRange, sector, channel };
    }
    if (/\b(best|highest|leading|top)\b/.test(q) && /\bchannel\b/.test(q)) {
      return { intent: 'best_channel', dateRange, sector, channel };
    }
    if (/\b(order|orders|transaction|transactions)\b/.test(q)) {
      return {
        intent: 'total_orders',
        metric: 'orders',
        dateRange,
        sector,
        channel,
      };
    }
    if (/\b(quantity|qty|units|sold)\b/.test(q)) {
      return {
        intent: 'total_quantity',
        metric: 'quantity',
        dateRange,
        sector,
        channel,
      };
    }
    if (/\b(aov|average order|avg order)\b/.test(q)) {
      return {
        intent: 'average_order_value',
        metric: 'avgOrderValue',
        dateRange,
        sector,
        channel,
      };
    }
    return {
      intent: 'total_revenue',
      metric: 'netSales',
      dateRange,
      sector,
      channel,
    };
  }

  private isDashboardQuestion(q: string): boolean {
    const allowedTerms = [
      'sale',
      'sales',
      'revenue',
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
    ];
    return allowedTerms.some((term) => q.includes(term));
  }

  private extractRange(q: string): RangeKey {
    if (/\byesterday\b/.test(q)) return 'yesterday';
    if (/\blast\s*7|7 days|week|weekly\b/.test(q)) return 'last_7_days';
    if (/\bmonth|monthly\b/.test(q)) return 'this_month';
    if (/\btoday|daily|now\b/.test(q)) return 'today';
    return 'last_7_days';
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
    const rangeLabel = this.rangeLabel(plan.dateRange, latestDate);
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

  private buildDateMatch(range: RangeKey, latestDate: Date) {
    if (range === 'all') return {};
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

  private rangeLabel(range: RangeKey, latestDate: Date): string {
    const date = latestDate.toISOString().slice(0, 10);
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
}
