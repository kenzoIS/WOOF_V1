import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CampaignActivationDocument = CampaignActivation & Document;

@Schema({ timestamps: true })
export class CampaignActivation {
  @Prop({ required: true })
  campaignId: string;

  @Prop({ required: true })
  source: string;

  @Prop({ required: true })
  sourceRecommendationId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  promoMechanic: string;

  @Prop({ type: [String], default: [] })
  featuredItems: string[];

  @Prop({ default: 'PetHub customers' })
  targetSegment: string;

  @Prop({ default: 'draft', enum: ['draft', 'approved', 'queued', 'published'] })
  status: 'draft' | 'approved' | 'queued' | 'published';

  @Prop({ type: Object, required: true })
  analyticsContext: Record<string, unknown>;

  @Prop({ type: Object, required: true })
  generatedAssets: {
    headline: string;
    shortCaption: string;
    longCaption: string;
    callToAction: string;
    pushNotification: string;
    petHubBannerText: string;
    termsAndConditions: string[];
    pubmatPrompt: string;
  };

  @Prop({ type: Object, default: {} })
  pethubPayload: {
    category: string;
    tag: string;
    meta: string;
    title: string;
    description: string;
    note: string;
    highlight: string;
    footer: string;
    sortOrder: number;
    isActive: boolean;
  };
}

export const CampaignActivationSchema =
  SchemaFactory.createForClass(CampaignActivation);

CampaignActivationSchema.index({ campaignId: 1 }, { unique: true });
CampaignActivationSchema.index({ status: 1, createdAt: -1 });
