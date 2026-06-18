import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Transaction, TransactionSchema } from '../csv/schemas/transaction.schema';
import {
  ForecastRun,
  ForecastRunSchema,
} from './schemas/forecast-run.schema';
import { CsvUpload, CsvUploadSchema } from '../csv/schemas/csv-upload.schema';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: ForecastRun.name, schema: ForecastRunSchema },
      { name: CsvUpload.name, schema: CsvUploadSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
