import { CsvService } from './csv.service';
export declare class CsvController {
    private readonly csvService;
    constructor(csvService: CsvService);
    uploadCsv(file: Express.Multer.File, channel?: string): Promise<{
        success: boolean;
        upload: import("./schemas/csv-upload.schema").CsvUploadDocument;
    }>;
    getUploads(): Promise<{
        uploads: import("./schemas/csv-upload.schema").CsvUploadDocument[];
    }>;
    deleteUpload(id: string): Promise<{
        deleted: boolean;
    }>;
    getMetrics(): Promise<any>;
}
