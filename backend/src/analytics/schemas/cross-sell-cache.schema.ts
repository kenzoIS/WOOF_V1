import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CrossSellCacheDocument = CrossSellCache & Document;

@Schema({ timestamps: true })
export class CrossSellCache {
  @Prop({ required: true })
  computedAt: Date;

  @Prop({ type: Object, default: {} })
  result: Record<string, unknown>;

  @Prop({ type: [Object], default: [] })
  rules: Record<string, unknown>[];

  @Prop({ type: [Object], default: [] })
  bundleCandidates: Record<string, unknown>[];

  @Prop({ required: true, default: 0 })
  totalBaskets: number;

  @Prop({ required: true, default: 0 })
  multiItemBaskets: number;

  @Prop({ required: true, default: 0 })
  crossSectorRate: number;

  @Prop({ required: true, default: 0 })
  computationDurationMs: number;

  @Prop({ type: Object, default: {} })
  thresholds: Record<string, number>;

  @Prop({ type: Object, default: {} })
  uploadState: Record<string, unknown>;

  @Prop()
  message?: string;

  @Prop({ default: 0 })
  cleanedItems?: number;

  @Prop({ type: Object, default: {} })
  sectorBreakdown?: Record<string, unknown[]>;
}

export const CrossSellCacheSchema =
  SchemaFactory.createForClass(CrossSellCache);

CrossSellCacheSchema.index({ computedAt: -1 });
CrossSellCacheSchema.index({
  'thresholds.minSupport': 1,
  'thresholds.minConfidence': 1,
  'thresholds.minLift': 1,
  'thresholds.maxBundleCandidates': 1,
  'thresholds.hour': 1,
  'uploadState.uploadCount': 1,
  'uploadState.latestUploadId': 1,
  'uploadState.latestUploadTime': 1,
  computedAt: -1,
});
