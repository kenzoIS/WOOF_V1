import { Model } from 'mongoose';
import { CsvUploadDocument } from './schemas/csv-upload.schema';
import { TransactionDocument } from './schemas/transaction.schema';
export declare class CsvService {
    private csvUploadModel;
    private transactionModel;
    constructor(csvUploadModel: Model<CsvUploadDocument>, transactionModel: Model<TransactionDocument>);
    processUpload(file: Express.Multer.File, userChannel?: string): Promise<CsvUploadDocument>;
    private parsePOS;
    private parseTikTok;
    private parseShopeeExcel;
    private parseShopeeCsv;
    private inferSectorFromProduct;
    private inferCategoryFromProduct;
    getUploads(): Promise<CsvUploadDocument[]>;
    deleteUpload(id: string): Promise<{
        deleted: boolean;
    }>;
    getMetrics(): Promise<any>;
}
