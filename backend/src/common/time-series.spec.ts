import { normalizeDailySeries } from './time-series';

describe('normalizeDailySeries', () => {
  it('fills missing dates and applies the Cafe EMA alpha', () => {
    const result = normalizeDailySeries(
      [
        { date: '2026-01-01', actual: 100, orders: 1 },
        { date: '2026-01-03', actual: 200, orders: 2 },
      ],
      'Cafe',
    );

    expect(result).toEqual([
      {
        date: '2026-01-01',
        actual: 100,
        orders: 1,
        normalized: 100,
        isMissingDate: false,
      },
      {
        date: '2026-01-02',
        actual: 0,
        orders: 0,
        normalized: 70,
        isMissingDate: true,
      },
      {
        date: '2026-01-03',
        actual: 200,
        orders: 2,
        normalized: 109,
        isMissingDate: false,
      },
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
      {
        date: '2026-01-01',
        actual: 123.45,
        orders: 2,
        normalized: 123.45,
        isMissingDate: false,
      },
    ]);
  });
});
