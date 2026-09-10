import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';

export type LlmFeature =
  | 'manual_bundle_explanation'
  | 'business_assistant'
  | 'forecast_explanation'
  | 'recommendation_explanation'
  | 'report_summary';

export interface LlmRequest {
  feature: LlmFeature;
  prompt: string;
  context?: Record<string, unknown>;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface LlmResponse {
  feature: LlmFeature;
  provider: 'glm' | 'kimi' | 'qwen' | 'fallback';
  model: string;
  text: string;
  configured: boolean;
}

type Provider = 'glm' | 'kimi' | 'qwen';

@Injectable()
export class LlmService {
  private readonly routing: Record<LlmFeature, Provider> = {
    manual_bundle_explanation: 'glm',
    business_assistant: 'kimi',
    forecast_explanation: 'qwen',
    recommendation_explanation: 'glm',
    report_summary: 'qwen',
  };

  async generate(request: LlmRequest): Promise<LlmResponse> {
    const provider = this.routing[request.feature];
    const config = this.getProviderConfig(provider);
    if (!config.apiKey) {
      return {
        feature: request.feature,
        provider: 'fallback',
        model: config.model,
        configured: false,
        text: this.fallback(request),
      };
    }

    try {
      const response = await axios.post(
        `${config.baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          model: config.model,
          temperature: request.feature === 'business_assistant' ? 0.3 : 0.1,
          max_tokens: 700,
          messages: [
            {
              role: 'system',
              content: this.systemPrompt(request.feature),
            },
            ...(request.history || []).slice(-8),
            {
              role: 'user',
              content: [
                request.prompt,
                request.context
                  ? `Verified WOOF context JSON:\n${JSON.stringify(request.context)}`
                  : '',
              ]
                .filter(Boolean)
                .join('\n\n'),
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );
      const text = response.data?.choices?.[0]?.message?.content;
      if (!text || typeof text !== 'string') {
        throw new Error('LLM returned an empty response');
      }
      return {
        feature: request.feature,
        provider,
        model: config.model,
        configured: true,
        text: text.trim(),
      };
    } catch (error) {
      if (process.env.LLM_STRICT === 'true') {
        throw new ServiceUnavailableException(
          `${provider} LLM request failed: ${error instanceof Error ? error.message : 'unknown error'}`,
        );
      }
      return {
        feature: request.feature,
        provider: 'fallback',
        model: config.model,
        configured: true,
        text: this.fallback(request),
      };
    }
  }

  private getProviderConfig(provider: Provider) {
    const defaults = {
      glm: {
        apiKey: process.env.GLM_API_KEY,
        baseUrl: process.env.GLM_BASE_URL || 'https://api.z.ai/api/paas/v4',
        model: process.env.GLM_MODEL || 'glm-5.3',
      },
      kimi: {
        apiKey: process.env.KIMI_API_KEY,
        baseUrl: process.env.KIMI_BASE_URL || 'https://api.moonshot.ai/v1',
        model: process.env.KIMI_MODEL || 'kimi-k3',
      },
      qwen: {
        apiKey: process.env.QWEN_API_KEY,
        baseUrl:
          process.env.QWEN_BASE_URL ||
          'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: process.env.QWEN_MODEL || 'qwen3-max',
      },
    } as const;
    return defaults[provider];
  }

  private systemPrompt(feature: LlmFeature) {
    const shared =
      'You are a WOOF business intelligence assistant. Use only verified context supplied by the backend. Never invent metrics, weather values, prices, scores, or historical evidence. If data is missing, say so. Keep the response concise and actionable.';
    const featureGuidance: Record<LlmFeature, string> = {
      manual_bundle_explanation:
        'Explain the manual bundle score, margin fit, generated baseline, and weather/calendar fit in plain business language.',
      business_assistant:
        'Answer the owner conversationally, preserving context and asking a concise clarification when the data is insufficient.',
      forecast_explanation:
        'Explain forecast direction, confidence or limitations, and the practical business implication without changing numbers.',
      recommendation_explanation:
        'Explain why a bundle recommendation is strong or weak using support, confidence, lift, margin, and context signals.',
      report_summary:
        'Write a short executive summary from the verified report data. Separate observed facts from recommendations.',
    };
    return `${shared} ${featureGuidance[feature]}`;
  }

  private fallback(request: LlmRequest) {
    if (request.feature === 'manual_bundle_explanation') {
      return 'The bundle score is based on its generated-bundle baseline, margin fit, and weather/calendar context. Configure the assigned GLM provider to generate a detailed explanation.';
    }
    if (request.feature === 'forecast_explanation') {
      return 'Forecast values are available from the WOOF analytics engine. Configure the assigned Qwen provider to generate a narrative summary.';
    }
    if (request.feature === 'recommendation_explanation') {
      return 'This recommendation is based on WOOF bundle and profitability signals. Configure the assigned GLM provider for a detailed rationale.';
    }
    if (request.feature === 'report_summary') {
      return 'The report was generated from verified WOOF analytics. Configure the assigned Qwen provider for an executive narrative.';
    }
    return 'I can help explain WOOF dashboard results, bundles, forecasts, and recommendations once an LLM provider is configured.';
  }
}
