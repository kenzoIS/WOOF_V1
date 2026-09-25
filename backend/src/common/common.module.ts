import { Module } from '@nestjs/common';
// [MONGO_DISABLED] import { MongooseModule } from '@nestjs/mongoose';
import { ExogenousDataService } from './exogenous-data.service';
import {
  HolidayCache,
  HolidayCacheSchema,
} from './schemas/holiday-cache.schema';
import {
  WeatherCache,
  WeatherCacheSchema,
} from './schemas/weather-cache.schema';

@Module({
  imports: [
    // [MONGO_DISABLED] MongooseModule.forFeature([
    // [MONGO_DISABLED] { name: WeatherCache.name, schema: WeatherCacheSchema },
    // [MONGO_DISABLED] { name: HolidayCache.name, schema: HolidayCacheSchema },
    // [MONGO_DISABLED] ]),
  ],
  providers: [ExogenousDataService],
  exports: [ExogenousDataService],
})
export class CommonModule {}
