import { Document, Types } from 'mongoose';
export type TransactionDocument = Transaction & Document;
export declare class Transaction {
    csvUploadId: Types.ObjectId;
    date: Date;
    transactionId: string;
    productName: string;
    sku: string;
    category: string;
    sector: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    discount: number;
    netSales: number;
    channel: string;
    paymentType: string;
}
export declare const TransactionSchema: import("mongoose").Schema<Transaction, import("mongoose").Model<Transaction, any, any, any, any, any, Transaction>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, Document<unknown, {}, Transaction, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    csvUploadId?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    date?: import("mongoose").SchemaDefinitionProperty<Date, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    transactionId?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    productName?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sku?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    category?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sector?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    quantity?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    unitPrice?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    totalAmount?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    discount?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    netSales?: import("mongoose").SchemaDefinitionProperty<number, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    channel?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    paymentType?: import("mongoose").SchemaDefinitionProperty<string, Transaction, Document<unknown, {}, Transaction, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Transaction & {
        _id: Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Transaction>;
