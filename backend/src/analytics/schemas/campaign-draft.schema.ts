import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CampaignDraftDocument = CampaignDraft & Document;

@Schema({ timestamps: true })
export class CampaignDraft {
  @Prop({ required: true })
  bundleName: string;

  @Prop({ required: true })
  itemA: string;

  @Prop({ required: true })
  itemB: string;

  @Prop({ type: Number, default: null })
  regularPrice?: number | null;

  @Prop({ type: Number, default: null })
  proposedBundlePrice?: number | null;

  @Prop({ type: Number, default: null })
  regularCost?: number | null;

  @Prop({ type: Number, default: null })
  suggestedDiscountPercent?: number | null;

  @Prop({ required: true, default: 0 })
  selectedDiscountPercent: number;

  @Prop({ required: true, default: 0 })
  proposedDiscountPercent: number;

  @Prop({ type: Number, default: null })
  projectedGrossProfit?: number | null;

  @Prop({ type: Number, default: null })
  projectedMarginPercent?: number | null;

  @Prop({ type: Number, default: null })
  minimumMarginPercent?: number | null;

  @Prop({ type: Number, default: null })
  maxSafeDiscountPercent?: number | null;

  @Prop({
    required: true,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: 'pending' | 'approved' | 'rejected';

  @Prop({ type: Object, default: {} })
  metrics: Record<string, number>;
}

export const CampaignDraftSchema = SchemaFactory.createForClass(CampaignDraft);

CampaignDraftSchema.index({ status: 1, createdAt: -1 });
