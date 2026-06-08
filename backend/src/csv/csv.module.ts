import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CsvController } from './csv.controller';
import { CsvService } from './csv.service';
import { CsvUpload, CsvUploadSchema } from './schemas/csv-upload.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CsvUpload.name, schema: CsvUploadSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [CsvController],
  providers: [CsvService],
  exports: [CsvService, MongooseModule],
})
export class CsvModule {}
