import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  getLogs(@Query() query: { search?: string; module?: string; status?: string; category?: string; limit?: string }) {
    return this.auditService.list({ ...query, limit: Number(query.limit) || 200 });
  }

  @Get('summary')
  getSummary() {
    return this.auditService.summary();
  }
}
