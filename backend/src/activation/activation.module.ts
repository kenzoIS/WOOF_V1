import { Module } from '@nestjs/common';
// [MONGO_DISABLED] import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsModule } from '../analytics/analytics.module';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { ActivationController } from './activation.controller';
import { ActivationService } from './activation.service';
import {
  CampaignActivation,
  CampaignActivationSchema,
} from './schemas/campaign-activation.schema';

@Module({
  imports: [
    AnalyticsModule,
    SupabaseModule,
    RealtimeModule,
    // [MONGO_DISABLED] MongooseModule.forFeature([
    // [MONGO_DISABLED] { name: CampaignActivation.name, schema: CampaignActivationSchema },
    // [MONGO_DISABLED] ]),
  ],
  controllers: [ActivationController],
  providers: [ActivationService],
})
export class ActivationModule {}
