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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const transaction_schema_1 = require("../csv/schemas/transaction.schema");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
let AnalyticsService = class AnalyticsService {
    transactionModel;
    constructor(transactionModel) {
        this.transactionModel = transactionModel;
    }
    async getDashboard(sector) {
        const sectorFilter = sector === 'all' ? {} : { sector: this.normalizeSector(sector) };
        const [kpis, topItems, dailyRevenue, channelBreakdown] = await Promise.all([
            this.transactionModel.aggregate([
                { $match: sectorFilter },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$netSales' },
                        totalOrders: { $addToSet: '$transactionId' },
                        totalQuantity: { $sum: '$quantity' },
                        totalItems: { $sum: 1 },
                    },
                },
            ]),
            this.transactionModel.aggregate([
                { $match: sectorFilter },
                {
                    $group: {
                        _id: '$productName',
                        revenue: { $sum: '$netSales' },
                        quantity: { $sum: '$quantity' },
                        transactions: { $addToSet: '$transactionId' },
                        avgPrice: { $avg: '$unitPrice' },
                        category: { $first: '$category' },
                    },
                },
                { $addFields: { orderCount: { $size: '$transactions' } } },
                { $sort: { revenue: -1 } },
                { $limit: 20 },
                { $project: { transactions: 0 } },
            ]),
            this.transactionModel.aggregate([
                { $match: sectorFilter },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                        revenue: { $sum: '$netSales' },
                        orders: { $addToSet: '$transactionId' },
                        quantity: { $sum: '$quantity' },
                    },
                },
                { $addFields: { orderCount: { $size: '$orders' } } },
                { $sort: { _id: 1 } },
                { $project: { orders: 0 } },
            ]),
            this.transactionModel.aggregate([
                { $match: sectorFilter },
                {
                    $group: {
                        _id: '$channel',
                        revenue: { $sum: '$netSales' },
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);
        const kpi = kpis[0] || { totalRevenue: 0, totalOrders: [], totalQuantity: 0, totalItems: 0 };
        return {
            kpis: {
                totalRevenue: Math.round(kpi.totalRevenue * 100) / 100,
                totalOrders: Array.isArray(kpi.totalOrders) ? kpi.totalOrders.length : 0,
                totalQuantity: kpi.totalQuantity,
                totalItems: kpi.totalItems,
                avgOrderValue: kpi.totalOrders?.length
                    ? Math.round((kpi.totalRevenue / kpi.totalOrders.length) * 100) / 100
                    : 0,
            },
            topItems: topItems.map((item) => ({
                name: item._id,
                revenue: Math.round(item.revenue * 100) / 100,
                quantity: item.quantity,
                orderCount: item.orderCount,
                avgPrice: Math.round(item.avgPrice * 100) / 100,
                category: item.category || 'Uncategorized',
            })),
            dailyRevenue: dailyRevenue.map((d) => ({
                date: d._id,
                revenue: Math.round(d.revenue * 100) / 100,
                orders: d.orderCount,
                quantity: d.quantity,
            })),
            channelBreakdown: channelBreakdown.map((c) => ({
                channel: c._id,
                revenue: Math.round(c.revenue * 100) / 100,
                count: c.count,
            })),
        };
    }
    async getForecast(sector) {
        const sectorFilter = sector === 'all' ? {} : { sector: this.normalizeSector(sector) };
        const dailyData = await this.transactionModel.aggregate([
            { $match: sectorFilter },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    revenue: { $sum: '$netSales' },
                    orders: { $addToSet: '$transactionId' },
                    quantity: { $sum: '$quantity' },
                },
            },
            { $addFields: { orderCount: { $size: '$orders' } } },
            { $sort: { _id: 1 } },
            { $project: { orders: 0 } },
        ]);
        if (dailyData.length < 14) {
            return {
                historical: dailyData.map((d) => ({
                    date: d._id,
                    actual: Math.round(d.revenue * 100) / 100,
                    orders: d.orderCount,
                })),
                forecast: [],
                modelInfo: { model: 'Insufficient data (needs 14+ days for Prophet)', accuracy: 0 },
            };
        }
        const inputData = dailyData.map(d => ({
            date: d._id,
            revenue: Math.round(d.revenue * 100) / 100,
            orders: d.orderCount,
        }));
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(process.cwd(), 'src', 'analytics', 'python', 'forecast.py');
            const pythonCmd = path.join(process.cwd(), 'venv', 'bin', 'python3');
            const pythonProcess = (0, child_process_1.spawn)(pythonCmd, [scriptPath]);
            let dataString = '';
            let errorString = '';
            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });
            pythonProcess.stderr.on('data', (data) => {
                errorString += data.toString();
            });
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Python script exited with code ${code}: ${errorString}`);
                    reject(new Error(`Python forecast failed: ${errorString}`));
                    return;
                }
                try {
                    const result = JSON.parse(dataString);
                    if (result.error) {
                        reject(new Error(`Python forecast error: ${result.error}`));
                    }
                    else {
                        if (result.historical) {
                            result.historical = result.historical.map((d) => ({
                                date: d.date,
                                actual: d.revenue ?? d.actual,
                                orders: d.orders,
                            }));
                        }
                        resolve(result);
                    }
                }
                catch (e) {
                    console.error('Failed to parse Python output:', dataString);
                    reject(new Error('Failed to parse Python forecast output'));
                }
            });
            pythonProcess.stdin.write(JSON.stringify(inputData));
            pythonProcess.stdin.end();
        });
    }
    async getCrossSell() {
        const baskets = await this.transactionModel.aggregate([
            {
                $group: {
                    _id: '$transactionId',
                    items: { $addToSet: '$productName' },
                    sectors: { $addToSet: '$sector' },
                    totalAmount: { $sum: '$netSales' },
                },
            },
            { $match: { 'items.1': { $exists: true } } },
        ]);
        if (baskets.length < 5) {
            return { rules: [], totalBaskets: baskets.length, message: 'Not enough multi-item transactions' };
        }
        const inputData = baskets.map(b => ({
            transactionId: b._id,
            items: b.items,
            sectors: b.sectors
        }));
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(process.cwd(), 'src', 'analytics', 'python', 'cross_sell.py');
            const pythonCmd = path.join(process.cwd(), 'venv', 'bin', 'python3');
            const pythonProcess = (0, child_process_1.spawn)(pythonCmd, [scriptPath]);
            let dataString = '';
            let errorString = '';
            pythonProcess.stdout.on('data', (data) => {
                dataString += data.toString();
            });
            pythonProcess.stderr.on('data', (data) => {
                errorString += data.toString();
            });
            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Python script exited with code ${code}: ${errorString}`);
                    reject(new Error(`Python cross-sell failed: ${errorString}`));
                    return;
                }
                try {
                    const result = JSON.parse(dataString);
                    if (result.error) {
                        reject(new Error(`Python cross-sell error: ${result.error}`));
                    }
                    else {
                        const totalBaskets = baskets.length;
                        const crossSectorBaskets = baskets.filter((b) => b.sectors.length > 1);
                        const crossSectorRate = totalBaskets > 0 ? crossSectorBaskets.length / totalBaskets : 0;
                        result.crossSectorBaskets = crossSectorBaskets.length;
                        result.crossSectorRate = Math.round(crossSectorRate * 10000) / 10000;
                        resolve(result);
                    }
                }
                catch (e) {
                    console.error('Failed to parse Python output:', dataString);
                    reject(new Error('Failed to parse Python cross-sell output'));
                }
            });
            pythonProcess.stdin.write(JSON.stringify(inputData));
            pythonProcess.stdin.end();
        });
    }
    async getRetailForecastByChannel() {
        const sectorFilter = { sector: 'Retail' };
        const [physicalData, onlineData] = await Promise.all([
            this.transactionModel.aggregate([
                { $match: { ...sectorFilter, channel: 'POS' } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                        revenue: { $sum: '$netSales' },
                        orders: { $addToSet: '$transactionId' },
                    },
                },
                { $addFields: { orderCount: { $size: '$orders' } } },
                { $sort: { _id: 1 } },
                { $project: { orders: 0 } },
            ]),
            this.transactionModel.aggregate([
                { $match: { ...sectorFilter, channel: { $in: ['Shopee', 'TikTok Shop'] } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                        revenue: { $sum: '$netSales' },
                        orders: { $addToSet: '$transactionId' },
                    },
                },
                { $addFields: { orderCount: { $size: '$orders' } } },
                { $sort: { _id: 1 } },
                { $project: { orders: 0 } },
            ]),
        ]);
        const formatSeries = (data) => data.map(d => ({
            date: d._id,
            revenue: Math.round(d.revenue * 100) / 100,
            orders: d.orderCount,
        }));
        return {
            physical: {
                historical: formatSeries(physicalData),
            },
            online: {
                historical: formatSeries(onlineData),
            },
        };
    }
    normalizeSector(sector) {
        const lower = sector.toLowerCase();
        if (lower === 'cafe' || lower === 'coffee')
            return 'Cafe';
        if (lower === 'retail' || lower === 'pet supplies')
            return 'Retail';
        if (lower === 'services' || lower === 'grooming')
            return 'Services';
        return sector;
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(transaction_schema_1.Transaction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map