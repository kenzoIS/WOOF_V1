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
});
