"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionSchema = exports.Transaction = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Transaction = class Transaction {
    csvUploadId;
    date;
    transactionId;
    productName;
    sku;
    category;
    sector;
    quantity;
    unitPrice;
    totalAmount;
    discount;
    netSales;
    channel;
    paymentType;
};
exports.Transaction = Transaction;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'CsvUpload', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Transaction.prototype, "csvUploadId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Transaction.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "transactionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "productName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Transaction.prototype, "sku", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "sector", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 1 }),
    __metadata("design:type", Number)
], Transaction.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "unitPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "totalAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Transaction.prototype, "netSales", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Transaction.prototype, "channel", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Transaction.prototype, "paymentType", void 0);
exports.Transaction = Transaction = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Transaction);
exports.TransactionSchema = mongoose_1.SchemaFactory.createForClass(Transaction);
exports.TransactionSchema.index({ csvUploadId: 1 });
exports.TransactionSchema.index({ sector: 1, date: 1 });
exports.TransactionSchema.index({ channel: 1 });
exports.TransactionSchema.index({ transactionId: 1 });
exports.TransactionSchema.index({ date: 1 });
//# sourceMappingURL=transaction.schema.js.map