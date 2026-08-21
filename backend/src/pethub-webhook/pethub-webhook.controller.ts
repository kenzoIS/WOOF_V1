import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PetHubWebhookService } from './pethub-webhook.service';

@Controller('pethub/webhook')
export class PetHubWebhookController {
  constructor(private readonly pethubWebhookService: PetHubWebhookService) {}

  @Post('transactions')
  async receiveCompletedTransaction(
    @Body() payload: unknown,
    @Headers('x-pethub-webhook-secret') secret?: string,
  ) {
    return this.pethubWebhookService.receiveCompletedTransaction(
      payload,
      secret,
    );
  }
}
