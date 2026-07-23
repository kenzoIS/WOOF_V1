import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Transaction, TransactionSchema } from '../csv/schemas/transaction.schema';
import {
  ForecastRun,
  ForecastRunSchema,
} from './schemas/forecast-run.schema';
import {
  CrossSellCache,
  CrossSellCacheSchema,
} from './schemas/cross-sell-cache.schema';
import {
  CampaignDraft,
  CampaignDraftSchema,
} from './schemas/campaign-draft.schema';
import { CsvUpload, CsvUploadSchema } from '../csv/schemas/csv-upload.schema';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: ForecastRun.name, schema: ForecastRunSchema },
      { name: CrossSellCache.name, schema: CrossSellCacheSchema },
      { name: CampaignDraft.name, schema: CampaignDraftSchema },
      { name: CsvUpload.name, schema: CsvUploadSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
