import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CsvModule } from './csv/csv.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
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
  ],
})
export class AppModule {}
