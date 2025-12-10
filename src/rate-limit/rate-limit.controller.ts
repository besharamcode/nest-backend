import { Controller, Get, UseGuards } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RateLimitGuard } from './rate-limit.guard';

@Controller('rate-limit')
export class RateLimitController {
  constructor(private readonly rateLimitService: RateLimitService) {}
  @Get('ping')
  @UseGuards(RateLimitGuard)
  ping() {
    return { ok: true, ts: Date.now() };
  }
}
