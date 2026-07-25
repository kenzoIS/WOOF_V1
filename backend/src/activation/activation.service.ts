import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  CampaignActivation,
  CampaignActivationDocument,
} from './schemas/campaign-activation.schema';

type CampaignStatus = 'draft' | 'approved' | 'queued' | 'published';

interface ActivationRecommendation {
  id: string;
  source: string;
  title: string;
  featuredItems: string[];
  promoMechanic: string;
  targetSegment: string;
  expectedLift: string;
  confidence: string;
  reason: string;
  analyticsContext: Record<string, unknown>;
}

@Injectable()
export class ActivationService {
  constructor(
    private readonly analyticsService: AnalyticsService,
    @InjectModel(CampaignActivation.name)
    private readonly campaignModel: Model<CampaignActivationDocument>,
  ) {}

  async getActivationRecommendations() {
    const [crossSell, home] = await Promise.all([
      this.analyticsService.getCrossSellBundles({
        minSupport: '0.05',
        minConfidence: '0.4',
        minLift: '1.1',
        maxBundleCandidates: '8',
      }),
      this.analyticsService.getHomeOverview('week'),
    ]);

    const bundleRecommendations = this.mapBundleRecommendations(
      crossSell.bundleCandidates || [],
    );
    const homeRecommendations = this.mapHomeRecommendations(
      home.suggestions || [],
    );

    return {
      recommendations: [...bundleRecommendations, ...homeRecommendations].slice(
        0,
        10,
      ),
      generatedAt: new Date().toISOString(),
    };
  }

  async getCampaigns() {
    const campaigns = await this.campaignModel
      .find()
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()
      .exec();
    return { campaigns };
  }

