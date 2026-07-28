import {
  BadRequestException,
  BadGatewayException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  CampaignActivation,
  CampaignActivationDocument,
} from './schemas/campaign-activation.schema';

type CampaignStatus = 'draft' | 'approved' | 'queued' | 'published';

interface GeneratedCampaignAssets {
  headline: string;
  shortCaption: string;
  longCaption: string;
  callToAction: string;
  pushNotification: string;
  petHubBannerText: string;
  termsAndConditions: string[];
  pubmatPrompt: string;
}

interface PetHubAnnouncementPayload {
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
}

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
    const generatedAssets =
      await this.generateAssetsWithClaude(recommendation);
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

  async publishCampaignToPetHub(campaignId: string) {
    const endpoint = this.getPetHubAnnouncementsEndpoint();
    if (!endpoint) {
      throw new BadRequestException(
        'PETHUB_ANNOUNCEMENTS_ENDPOINT or PETHUB_API_BASE_URL must be configured',
      );
    }

    const campaign = await this.campaignModel.findOne({ campaignId }).lean().exec();
    if (!campaign) {
      throw new BadRequestException('Campaign not found');
    }

    const payload = {
      ...(campaign.pethubPayload || {}),
      isActive: true,
    };

    const token = process.env.PETHUB_API_TOKEN;
    const response = await this.postPetHubAnnouncement(endpoint, payload, token);

    const updated = await this.campaignModel
      .findOneAndUpdate({ campaignId }, { status: 'published' }, { new: true })
      .lean()
      .exec();

    return {
      campaign: updated,
      pethubResponse: response.data,
    };
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

  private async generateAssetsWithClaude(
    recommendation: ActivationRecommendation,
  ): Promise<GeneratedCampaignAssets> {
    const fallback = this.generateFallbackAssets(recommendation);
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return fallback;
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model:
            process.env.ANTHROPIC_MODEL ||
            'claude-3-5-sonnet-latest',
          max_tokens: 1200,
          temperature: 0.7,
          system:
            'You generate concise, brand-safe Happy Tails / PetHub campaign materials. Return only valid JSON with no markdown.',
          messages: [
            {
              role: 'user',
              content: this.buildClaudePrompt(recommendation),
            },
          ],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const text = this.extractAnthropicText(response.data);
      const parsed = this.parseJsonObject(text);
      return this.normalizeGeneratedAssets(parsed, fallback);
    } catch (error) {
      return fallback;
    }
  }

  private generateFallbackAssets(
    recommendation: ActivationRecommendation,
  ): GeneratedCampaignAssets {
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

  private buildClaudePrompt(recommendation: ActivationRecommendation) {
    return [
      'Generate campaign materials for a PetHub announcement from this WOOF promo recommendation.',
      'Use friendly Happy Tails wording for pet owners. Keep copy short, specific, and ready to publish.',
      'Return exactly this JSON shape:',
      JSON.stringify({
        headline: 'string, max 80 chars',
        shortCaption: 'string, max 140 chars',
        longCaption: 'string, 1-2 short paragraphs',
        callToAction: 'string, 2-4 words',
        pushNotification: 'string, max 120 chars',
        petHubBannerText: 'string, max 90 chars',
        termsAndConditions: ['string', 'string'],
        pubmatPrompt: 'string prompt for an image/pubmat generator',
      }),
      'WOOF recommendation:',
      JSON.stringify(recommendation),
    ].join('\n');
  }

  private buildPetHubPayload(
    campaignId: string,
    recommendation: ActivationRecommendation,
    generatedAssets: GeneratedCampaignAssets,
  ): PetHubAnnouncementPayload {
    return {
      category: 'promotion',
      tag: 'WOOF',
      meta: this.buildAnnouncementMeta(recommendation),
      title: generatedAssets.headline,
      description: generatedAssets.longCaption,
      note: generatedAssets.shortCaption,
      highlight: generatedAssets.petHubBannerText,
      footer: generatedAssets.termsAndConditions.join(' '),
      sortOrder: 0,
      isActive: false,
    };
  }

  private buildAnnouncementMeta(
    recommendation: ActivationRecommendation,
  ): string {
    const sourceLabel = recommendation.source
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
    const confidence = recommendation.confidence
      ? ` • ${recommendation.confidence} confidence`
      : '';
    return `${sourceLabel}${confidence}`;
  }

  private extractAnthropicText(data: any): string {
    const textBlocks = Array.isArray(data?.content)
      ? data.content
          .filter((block: any) => block?.type === 'text' && block?.text)
          .map((block: any) => block.text)
      : [];
    return textBlocks.join('\n').trim();
  }

  private parseJsonObject(text: string): Record<string, unknown> {
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return {};
      try {
        return JSON.parse(match[0]);
      } catch {
        return {};
      }
    }
  }

  private normalizeGeneratedAssets(
    value: Record<string, unknown>,
    fallback: GeneratedCampaignAssets,
  ): GeneratedCampaignAssets {
    return {
      headline: this.safeString(value.headline, fallback.headline),
      shortCaption: this.safeString(value.shortCaption, fallback.shortCaption),
      longCaption: this.safeString(value.longCaption, fallback.longCaption),
      callToAction: this.safeString(value.callToAction, fallback.callToAction),
      pushNotification: this.safeString(
        value.pushNotification,
        fallback.pushNotification,
      ),
      petHubBannerText: this.safeString(
        value.petHubBannerText,
        fallback.petHubBannerText,
      ),
      termsAndConditions: this.safeStringArray(
        value.termsAndConditions,
        fallback.termsAndConditions,
      ),
      pubmatPrompt: this.safeString(value.pubmatPrompt, fallback.pubmatPrompt),
    };
  }

  private safeString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private safeStringArray(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) return fallback;
    const items = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items.slice(0, 5) : fallback;
  }

  private getPetHubAnnouncementsEndpoint(): string | null {
    const explicitEndpoint = process.env.PETHUB_ANNOUNCEMENTS_ENDPOINT?.trim();
    if (explicitEndpoint) {
      return explicitEndpoint;
    }
    const baseUrl = process.env.PETHUB_API_BASE_URL?.trim();
    if (!baseUrl) {
      return null;
    }
    return `${baseUrl.replace(/\/+$/, '')}/api/announcements`;
  }

  private async postPetHubAnnouncement(
    endpoint: string,
    payload: Record<string, unknown>,
    token?: string,
  ) {
    try {
      return await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 15000,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const responseMessage = this.extractRemoteErrorMessage(
          error.response?.data,
        );
        const message = [
          'PetHub announcement publish failed',
          status ? `(${status})` : null,
          responseMessage || error.message,
          `Endpoint: ${endpoint}`,
        ]
          .filter(Boolean)
          .join(' ');
        throw new BadGatewayException(message);
      }
      throw new BadGatewayException('PetHub announcement publish failed');
    }
  }

  private extractRemoteErrorMessage(data: unknown): string | null {
    if (!data) return null;
    if (typeof data === 'string') return data;
    if (typeof data !== 'object') return null;
    const body = data as Record<string, unknown>;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.error === 'string') return body.error;
    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }
    return JSON.stringify(body);
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
