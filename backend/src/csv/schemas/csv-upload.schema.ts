import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CsvUploadDocument = CsvUpload & Document;

@Schema({ timestamps: true })
export class CsvUpload {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  channel: string; // "POS" | "Shopee" | "TikTok Shop"

  @Prop({ default: 0 })
  recordCount: number;

  @Prop({ default: 0 })
  totalRevenue: number;

  @Prop({ default: 0 })
  totalQuantity: number;

  @Prop({ default: 0 })
  totalTransactions: number;

  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop()
  uploadedAt: Date;
}

export const CsvUploadSchema = SchemaFactory.createForClass(CsvUpload);
