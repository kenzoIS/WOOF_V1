import { Model } from 'mongoose';
import { TransactionDocument } from '../csv/schemas/transaction.schema';
export declare class AnalyticsService {
    private transactionModel;
    constructor(transactionModel: Model<TransactionDocument>);
    getDashboard(sector: string): Promise<any>;
    getForecast(sector: string): Promise<any>;
    getCrossSell(): Promise<any>;
    getRetailForecastByChannel(): Promise<any>;
    private normalizeSector;
}
