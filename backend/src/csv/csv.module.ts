import { Module } from '@nestjs/common';
// [MONGO_DISABLED] import { MongooseModule } from '@nestjs/mongoose';
import { CsvController } from './csv.controller';
import { CsvService } from './csv.service';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { EtlService } from './etl.service';
import { DataValidationService } from './data-validation.service';
import { ContextModule } from '../context/context.module';
import { CommonModule } from '../common/common.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    // [MONGO_DISABLED] MongooseModule.forFeature([
    // [MONGO_DISABLED] { name: Transaction.name, schema: TransactionSchema },
    // [MONGO_DISABLED] ]),
    ContextModule,
    CommonModule,
    AnalyticsModule,
    RealtimeModule,
  ],
  controllers: [CsvController],
  providers: [CsvService, EtlService, DataValidationService],
  // [MONGO_DISABLED] exports: [CsvService, EtlService, MongooseModule, DataValidationService],
})
export class CsvModule {}
