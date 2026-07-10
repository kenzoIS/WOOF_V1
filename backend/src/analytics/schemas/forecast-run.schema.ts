import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ForecastRunDocument = ForecastRun & Document;

@Schema({ _id: false })
export class HistoricalPoint {
  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  actual: number;

  @Prop({ required: true })
  normalized: number;

  @Prop({ default: 0 })
  orders: number;

  @Prop({ default: 0 })
  revenue: number;

  @Prop({ required: false })
  fitted?: number;
}

@Schema({ _id: false })
export class ForecastPoint {
  @Prop({ required: true })
  date: string;

  @Prop()
  forecastQuantity?: number;

  @Prop({ required: true })
  forecast: number;

  @Prop()
  confidenceLow?: number;

  @Prop()
  confidenceHigh?: number;

  @Prop()
  projectedNetSales?: number;

  @Prop()
  projectedConfidenceLow?: number;

  @Prop()
  projectedConfidenceHigh?: number;

  @Prop()
  projectedGrossProfit?: number;

  @Prop()
  unitPrice?: number;

  @Prop()
  unitCost?: number;
}

@Schema({ timestamps: true })
export class ForecastRun {
  @Prop({ required: true, enum: ['Cafe', 'Services'] })
  module: 'Cafe' | 'Services';

  @Prop({ type: Types.ObjectId, ref: 'CsvUpload' })
  csvUploadId?: Types.ObjectId;

  @Prop({ required: true })
  modelName: string;

  @Prop({ required: true })
  mase: number;

  @Prop({ required: true })
  mape: number;

  @Prop({ required: true })
  accuracy: number;

  @Prop({ required: true, default: false })
  isFallback: boolean;

  @Prop()
  rejectionReason?: string;

  @Prop({ type: [HistoricalPoint], default: [] })
  historical: HistoricalPoint[];

  @Prop({ type: [ForecastPoint], default: [] })
  forecast: ForecastPoint[];

  @Prop({ type: Object, default: {} })
  kpis: Record<string, number>;

  @Prop({ type: [Object], default: [] })
  topItems: Record<string, unknown>[];

  @Prop({ type: [Object], default: [] })
  itemHistory: Record<string, unknown>[];

  @Prop({ type: Object, default: {} })
  modelMetadata: Record<string, unknown>;

  @Prop({ required: true })
  generatedAt: Date;
}

export const ForecastRunSchema = SchemaFactory.createForClass(ForecastRun);
ForecastRunSchema.index({ module: 1, generatedAt: -1 });
