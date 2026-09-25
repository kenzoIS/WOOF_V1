import { Module } from '@nestjs/common';
// [MONGO_DISABLED] import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { WeatherLog, WeatherLogSchema } from './schemas/weather-log.schema';
import {
  HolidayCache,
  HolidayCacheSchema,
} from './schemas/holiday-cache.schema';
import { WeatherService } from './weather.service';
import { HolidayService } from './holiday.service';
import { WeatherController } from './weather.controller';

@Module({
  imports: [
    HttpModule,
    // [MONGO_DISABLED] MongooseModule.forFeature([
    // [MONGO_DISABLED] { name: WeatherLog.name, schema: WeatherLogSchema },
    // [MONGO_DISABLED] { name: HolidayCache.name, schema: HolidayCacheSchema },
    // [MONGO_DISABLED] ]),
  ],
  controllers: [WeatherController],
  providers: [WeatherService, HolidayService],
  // [MONGO_DISABLED] exports: [WeatherService, HolidayService, MongooseModule],
})
export class ContextModule {}
