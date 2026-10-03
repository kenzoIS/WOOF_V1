import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SupabaseService } from './src/common/supabase/supabase.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const supabase = app.get(SupabaseService);
  const { data, error } = await supabase.client
    .from('fact_cross_channel_transactions')
    .select('product_id, product_dim!inner(category)')
    .in('product_dim.category', ['Coffee', 'Pasta/snacks', 'Rice meals', 'Non-caffeine'])
    .limit(5);
  console.log(data || error);
  await app.close();
}
bootstrap();
