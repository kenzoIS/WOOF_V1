import { Body, Controller, Post } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('ask')
  async ask(
    @Body('question') question: string,
    @Body('history') history?: Array<{ sender?: string; text?: string }>,
  ): Promise<any> {
    return this.chatbotService.answer(question, history);
  }
}
