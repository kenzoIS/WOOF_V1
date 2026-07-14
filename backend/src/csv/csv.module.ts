import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CsvController } from './csv.controller';
import { CsvService } from './csv.service';
import { CsvUpload, CsvUploadSchema } from './schemas/csv-upload.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { EtlService } from './etl.service';
import { DataValidationService } from './data-validation.service';
import { ContextModule } from '../context/context.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CsvUpload.name, schema: CsvUploadSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    ContextModule,
    CommonModule,
  ],
  controllers: [CsvController],
  providers: [CsvService, EtlService, DataValidationService],
  exports: [CsvService, EtlService, MongooseModule, DataValidationService],
})
export class CsvModule {}
