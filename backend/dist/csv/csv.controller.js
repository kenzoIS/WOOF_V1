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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const csv_service_1 = require("./csv.service");
let CsvController = class CsvController {
    csvService;
    constructor(csvService) {
        this.csvService = csvService;
    }
    async uploadCsv(file, channel) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const allowedExtensions = ['.csv', '.xlsx', '.xls'];
        const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
        if (!allowedExtensions.includes(ext)) {
            throw new common_1.BadRequestException('Only CSV and Excel files are supported');
        }
        const result = await this.csvService.processUpload(file, channel);
        return {
            success: true,
            upload: result,
        };
    }
    async getUploads() {
        const uploads = await this.csvService.getUploads();
        return { uploads };
    }
    async deleteUpload(id) {
        const result = await this.csvService.deleteUpload(id);
        return result;
    }
    async getMetrics() {
        const metrics = await this.csvService.getMetrics();
        return metrics;
    }
};
exports.CsvController = CsvController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 50 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('channel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CsvController.prototype, "uploadCsv", null);
__decorate([
    (0, common_1.Get)('uploads'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CsvController.prototype, "getUploads", null);
__decorate([
    (0, common_1.Delete)('uploads/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CsvController.prototype, "deleteUpload", null);
__decorate([
    (0, common_1.Get)('metrics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CsvController.prototype, "getMetrics", null);
exports.CsvController = CsvController = __decorate([
    (0, common_1.Controller)('csv'),
    __metadata("design:paramtypes", [csv_service_1.CsvService])
], CsvController);
//# sourceMappingURL=csv.controller.js.map