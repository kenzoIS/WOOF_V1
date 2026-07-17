import {
  buildDailyValuesFromTransactionLines,
  normalizeDailySeries,
} from './time-series';

describe('normalizeDailySeries', () => {
  it('fills missing dates and applies the Cafe EMA alpha to unit volume', () => {
    const result = normalizeDailySeries(
      [
        { date: '2026-01-01', actual: 100, orders: 1 },
        { date: '2026-01-03', actual: 200, orders: 2 },
      ],
      'Cafe',
    );

    expect(result).toEqual([
      expect.objectContaining({
        date: '2026-01-01',
        actual: 100,
        orders: 1,
        normalized: 100,
        isMissingDate: false,
        isTrueZeroDay: false,
        isClosedDay: false,
        isObservedDemand: true,
      }),
      expect.objectContaining({
        date: '2026-01-02',
        actual: 0,
        orders: 0,
        normalized: 100,
        isMissingDate: true,
        isTrueZeroDay: false,
        isClosedDay: true,
        isObservedDemand: false,
      }),
      expect.objectContaining({
        date: '2026-01-03',
        actual: 200,
        orders: 2,
        normalized: 130,
        isMissingDate: false,
      }),
    ]);
  });

  it('uses the more responsive Services EMA alpha', () => {
    const result = normalizeDailySeries(
      [
        { date: '2026-01-01', actual: 100, orders: 1 },
        { date: '2026-01-02', actual: 200, orders: 1 },
      ],
      'Services',
    );

    expect(result[1].normalized).toBe(140);
  });

  it('fills a 2-day gap without changing existing actual values', () => {
    const result = normalizeDailySeries(
      [
        { date: '2026-01-01', actual: 100, orders: 1 },
        { date: '2026-01-02', actual: 125, orders: 2 },
        { date: '2026-01-05', actual: 150, orders: 3 },
        { date: '2026-01-06', actual: 175, orders: 4 },
        { date: '2026-01-07', actual: 200, orders: 5 },
      ],
      'Cafe',
    );

    expect(result).toHaveLength(7);
    expect(result[2]).toEqual(
      expect.objectContaining({
        date: '2026-01-03',
        actual: 0,
        isMissingDate: true,
      }),
    );
    expect(result[3]).toEqual(
      expect.objectContaining({
        date: '2026-01-04',
        actual: 0,
        isMissingDate: true,
      }),
    );
    expect(
      result
        .filter((point) => !point.isMissingDate)
        .map((point) => point.actual),
    ).toEqual([100, 125, 150, 175, 200]);
  });

  it('returns an empty array for empty input', () => {
    expect(normalizeDailySeries([], 'Cafe')).toEqual([]);
  });

  it('normalizes a single data point to its actual value', () => {
    const result = normalizeDailySeries(
      [{ date: '2026-01-01', actual: 123.45, orders: 2 }],
      'Services',
    );

    expect(result).toEqual([
      expect.objectContaining({
        date: '2026-01-01',
        actual: 123.45,
        orders: 2,
        normalized: 123.45,
        isMissingDate: false,
      }),
    ]);
  });

  it('treats zero rows as closed days instead of observed zero-demand days', () => {
    const result = normalizeDailySeries(
      [
        { date: '2026-01-01', actual: 0, orders: 0 },
        { date: '2026-01-02', actual: 100, orders: 1 },
        { date: '2026-01-03', actual: 0, orders: 0 },
        { date: '2026-01-04', actual: 200, orders: 2 },
      ],
      'Cafe',
    );

    expect(result[0]).toEqual(
      expect.objectContaining({
        normalized: 0,
        isClosedDay: true,
        isObservedDemand: false,
        isTrueZeroDay: false,
      }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        normalized: 100,
        isClosedDay: false,
        isObservedDemand: true,
      }),
    );
    expect(result[2]).toEqual(
      expect.objectContaining({
        normalized: 100,
        isClosedDay: true,
        isObservedDemand: false,
      }),
    );
    expect(result[3].normalized).toBe(130);
  });

  it('builds a transaction/day layer from raw line items', () => {
    const result = buildDailyValuesFromTransactionLines(
      [
        {
          date: '2026-01-01T09:00:00+08:00',
          transactionId: 'A',
          productName: 'Latte',
          quantity: 2,
          netSales: 200,
        },
        {
          date: '2026-01-01T09:00:00+08:00',
          transactionId: 'A',
          productName: 'Cookie',
          quantity: 1,
          netSales: 80,
          discount: 10,
        },
        {
          date: '2026-01-01T10:00:00+08:00',
          transactionId: 'B',
          productName: 'Grooming',
          quantity: 1,
          netSales: 500,
        },
      ],
      'Cafe',
    );

    expect(result).toEqual([
      expect.objectContaining({
        date: '2026-01-01',
        actual: 4,
        orders: 2,
        revenue: 780,
        lineItems: 3,
        basketItems: 3,
        avgBasketSize: 1.5,
        avgOrderValue: 390,
        promoTransactions: 1,
      }),
    ]);
  });

  it('uses Services transaction counts as bookings instead of line-item quantity', () => {
    const result = buildDailyValuesFromTransactionLines(
      [
        {
          date: '2026-01-01',
          transactionId: 'booking-1',
          productName: 'Full Grooming',
          quantity: 3,
          netSales: 900,
        },
        {
          date: '2026-01-01',
          transactionId: 'booking-1',
          productName: 'Nail Trim',
          quantity: 1,
          netSales: 150,
        },
      ],
      'Services',
    );

    expect(result[0]).toEqual(
      expect.objectContaining({
        actual: 1,
        orders: 1,
      }),
    );
  });

  it('caps extreme spikes for the normalized signal while preserving raw actuals', () => {
    const result = normalizeDailySeries(
      [
        { date: '2026-01-01', actual: 10, orders: 1 },
        { date: '2026-01-02', actual: 11, orders: 1 },
        { date: '2026-01-03', actual: 12, orders: 1 },
        { date: '2026-01-04', actual: 13, orders: 1 },
        { date: '2026-01-05', actual: 14, orders: 1 },
        { date: '2026-01-06', actual: 15, orders: 1 },
        { date: '2026-01-07', actual: 1000, orders: 1 },
      ],
      'Cafe',
    );

    const spike = result[result.length - 1];
    expect(spike.actual).toBe(1000);
    expect(spike.rawActual).toBe(1000);
    expect(spike.isOutlier).toBe(true);
    expect(spike.cappedActual).toBeLessThan(1000);
    expect(spike.normalized).toBeLessThan(320);
  });
});
