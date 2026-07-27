import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabaseClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase URL or Key not provided in configuration. Database operations targeting Supabase may fail.');
    } else {
      this.supabaseClient = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized successfully.');
    }
  }

  public get client(): SupabaseClient {
    if (!this.supabaseClient) {
      throw new Error('Supabase client is not initialized.');
    }
    return this.supabaseClient;
  }
}
