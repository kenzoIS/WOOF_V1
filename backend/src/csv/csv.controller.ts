import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CsvService } from './csv.service';

@Controller('csv')
export class CsvController {
  constructor(private readonly csvService: CsvService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  }))
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('channel') channel?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestException('Only CSV and Excel files are supported');
    }

    const result = await this.csvService.processUpload(file, channel);
    return {
      success: true,
      upload: result,
    };
  }

  @Get('uploads')
  async getUploads() {
    const uploads = await this.csvService.getUploads();
    return { uploads };
  }

  @Delete('uploads/:id')
  async deleteUpload(@Param('id') id: string) {
    const result = await this.csvService.deleteUpload(id);
    return result;
  }

  @Get('metrics')
  async getMetrics() {
    const metrics = await this.csvService.getMetrics();
    return metrics;
  }
}
