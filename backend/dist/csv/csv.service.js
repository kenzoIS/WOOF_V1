"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const csv_upload_schema_1 = require("./schemas/csv-upload.schema");
const transaction_schema_1 = require("./schemas/transaction.schema");
const sync_1 = require("csv-parse/sync");
const XLSX = __importStar(require("xlsx"));
const SECTOR_MAP = {
    'Coffee': 'Cafe',
    'Non-Caffeine': 'Cafe',
    'Pasta/Snacks': 'Cafe',
    'Rice Meals': 'Cafe',
    'Pet Bakery': 'Cafe',
    'Grooming': 'Services',
    'Events': 'Services',
    'Pet Hotel': 'Services',
    'Pet Supplies': 'Retail',
};
function mapCategoryToSector(category) {
    return SECTOR_MAP[category] || 'Retail';
}
function detectChannel(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('pos'))
        return 'POS';
    if (lower.includes('shopee'))
        return 'Shopee';
    if (lower.includes('tiktok') || lower.includes('tiktokshop'))
        return 'TikTok Shop';
    return 'POS';
}
let CsvService = class CsvService {
    csvUploadModel;
    transactionModel;
    constructor(csvUploadModel, transactionModel) {
        this.csvUploadModel = csvUploadModel;
        this.transactionModel = transactionModel;
    }
    async processUpload(file, userChannel) {
        const channel = userChannel || detectChannel(file.originalname);
        const isExcel = file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls');
        let transactions;
        if (channel === 'POS') {
            transactions = this.parsePOS(file.buffer);
        }
        else if (channel === 'Shopee') {
            if (isExcel) {
                transactions = this.parseShopeeExcel(file.buffer);
            }
            else {
                transactions = this.parseShopeeCsv(file.buffer);
            }
        }
        else {
            transactions = this.parseTikTok(file.buffer);
        }
        if (channel === 'Shopee' || channel === 'TikTok Shop') {
            transactions = transactions.map(t => ({ ...t, sector: 'Retail' }));
        }
        const uniqueTransactionIds = new Set(transactions.map(t => t.transactionId));
        const categories = [...new Set(transactions.map(t => t.category).filter((c) => Boolean(c)))];
        const totalRevenue = transactions.reduce((sum, t) => sum + (t.netSales || t.totalAmount || 0), 0);
        const totalQuantity = transactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
        const upload = await this.csvUploadModel.create({
            filename: file.originalname,
            channel,
            recordCount: transactions.length,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalQuantity,
            totalTransactions: uniqueTransactionIds.size,
            categories,
            uploadedAt: new Date(),
        });
        const uploadId = upload._id;
        const transactionsWithUploadId = transactions.map(t => ({
            ...t,
            csvUploadId: uploadId,
            channel,
        }));
        if (transactionsWithUploadId.length > 0) {
            await this.transactionModel.insertMany(transactionsWithUploadId, { ordered: false });
        }
        return upload;
    }
    parsePOS(buffer) {
        const content = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const records = (0, sync_1.parse)(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
        return records.map((row) => {
            const category = row['Category'] || '';
            return {
                date: new Date(row['Transaction Date']),
                transactionId: row['Transaction ID'] || '',
                productName: row['Item Names'] || '',
                sku: row['SKU'] || '',
                category,
                sector: mapCategoryToSector(category),
                quantity: parseInt(row['Items Sold'] || '0', 10),
                unitPrice: parseFloat(row['Gross Sales'] || '0') / Math.max(parseInt(row['Items Sold'] || '1', 10), 1),
                totalAmount: parseFloat(row['Gross Sales'] || '0'),
                discount: parseFloat(row['Discounts'] || '0'),
                netSales: parseFloat(row['Net Sales'] || '0'),
                paymentType: row['Payment Type'] || '',
            };
        });
    }
    parseTikTok(buffer) {
        let content = buffer.toString('utf-8');
        if (content.charCodeAt(0) === 0xFEFF)
            content = content.slice(1);
        content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const records = (0, sync_1.parse)(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
            relax_quotes: true,
        });
        return records
            .filter((row) => {
            const status = (row['Order Status'] || '').toLowerCase().trim();
            return status === 'completed' || status === 'delivered' || status === 'to ship' || status === 'shipped';
        })
            .map((row) => {
            const productCategory = row['Product Category'] || '';
            const productName = row['Product Name'] || '';
            const sector = this.inferSectorFromProduct(productName, productCategory);
            const quantity = parseInt(row['Quantity'] || '1', 10);
            const unitPrice = parseFloat(row['SKU Unit Original Price'] || '0');
            const subtotalAfterDiscount = parseFloat(row['SKU Subtotal After Discount'] || '0');
            const platformDiscount = parseFloat(row['SKU Platform Discount'] || '0');
            const sellerDiscount = parseFloat(row['SKU Seller Discount'] || '0');
            let dateStr = (row['Created Time'] || '').trim().replace(/\t/g, '');
            let date;
            try {
                date = new Date(dateStr);
                if (isNaN(date.getTime()))
                    date = new Date();
            }
            catch {
                date = new Date();
            }
            return {
                date,
                transactionId: (row['Order ID'] || '').trim().replace(/\t/g, ''),
                productName,
                sku: (row['SKU ID'] || '').trim().replace(/\t/g, ''),
                category: productCategory,
                sector,
                quantity,
                unitPrice,
                totalAmount: unitPrice * quantity,
                discount: platformDiscount + sellerDiscount,
                netSales: subtotalAfterDiscount,
                paymentType: '',
            };
        });
    }
    parseShopeeExcel(buffer) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const records = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        return records
            .filter((row) => {
            const status = (row['Order Status'] || '').toLowerCase();
            return status === 'completed';
        })
            .map((row) => {
            const productName = row['Product Name'] || '';
            const sector = this.inferSectorFromProduct(productName, '');
            const quantity = parseInt(row['Quantity'] || '1', 10);
            const dealPrice = parseFloat(row['Deal Price'] || row['Original Price'] || '0');
            const totalDiscount = parseFloat(row['Total Discount(PHP)'] || '0');
            let date;
            try {
                const dateStr = row['Order Creation Date'] || row['Order Paid Time'] || '';
                date = new Date(dateStr);
                if (isNaN(date.getTime()))
                    date = new Date();
            }
            catch {
                date = new Date();
            }
            return {
                date,
                transactionId: row['Order ID'] || '',
                productName,
                sku: row['SKU Reference No.'] || row['Parent SKU Reference No.'] || '',
                category: this.inferCategoryFromProduct(productName),
                sector,
                quantity,
                unitPrice: dealPrice,
                totalAmount: dealPrice * quantity,
                discount: totalDiscount,
                netSales: dealPrice * quantity - totalDiscount,
                paymentType: '',
            };
        });
    }
    parseShopeeCsv(buffer) {
        const content = buffer.toString('utf-8').replace(/\r\n/g, '\n');
        const records = (0, sync_1.parse)(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        });
        return this.parseShopeeExcel(buffer);
    }
    inferSectorFromProduct(productName, category) {
        const lower = (productName + ' ' + category).toLowerCase();
        if (/coffee|latte|cappuccino|mocha|espresso|frappe|matcha|tea|smoothie|cake|pastry|bread|cookie|muffin|rice meal|pasta|snack|bakery|cupcake/.test(lower)) {
            return 'Cafe';
        }
        if (/grooming|groom|bath|nail|paw.?dicure|boarding|hotel|pet hotel|birthday|party|trim|haircut|spa/.test(lower)) {
            return 'Services';
        }
        return 'Retail';
    }
    inferCategoryFromProduct(productName) {
        const lower = productName.toLowerCase();
        if (/food|kibble|treat|chew|snack|fattener|vitamins|supplement/.test(lower))
            return 'Pet Supplies';
        if (/shampoo|conditioner|soap|spray|cologne|powder/.test(lower))
            return 'Pet Supplies';
        if (/collar|leash|harness|bowl|bed|cage|carrier|toy/.test(lower))
            return 'Pet Supplies';
        if (/medicine|tablet|capsule|syrup|dewormer|worm|flea|tick/.test(lower))
            return 'Pet Supplies';
        return 'Pet Supplies';
    }
    async getUploads() {
        return this.csvUploadModel.find().sort({ uploadedAt: -1 }).exec();
    }
    async deleteUpload(id) {
        const objectId = new mongoose_2.Types.ObjectId(id);
        await this.transactionModel.deleteMany({ csvUploadId: objectId }).exec();
        await this.csvUploadModel.findByIdAndDelete(objectId).exec();
        return { deleted: true };
    }
    async getMetrics() {
        const [uploads, channelAgg, totalAgg] = await Promise.all([
            this.csvUploadModel.find().exec(),
            this.transactionModel.aggregate([
                { $group: { _id: '$channel', count: { $sum: 1 }, revenue: { $sum: '$netSales' } } },
            ]),
            this.transactionModel.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRecords: { $sum: 1 },
                        totalTransactions: { $addToSet: '$transactionId' },
                        totalQuantity: { $sum: '$quantity' },
                        totalRevenue: { $sum: '$netSales' },
                    },
                },
            ]),
        ]);
        const totals = totalAgg[0] || { totalRecords: 0, totalTransactions: [], totalQuantity: 0, totalRevenue: 0 };
        const channels = {};
        channelAgg.forEach((c) => {
            channels[c._id] = { count: c.count, revenue: Math.round(c.revenue * 100) / 100 };
        });
        return {
            totalRecords: totals.totalRecords,
            totalTransactions: Array.isArray(totals.totalTransactions) ? totals.totalTransactions.length : 0,
            totalQuantity: totals.totalQuantity,
            totalRevenue: Math.round(totals.totalRevenue * 100) / 100,
            channels,
            uploadCount: uploads.length,
        };
    }
};
exports.CsvService = CsvService;
exports.CsvService = CsvService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(csv_upload_schema_1.CsvUpload.name)),
    __param(1, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], CsvService);
//# sourceMappingURL=csv.service.js.map