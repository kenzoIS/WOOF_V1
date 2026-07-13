import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CsvUploadDocument = CsvUpload & Document;

@Schema({ timestamps: true })
export class CsvUpload {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  channel: string; // "POS" | "Shopee" | "TikTok Shop" | "PetHub"

  @Prop({ default: 'general' })
  purpose: string;

  @Prop({ enum: ['Cafe', 'Services'] })
  module?: string;

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

  @Prop({ default: 0 })
  excludedRecordCount: number;

  @Prop({ default: 0 })
  repairedDateCount: number;

  @Prop({ type: Object, default: {} })
  etlReport: {
    stage1_droppedCount?: number;
    stage1_duplicateCount?: number;
    stage1_dropReasons?: string[];
    stage2_droppedCount?: number;
    stage2_dropReasons?: string[];
  };

  @Prop()
  uploadedAt: Date;
}

export const CsvUploadSchema = SchemaFactory.createForClass(CsvUpload);
