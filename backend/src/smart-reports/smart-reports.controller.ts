import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { SmartReportsService } from './smart-reports.service';
import { SmartReport } from './schemas/smart-report.schema';

class GenerateReportDto {
  title: string;
  startDate: string;
  endDate: string;
  sectors: ('Cafe' | 'Retail' | 'Services')[];
}

@Controller('smart-reports')
export class SmartReportsController {
  constructor(private readonly smartReportsService: SmartReportsService) {}

  @Post('generate')
  async generateReport(@Body() dto: GenerateReportDto): Promise<SmartReport> {
    return await this.smartReportsService.generateReport(
      dto.title,
      dto.startDate,
      dto.endDate,
      dto.sectors,
    );
  }

  @Get()
  async getAllReports(): Promise<SmartReport[]> {
    return await this.smartReportsService.getAllReports();
  }

  @Get(':id')
  async getReportById(@Param('id') id: string): Promise<SmartReport> {
    return await this.smartReportsService.getReportById(id);
  }

  @Delete(':id')
  async deleteReport(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.smartReportsService.deleteReport(id);
    return { success: true };
  }

  @Put(':id/feedback')
  async submitFeedback(
    @Param('id') id: string,
    @Body() dto: {
      accuracyRating: number;
      usefulnessRating: number;
      ownerApproved: boolean;
      feedbackText?: string;
    },
  ): Promise<SmartReport> {
    return await this.smartReportsService.submitFeedback(id, dto);
  }
}
