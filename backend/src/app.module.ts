import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CsvModule } from './csv/csv.module';
import { AnalyticsModule } from './analytics/analytics.module';

import { ScheduleModule } from '@nestjs/schedule';
import { ContextModule } from './context/context.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        if (
          typeof config.MONGODB_URI !== 'string' ||
          !config.MONGODB_URI.trim()
        ) {
          throw new Error('MONGODB_URI must be configured in backend/.env');
        }
        if (/[<>]/.test(config.MONGODB_URI)) {
          throw new Error(
            'MONGODB_URI still contains a placeholder. Replace <db_password> in backend/.env with the MongoDB Atlas database user password.',
          );
        }
        
        if (!config.SUPABASE_URL || typeof config.SUPABASE_URL !== 'string') {
          throw new Error('SUPABASE_URL must be configured in backend/.env');
        }
        if (!config.SUPABASE_SERVICE_ROLE_KEY || typeof config.SUPABASE_SERVICE_ROLE_KEY !== 'string') {
          throw new Error('SUPABASE_SERVICE_ROLE_KEY must be configured in backend/.env');
        }

        return config;
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        retryAttempts: 1,
      }),
    }),
    CsvModule,
    AnalyticsModule,
    ContextModule,
  ],
})
export class AppModule {}
