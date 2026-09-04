import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const service = Object.create(AnalyticsService.prototype) as any;

  it('selects the segmented Cafe candidate when its MASE is lower than aggregate', async () => {
    service.buildCafeSegmentedForecastCandidate = jest.fn().mockResolvedValue({
      modelName: 'Segmented Cafe Category Prophet (summed category forecasts)',
      mase: 0.4,
      smape: 20.3,
      accuracy: 79.7,
      forecast: [],
      modelMetadata: { useSegmentedCafeForecast: true },
    });

    const selected = await service.selectCafeForecastCandidate(
      {
        modelName: 'Prophet aggregate',
        mase: 0.56,
        smape: 14.18,
        accuracy: 85.82,
        forecast: [],
        modelMetadata: {},
      },
      [],
      30,
      '90-5-5',
      {},
    );

    expect(selected.model.modelName).toContain('Segmented Cafe Category');
    expect(selected.model.mase).toBe(0.4);
    expect(selected.model.modelMetadata.forecastSelection).toBe('segmented_cafe_category');
  });

  it('keeps the aggregate Cafe candidate when segmentation is worse', async () => {
    service.buildCafeSegmentedForecastCandidate = jest.fn().mockResolvedValue({
      modelName: 'Segmented Cafe Category Prophet (summed category forecasts)',
      mase: 0.8,
      smape: 30,
      accuracy: 70,
      forecast: [],
      modelMetadata: { useSegmentedCafeForecast: true },
    });

    const selected = await service.selectCafeForecastCandidate(
      {
        modelName: 'Prophet aggregate',
        mase: 0.56,
        smape: 14.18,
        accuracy: 85.82,
        forecast: [],
        modelMetadata: {},
      },
      [],
      30,
      '90-5-5',
      {},
    );

    expect(selected.model.modelName).toBe('Prophet aggregate');
    expect(selected.model.mase).toBe(0.56);
    expect(selected.model.modelMetadata.forecastSelection).toBe('aggregate_cafe');
  });
});
