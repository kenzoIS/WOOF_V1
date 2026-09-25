import { Module } from '@nestjs/common';
// [MONGO_DISABLED] import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import {
  Transaction,
  TransactionSchema,
} from '../csv/schemas/transaction.schema';

import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    // [MONGO_DISABLED] MongooseModule.forFeature([
    // [MONGO_DISABLED] { name: Transaction.name, schema: TransactionSchema },
    // [MONGO_DISABLED] ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
