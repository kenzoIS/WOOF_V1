import { Document } from 'mongoose';
export type CsvUploadDocument = CsvUpload & Document;
export declare class CsvUpload {
    filename: string;
    channel: string;
    recordCount: number;
    totalRevenue: number;
    totalQuantity: number;
    totalTransactions: number;
    categories: string[];
    uploadedAt: Date;
}
export declare const CsvUploadSchema: import("mongoose").Schema<CsvUpload, import("mongoose").Model<CsvUpload, any, any, any, any, any, CsvUpload>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CsvUpload, Document<unknown, {}, CsvUpload, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<CsvUpload & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    filename?: import("mongoose").SchemaDefinitionProperty<string, CsvUpload, Document<unknown, {}, CsvUpload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CsvUpload & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    channel?: import("mongoose").SchemaDefinitionProperty<string, CsvUpload, Document<unknown, {}, CsvUpload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CsvUpload & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    recordCount?: import("mongoose").SchemaDefinitionProperty<number, CsvUpload, Document<unknown, {}, CsvUpload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CsvUpload & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalRevenue?: import("mongoose").SchemaDefinitionProperty<number, CsvUpload, Document<unknown, {}, CsvUpload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CsvUpload & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalQuantity?: import("mongoose").SchemaDefinitionProperty<number, CsvUpload, Document<unknown, {}, CsvUpload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CsvUpload & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalTransactions?: import("mongoose").SchemaDefinitionProperty<number, CsvUpload, Document<unknown, {}, CsvUpload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CsvUpload & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    categories?: import("mongoose").SchemaDefinitionProperty<string[], CsvUpload, Document<unknown, {}, CsvUpload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CsvUpload & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    uploadedAt?: import("mongoose").SchemaDefinitionProperty<Date, CsvUpload, Document<unknown, {}, CsvUpload, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CsvUpload & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, CsvUpload>;
