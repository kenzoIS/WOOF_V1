import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SmartReportsService } from './smart-reports.service';
import { SmartReportsController } from './smart-reports.controller';
import { Transaction, TransactionSchema } from '../csv/schemas/transaction.schema';
import { SmartReport, SmartReportSchema } from './schemas/smart-report.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: SmartReport.name, schema: SmartReportSchema },
    ]),
  ],
  providers: [SmartReportsService],
  controllers: [SmartReportsController],
  exports: [SmartReportsService],
})
export class SmartReportsModule {}
