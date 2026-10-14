import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MfaEnrollmentRateLimitSchema, MfaEnrollmentRateLimitService } from './mfa-enrollment-rate-limit.service';

@Module({
  imports: [
    SupabaseModule,
    MongooseModule.forFeature([
      { name: 'MfaEnrollmentRateLimit', schema: MfaEnrollmentRateLimitSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, MfaEnrollmentRateLimitService],
})
export class AuthModule {}
