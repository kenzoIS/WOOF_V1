import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ActivationService } from './activation.service';

@Controller('activation')
export class ActivationController {
  constructor(private readonly activationService: ActivationService) {}

  @Get('recommendations')
  async getRecommendations(): Promise<any> {
    return this.activationService.getActivationRecommendations();
  }

  @Get('campaigns')
  async getCampaigns(): Promise<any> {
    return this.activationService.getCampaigns();
  }

  @Post('campaigns/generate')
  async generateCampaign(@Body() body: Record<string, unknown>): Promise<any> {
    return this.activationService.generateCampaign(body);
  }

  @Patch('campaigns/:campaignId/status')
  async updateCampaignStatus(
    @Param('campaignId') campaignId: string,
    @Body('status') status: 'draft' | 'approved' | 'queued' | 'published',
  ): Promise<any> {
    return this.activationService.updateCampaignStatus(campaignId, status);
  }
}
