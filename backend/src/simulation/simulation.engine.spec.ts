import {
  compare,
  recommendations,
  simulate,
  validateConfig,
} from './simulation.engine';
import type { SimConfig } from './simulation.types';
function config(overrides: Partial<SimConfig> = {}): SimConfig {
  return {
    name: 'Test',
    date: '2026-10-05',
    dayType: 'Weekday',
    openHour: 8,
    minutes: 240,
    seed: 123,
    customers: 30,
    staff: 2,
    cafeStaff: 1,
    stations: 2,
    cafeStations: 1,
    cashiers: 1,
    checkoutMinutes: 2,
    patience: 240,
    waitThreshold: 30,
    waitingCapacity: 100,
    walkInRate: 100,
    cancellationRate: 0,
    noShowRate: 0,
    lateRate: 0,
    lateMinutes: 15,
    serviceInventory: 100,
    cafeInventory: 100,
    paymentFailureRate: 0,
    randomEvents: false,
    randomEventRate: 10,
    arrivalWeights: [1, 0, 0, 0],
    services: [
      {
        id: 'Services:Grooming',
        name: 'Grooming',
        sector: 'Services',
        weight: 1,
        duration: 20,
        price: 500,
        inventoryUnits: 1,
        pets: 1,
      },
    ],
    events: [],
    ...overrides,
  };
}
describe('Operations What-If engine', () => {
  it('reproduces complete results and random events with the same seed', () => {
    const c = config({ randomEvents: true, randomEventRate: 100 });
    expect(simulate(c)).toEqual(simulate(c));
  });
  it('increased demand raises queue pressure', () => {
    expect(
      simulate(config({ customers: 60 })).metrics.avgQueue,
    ).toBeGreaterThan(simulate(config()).metrics.avgQueue);
  });
  it('absence reduces throughput', () => {
    const base = simulate(config());
    const reduced = simulate(
      config({
        events: [
          {
            id: 'absence',
            label: 'Absence',
            effect: 'staff',
            sector: 'Services',
            start: 0,
            duration: 240,
            value: -1,
          },
        ],
      }),
    );
    expect(reduced.metrics.served).toBeLessThan(base.metrics.served);
    expect(reduced.metrics.avgQueue).toBeGreaterThan(base.metrics.avgQueue);
  });
  it('additional staff cannot exceed station capacity', () => {
    const a = simulate(config({ staff: 2, stations: 2 }));
    const b = simulate(config({ staff: 3, stations: 2 }));
    expect(b.metrics.served).toBe(a.metrics.served);
    expect(b.metrics.revenue).toBe(a.metrics.revenue);
  });
  it('low demand does not create revenue when staff is added', () => {
    expect(simulate(config({ customers: 1, staff: 5 })).metrics.revenue).toBe(
      simulate(config({ customers: 1, staff: 2 })).metrics.revenue,
    );
  });
  it('cancelled appointments never enter service queues', () => {
    const r = simulate(config({ walkInRate: 0, cancellationRate: 100 }));
    expect(r.metrics.cancelled).toBe(30);
    expect(r.metrics.served).toBe(0);
    expect(r.metrics.maxQueue).toBe(0);
    expect(r.customers.every((p) => p.serviceStart === undefined)).toBe(true);
  });
  it('no-shows are excluded without affecting walk-ins', () => {
    const r = simulate(config({ walkInRate: 0, noShowRate: 100 }));
    expect(r.metrics.noShows).toBe(30);
    expect(
      simulate(config({ walkInRate: 100, noShowRate: 100 })).metrics.noShows,
    ).toBe(0);
  });
  it('equipment interruption reduces throughput', () => {
    const r = simulate(
      config({
        events: [
          {
            id: 'failure',
            label: 'Failure',
            effect: 'stations',
            sector: 'Services',
            start: 0,
            duration: 120,
            value: -2,
          },
        ],
      }),
    );
    expect(r.metrics.served).toBeLessThan(simulate(config()).metrics.served);
    expect(
      r.customers
        .filter((p) => p.serviceStart !== undefined)
        .every((p) => p.serviceStart! >= 120),
    ).toBe(true);
  });
  it('stock consumption and restocking affect actual starts', () => {
    const r = simulate(
      config({
        serviceInventory: 0,
        events: [
          {
            id: 'stock',
            label: 'Restock',
            effect: 'inventory',
            sector: 'Services',
            start: 120,
            duration: 1,
            value: 10,
          },
        ],
      }),
    );
    expect(r.metrics.served).toBeGreaterThan(0);
    expect(r.metrics.inventoryConsumed).toBe(10);
    expect(r.metrics.serviceStock).toBe(0);
    expect(
      r.customers
        .filter((p) => p.serviceStart !== undefined)
        .every((p) => p.serviceStart! >= 120),
    ).toBe(true);
  });
  it('failed payments never recognize revenue', () => {
    const r = simulate(config({ customers: 2, paymentFailureRate: 100 }));
    expect(r.metrics.revenue).toBe(0);
    expect(r.metrics.paymentFailures).toBe(2);
    expect(r.metrics.lostRevenue).toBe(1000);
  });
  it('accounts for every visit and respects utilization limits', () => {
    const r = simulate(config());
    expect(
      r.metrics.served +
        r.metrics.unserved +
        r.metrics.cancelled +
        r.metrics.noShows,
    ).toBe(r.metrics.demand);
    expect(r.metrics.revenue + r.metrics.lostRevenue).toBe(
      r.metrics.potentialRevenue,
    );
    expect(r.metrics.staffUtilization).toBeLessThanOrEqual(100);
    expect(r.metrics.stationUtilization).toBeLessThanOrEqual(100);
  });
  it('keeps Cafe and Services resources separate', () => {
    const r = simulate(
      config({
        staff: 0,
        services: [
          ...config().services,
          {
            id: 'Cafe:Coffee',
            name: 'Coffee',
            sector: 'Cafe',
            duration: 3,
            weight: 1,
            price: 100,
            inventoryUnits: 1,
            pets: 0,
          },
        ],
      }),
    );
    expect(
      r.customers
        .filter((p) => p.completed !== undefined)
        .every((p) => p.sector === 'Cafe'),
    ).toBe(true);
    expect(r.metrics.served).toBeGreaterThan(0);
  });
  it('compares absolute differences and handles zero baselines', () => {
    const b = simulate(config({ customers: 0 }));
    const w = simulate(config());
    const row = compare(b, w).find((r) => r.key === 'revenue')!;
    expect(row.percent).toBeNull();
    expect(row.difference).toBe(w.metrics.revenue);
  });
  it('uses counterfactual reruns for recommendations', () => {
    const r = simulate(config({ staff: 1 }));
    expect(
      recommendations(r, r).some((s) =>
        s.includes('Adding one pet-service staff member'),
      ),
    ).toBe(true);
  });
  it('rejects invalid and unbounded parameters', () => {
    expect(() => validateConfig(config({ customers: 1501 }))).toThrow();
    expect(() =>
      validateConfig(config({ arrivalWeights: [0, 0, 0, 0] })),
    ).toThrow();
    expect(() => validateConfig(config({ minutes: Infinity }))).toThrow();
  });
  it('pauses an in-progress service during equipment failure and resumes it', () => {
    const base = simulate(config({ customers: 1 }));
    const start = base.customers[0].serviceStart!;
    const changed = simulate(
      config({
        customers: 1,
        events: [
          {
            id: 'pause',
            label: 'Equipment outage',
            effect: 'stations',
            sector: 'Services',
            start: start + 5,
            duration: 30,
            value: -2,
          },
        ],
      }),
    );
    expect(changed.customers[0].serviceEnd).toBe(
      base.customers[0].serviceEnd! + 30,
    );
    expect(changed.metrics.revenue).toBe(base.metrics.revenue);
  });
  it('retains the worst waiting time after customers abandon the queue', () => {
    const result = simulate(config({ customers: 5, staff: 0, patience: 40 }));
    expect(result.metrics.maxWait).toBe(40);
    expect(result.metrics.abandoned).toBe(5);
  });
  it('can double walk-ins without multiplying appointments', () => {
    const event = {
      id: 'promo',
      label: 'Walk-in promotion',
      effect: 'demand' as const,
      sector: 'All' as const,
      start: 0,
      duration: 240,
      value: 2,
      audience: 'walkIn' as const,
    };
    expect(
      simulate(config({ events: [event], walkInRate: 100 })).metrics.demand,
    ).toBe(60);
    expect(
      simulate(config({ events: [event], walkInRate: 0 })).metrics.demand,
    ).toBe(30);
  });
  it('records per-minute states and actual paused service work for visual playback', () => {
    const base = simulate(config({ customers: 1 }));
    const start = base.customers[0].serviceStart!;
    const result = simulate(
      config({
        customers: 1,
        events: [
          {
            id: 'pause',
            label: 'Outage',
            effect: 'stations',
            sector: 'Services',
            start: start + 5,
            duration: 30,
            value: -2,
          },
        ],
      }),
    );
    expect(result.frames).toHaveLength(result.config.minutes + 1);
    const segments = result.customers[0].workSegments!;
    const pause = segments.find((s) => !s.working)!;
    expect(pause.start).toBe(start + 5);
    expect(pause.end).toBe(start + 35);
    expect(pause.processedStart).toBe(pause.processedEnd);
    expect(segments.at(-1)!.processedEnd).toBe(result.customers[0].duration);
  });
  it('injected future demand does not change earlier arrivals, payments or resource usage', () => {
    const base = simulate(
      config({
        customers: 20,
        arrivalWeights: [1, 1, 1, 1],
        paymentFailureRate: 20,
      }),
    );
    const altered = simulate(
      config({
        customers: 20,
        arrivalWeights: [1, 1, 1, 1],
        paymentFailureRate: 20,
        events: [
          {
            id: 'inject',
            label: 'Walk-in surge',
            effect: 'demand',
            sector: 'All',
            start: 120,
            duration: 60,
            value: 2,
          },
        ],
      }),
    );
    expect(altered.timeline.filter((e) => e.minute < 120)).toEqual(
      base.timeline.filter((e) => e.minute < 120),
    );
    for (let t = 0; t < 120; t++)
      for (const key of [
        'arrived',
        'served',
        'revenue',
        'paymentFailures',
        'waiting',
        'staffUtilization',
      ] as const)
        expect(altered.frames[t].metrics[key]).toBe(
          base.frames[t].metrics[key],
        );
  });
  it('visual progress traces do not change seeded operational results', () => {
    const result = simulate(config());
    for (const visit of result.customers.filter(
      (p) => p.serviceEnd !== undefined,
    )) {
      const segments = visit.workSegments!;
      expect(segments[0].start).toBe(visit.serviceStart);
      expect(segments.at(-1)!.end).toBe(visit.serviceEnd);
      expect(segments.at(-1)!.processedEnd).toBe(visit.duration);
    }
  });
});
