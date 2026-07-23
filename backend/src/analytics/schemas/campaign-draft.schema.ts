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

  @Prop({ required: true, default: 15 })
  proposedDiscountPercent: number;

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
