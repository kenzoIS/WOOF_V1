export type ForecastModule = 'Cafe' | 'Services';

export interface DailyValue {
  date: string;
  /** Physical demand volume: items sold for Cafe/Retail, bookings for Services. */
  actual: number;
  orders: number;
}

export interface NormalizedDailyValue extends DailyValue {
  normalized: number;
  isMissingDate: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function normalizeDailySeries(
  values: DailyValue[],
  module: ForecastModule,
): NormalizedDailyValue[] {
  if (values.length === 0) return [];

  const alpha = module === 'Cafe' ? 0.3 : 0.4;
  const byDate = new Map(
    values.map((value) => [
      value.date,
      {
        actual: Number.isFinite(value.actual) ? value.actual : 0,
        orders: Number.isFinite(value.orders) ? value.orders : 0,
      },
    ]),
  );
  const sortedDates = [...byDate.keys()].sort();
  const start = new Date(`${sortedDates[0]}T00:00:00.000Z`).getTime();
  const end = new Date(
    `${sortedDates[sortedDates.length - 1]}T00:00:00.000Z`,
  ).getTime();

  const output: NormalizedDailyValue[] = [];
  let ema: number | null = null;

  for (let timestamp = start; timestamp <= end; timestamp += DAY_MS) {
    const date = new Date(timestamp).toISOString().slice(0, 10);
    const existing = byDate.get(date);
    const actual = existing?.actual ?? 0;
    ema = ema === null ? actual : alpha * actual + (1 - alpha) * ema;
    output.push({
      date,
      actual: round(actual),
      orders: existing?.orders ?? 0,
      normalized: round(ema),
      isMissingDate: !existing,
    });
  }

  return output;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