  async generateCampaign(body: Record<string, unknown>) {
    const recommendation = this.normalizeRecommendation(body);
    const campaignId = `CMP-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;
    const generatedAssets = this.generateAssets(recommendation);
    const pethubPayload = this.buildPetHubPayload(
      campaignId,
      recommendation,
      generatedAssets,
    );

    const campaign = await this.campaignModel.create({
      campaignId,
      source: recommendation.source,
      sourceRecommendationId: recommendation.id,
      title: recommendation.title,
      promoMechanic: recommendation.promoMechanic,
      featuredItems: recommendation.featuredItems,
      targetSegment: recommendation.targetSegment,
      status: 'draft',
      analyticsContext: recommendation.analyticsContext,
      generatedAssets,
      pethubPayload,
    });

    return { campaign };
  }

  async updateCampaignStatus(campaignId: string, status: CampaignStatus) {
    if (!['draft', 'approved', 'queued', 'published'].includes(status)) {
      throw new BadRequestException('Invalid campaign status');
    }
    const campaign = await this.campaignModel
      .findOneAndUpdate({ campaignId }, { status }, { new: true })
      .lean()
      .exec();
    if (!campaign) {
      throw new BadRequestException('Campaign not found');
    }
    return { campaign };
  }

  private mapBundleRecommendations(items: any[]): ActivationRecommendation[] {
    return items.map((item, index) => {
      const anchor = item.anchorItem || item.itemA || 'Featured item';
      const bundle = item.bundleItem || item.itemB || 'Recommended pair';
      const score = Math.round(Number(item.opportunityScore || 0));
      return {
        id: `bundle-${index + 1}-${this.slug(anchor)}-${this.slug(bundle)}`,
        source: 'market_basket_analysis',
        title: `${anchor} + ${bundle}`,
        featuredItems: [anchor, bundle],
        promoMechanic: this.suggestMechanic(item),
        targetSegment: item.crossSector
          ? 'Cross-sector PetHub shoppers'
          : 'PetHub shoppers with matching purchase intent',
        expectedLift: `${Math.max(8, Math.round(Number(item.lift || 1) * 12))}% engagement lift`,
        confidence: `${Math.round(Number(item.confidence || 0) * 100)}%`,
        reason:
          item.reason ||
          `${anchor} can be used to expose customers to the slower-moving ${bundle}.`,
        analyticsContext: {
          support: item.pairSupport,
          confidence: item.confidence,
          lift: item.lift,
          opportunityScore: score,
          source: 'FP-Growth / market basket analysis',
        },
      };
    });
  }

  private mapHomeRecommendations(items: any[]): ActivationRecommendation[] {
    return items.map((item: any) => ({
      id: `home-${item.id || this.slug(item.title)}`,
      source: 'forecast_and_kpi_recommendation',
      title: item.title || 'WOOF Recommended Campaign',
      featuredItems: [String(item.title || '').replace(/^Promote\s+/i, '')],
      promoMechanic: item.discount || 'Featured PetHub placement',
      targetSegment: 'PetHub customers in the next high-intent sales window',
      expectedLift: item.expectedLift || 'Projected lift unavailable',
      confidence: item.confidence || 'N/A',
      reason: item.reason || item.detailedExplanation || 'WOOF recommended this action.',
      analyticsContext: {
        trigger: item.trigger,
        detailedExplanation: item.detailedExplanation,
        source: 'Home overview recommendation',
      },
    }));
  }

  private generateAssets(recommendation: ActivationRecommendation) {
    const items = recommendation.featuredItems.filter(Boolean);
    const primary = items[0] || 'Happy Tails favorite';
    const pair = items.length > 1 ? items.join(' + ') : primary;
    const savings = this.extractDiscount(recommendation.promoMechanic);
    const cta = recommendation.source === 'market_basket_analysis'
      ? 'Claim Bundle'
      : 'View Offer';

    return {
      headline: `${pair}: A Smarter Happy Tails Pick`,
      shortCaption: `${pair} is now easier to discover on PetHub. ${savings}`,
      longCaption: `WOOF found a strong opportunity from ${recommendation.source.replace(/_/g, ' ')}. ${recommendation.reason} Activate this PetHub campaign to turn the insight into a customer-facing offer.`,
      callToAction: cta,
      pushNotification: `New Happy Tails offer: ${pair}. ${cta} today on PetHub.`,
      petHubBannerText: `${pair} | ${recommendation.promoMechanic}`,
      termsAndConditions: [
        'Offer validity and redemption limits are configurable before publishing.',
        'Promo availability may depend on inventory, appointment slots, or service capacity.',
        'Final approval is required before pushing this campaign to PetHub.',
      ],
      pubmatPrompt: `Create a bright, friendly Happy Tails PetHub campaign pubmat for "${pair}". Emphasize ${recommendation.promoMechanic}. Use playful pet-care visuals, clean product/service focus, readable banner text, and a clear ${cta} call-to-action.`,
    };
  }

  private buildPetHubPayload(
    campaignId: string,
    recommendation: ActivationRecommendation,
    generatedAssets: Record<string, unknown>,
  ) {
    return {
      externalCampaignId: campaignId,
      title: recommendation.title,
      type: 'woof_ai_campaign',
      status: 'draft',
      featuredItems: recommendation.featuredItems,
      targetSegment: recommendation.targetSegment,
      promoMechanic: recommendation.promoMechanic,
      assets: generatedAssets,
      analyticsSource: recommendation.source,
    };
  }

  private normalizeRecommendation(body: Record<string, unknown>) {
    const sourceRecommendation = body.recommendation as
      | ActivationRecommendation
      | undefined;
    const recommendation = sourceRecommendation || (body as any);
    if (!recommendation?.title) {
      throw new BadRequestException('Campaign generation requires a recommendation title');
    }
    return {
      id: String(recommendation.id || `manual-${Date.now()}`),
      source: String(recommendation.source || 'manual_recommendation'),
      title: String(recommendation.title),
      featuredItems: Array.isArray(recommendation.featuredItems)
        ? recommendation.featuredItems.map(String)
        : [String(recommendation.title)],
      promoMechanic: String(
        recommendation.promoMechanic || 'Featured PetHub placement',
      ),
      targetSegment: String(
        recommendation.targetSegment || 'PetHub customers',
      ),
      expectedLift: String(recommendation.expectedLift || 'N/A'),
      confidence: String(recommendation.confidence || 'N/A'),
      reason: String(recommendation.reason || 'Generated from WOOF analytics.'),
      analyticsContext:
        typeof recommendation.analyticsContext === 'object' &&
        recommendation.analyticsContext
          ? recommendation.analyticsContext
          : {},
    } satisfies ActivationRecommendation;
  }

  private suggestMechanic(item: any): string {
    const score = Number(item.opportunityScore || 0);
    const crossSector = Boolean(item.crossSector);
    if (score >= 75) return crossSector ? '15% cross-sector bundle' : '10% bundle discount';
    if (score >= 45) return 'PetHub featured bundle placement';
    return 'Awareness bundle with homepage placement';
  }

  private extractDiscount(value: string): string {
    const match = value.match(/\d+%/);
    return match ? `${match[0]} off for eligible customers.` : value;
  }

  private slug(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
