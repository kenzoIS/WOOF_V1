import { Module } from '@nestjs/common';
// [MONGO_DISABLED] import { MongooseModule } from '@nestjs/mongoose';
import { SmartReportsService } from './smart-reports.service';
import { SmartReportsController } from './smart-reports.controller';
import {
  Transaction,
  TransactionSchema,
} from '../csv/schemas/transaction.schema';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    LlmModule,
    // [MONGO_DISABLED] MongooseModule.forFeature([
    // [MONGO_DISABLED] { name: Transaction.name, schema: TransactionSchema },
    // [MONGO_DISABLED] ]),
  ],
  providers: [SmartReportsService],
  controllers: [SmartReportsController],
  exports: [SmartReportsService],
})
export class SmartReportsModule {}
