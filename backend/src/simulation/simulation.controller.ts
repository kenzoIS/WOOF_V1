import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SupabaseService } from '../common/supabase/supabase.service';
import { SimulationService } from './simulation.service';
import type { SimConfig, SimInputs, SimEvent } from './simulation.types';

@Controller('simulation')
export class SimulationController {
  constructor(
    private readonly simulation: SimulationService,
    private readonly supabase: SupabaseService,
  ) {}
  private async user(authorization?: string) {
    if (!authorization?.startsWith('Bearer '))
      throw new UnauthorizedException('Sign in to use Operations What-If.');
    const { data, error } = await this.supabase.client.auth.getUser(
      authorization.slice(7),
    );
    if (error || !data.user)
      throw new UnauthorizedException(
        'Your session expired. Please sign in again.',
      );
    return data.user;
  }
  @Get('inputs')
  async inputs(
    @Headers('authorization') auth: string,
    @Query('source') source = 'historical',
    @Query('date') date: string,
    @Query('startDate') start?: string,
    @Query('endDate') end?: string,
  ) {
    await this.user(auth);
    return this.simulation.inputs(source, date, start, end);
  }
  @Post('runs')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async run(
    @Headers('authorization') auth: string,
    @Body() body: { inputs: SimInputs; baseline: SimConfig; whatIf: SimConfig },
  ) {
    const user = await this.user(auth);
    return this.simulation.execute(body, user.id, user.email || user.id);
  }
  @Post('runs/:id/inject')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async inject(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: { minute: number; event: SimEvent },
  ) {
    const user = await this.user(auth);
    return this.simulation.inject(
      id,
      user.id,
      user.email || user.id,
      body.minute,
      body.event,
    );
  }
  @Get('runs')
  async history(@Headers('authorization') auth: string) {
    const user = await this.user(auth);
    return this.simulation.history(user.id);
  }
  @Get('runs/:id')
  async reopen(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    const user = await this.user(auth);
    return this.simulation.reopen(id, user.id);
  }
}
