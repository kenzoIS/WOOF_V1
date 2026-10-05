import { ENGINE_VERSION, simulate, compare } from './simulation.engine';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
function setup() {
  const queries: any[] = [];
  const items = [
    {
      _id: { name: 'Grooming', sector: 'Services' },
      quantity: 10,
      revenue: 5000,
      orders: ['1', '2'],
    },
    {
      _id: { name: 'Coffee', sector: 'Cafe' },
      quantity: 10,
      revenue: 1000,
      orders: ['3', '4'],
    },
  ];
  const transactions: any = {
    findOne: () => ({
      sort: () => ({
        select: () => ({
          lean: async () => ({ date: new Date('2026-10-04T18:00:00Z') }),
        }),
      }),
    }),
    aggregate: jest.fn(async (pipeline: any) => {
      queries.push(pipeline);
      if (pipeline.some((p: any) => p.$limit)) return items;
      if (pipeline.some((p: any) => p.$count)) return [{ count: 60 }];
      return [
        { _id: 8, count: 10 },
        { _id: 9, count: 20 },
      ];
    }),
  };
  const runs: any = {
    findOne: jest.fn(() => ({ lean: async () => null })),
    create: jest.fn(),
    find: jest.fn(),
  };
  const analytics: any = {
    getTrafficOptimizer: jest.fn(async () => ({
      todayContext: {
        hourlyForecast: [
          {
            hour: 8,
            sectorVisits: { Services: { visits: 8 }, Cafe: { visits: 2 } },
          },
          {
            hour: 9,
            sectorVisits: { Services: { visits: 4 }, Cafe: { visits: 6 } },
          },
        ],
      },
    })),
  };
  return {
    service: new SimulationService(transactions, runs, analytics),
    transactions,
    runs,
    analytics,
    queries,
  };
}
describe('Simulation input integration and access', () => {
  it('derives physical demand and prices, with Manila dates and explicit assumptions', async () => {
    const { service, queries } = setup();
    const inputs = await service.inputs('historical', '2026-10-05');
    expect(inputs.endDate).toBe('2026-10-05');
    expect(inputs.config.customers).toBe(2);
    expect(inputs.config.services[0].price).toBe(500);
    expect(inputs.warnings.join(' ')).toContain('assumptions');
    expect(queries[0][0].$match.channel.$in).toEqual(['POS', 'PetHub']);
    expect(inputs.config.arrivalWeights.slice(0, 2)).toEqual([10, 20]);
  });
  it('uses forecast arrivals and sector demand shares', async () => {
    const { service, analytics } = setup();
    const inputs = await service.inputs('forecast', '2026-10-05');
    expect(analytics.getTrafficOptimizer).toHaveBeenCalledWith(
      expect.objectContaining({ referenceDate: '2026-10-05' }),
    );
    expect(inputs.config.customers).toBe(20);
    expect(inputs.config.arrivalWeights.slice(0, 2)).toEqual([10, 10]);
    expect(
      inputs.config.services.find((s) => s.sector === 'Services')!.weight,
    ).toBe(12);
    expect(
      inputs.config.services.find((s) => s.sector === 'Cafe')!.weight,
    ).toBe(8);
  });
  it('rejects invalid date windows rather than using unfiltered history', async () => {
    const { service } = setup();
    await expect(
      service.inputs('historical', '2026-10-05', '2026-10-06', '2026-10-05'),
    ).rejects.toThrow();
  });
  it('scopes saved-run reads to the authenticated owner', async () => {
    const { service, runs } = setup();
    await expect(
      service.reopen('507f1f77bcf86cd799439011', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(runs.findOne).toHaveBeenCalledWith({
      _id: '507f1f77bcf86cd799439011',
      userId: 'user-1',
    });
  });
  it('rejects missing and expired login sessions before querying data', async () => {
    const simulation: any = { inputs: jest.fn() };
    const supabase: any = {
      client: {
        auth: {
          getUser: jest.fn(async () => ({
            data: { user: null },
            error: new Error('expired'),
          })),
        },
      },
    };
    const controller = new SimulationController(simulation, supabase);
    await expect(
      controller.inputs('', 'historical', '2026-10-05'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      controller.inputs('Bearer expired', 'historical', '2026-10-05'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(simulation.inputs).not.toHaveBeenCalled();
  });
  it('injects into the owned saved run at the requested time, preserving the original', async () => {
    const { service, transactions, runs } = setup();
    const inputs = await service.inputs('historical', '2026-10-05');
    const baseline = simulate(inputs.config),
      whatIf = simulate({ ...inputs.config, name: 'What-If' });
    const saved = {
      engineVersion: ENGINE_VERSION,
      inputs,
      baseline,
      whatIf,
      comparison: compare(baseline, whatIf),
      recommendations: [],
    };
    const original = structuredClone(saved);
    runs.findOne.mockReturnValue({ lean: async () => saved });
    transactions.aggregate.mockResolvedValue(
      inputs.config.services.map((s) => ({
        _id: { name: s.name, sector: s.sector },
      })),
    );
    runs.create.mockImplementation(async (body) => ({
      ...body,
      _id: '507f1f77bcf86cd799439012',
      createdAt: new Date('2026-10-05'),
    }));
    const next = await service.inject(
      '507f1f77bcf86cd799439011',
      'user-1',
      'owner@example.test',
      120,
      {
        id: 'injected',
        label: 'Absent',
        effect: 'staff',
        sector: 'Services',
        start: 0,
        duration: 60,
        value: -1,
      },
    );
    expect(saved).toEqual(original);
    expect(next.baseline).toEqual(baseline);
    expect(next.whatIf.config.events.at(-1)!.start).toBe(120);
    expect(next.whatIf.frames[120].serviceStaff).toBe(2);
    expect(runs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        createdBy: 'owner@example.test',
      }),
    );
  });
});
