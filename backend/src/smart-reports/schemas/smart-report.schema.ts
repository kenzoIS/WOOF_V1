import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SmartReportDocument = SmartReport & Document;

@Schema({ timestamps: true })
export class SmartReport {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, type: Object })
  dateRange: { start: string; end: string };

  @Prop({ required: true, type: [String] })
  sectors: string[];

  @Prop({ required: true, type: Object })
  aggregatedData: {
    totalRevenue: number;
    totalGrossProfit: number;
    averageMargin: number;
    channelRevenue: Record<string, number>;
    categorySales: Record<string, number>;
  };

  @Prop({ required: true, type: Object })
  extrapolatedTrends: {
    horizonDays: number;
    dates: string[];
    projectedRevenue: number[];
    projectedGrowthRate: number;
    trendDirection: 'UPWARD' | 'DOWNWARD' | 'STABLE';
  };

  @Prop({ required: true })
  nlgSummary: string;

  @Prop({ required: true, default: 100 })
  dataCompleteness: number;

  @Prop({
    type: {
      accuracyRating: { type: Number, default: null },
      usefulnessRating: { type: Number, default: null },
      ownerApproved: { type: Boolean, default: false },
      feedbackText: { type: String, default: null },
      reviewedAt: { type: Date, default: null },
    },
    default: () => ({}),
  })
  uatFeedback: {
    accuracyRating: number | null;
    usefulnessRating: number | null;
    ownerApproved: boolean;
    feedbackText: string | null;
    reviewedAt: Date | null;
  };

  @Prop({ required: true, default: Date.now })
  generatedAt: Date;
}

export const SmartReportSchema = SchemaFactory.createForClass(SmartReport);
SmartReportSchema.index({ generatedAt: -1 });
