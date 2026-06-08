import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(sector: string): Promise<any>;
    getForecast(sector: string): Promise<any>;
    getRetailForecastByChannel(): Promise<any>;
    getCrossSell(): Promise<any>;
}
