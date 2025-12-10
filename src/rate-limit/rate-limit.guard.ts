/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(private readonly rl: RateLimitService) {}

  async canActivate(context: ExecutionContext) {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    // FASTIFY-COMPATIBLE ROUTE (Express route removed)
    const route: string =
      req.routerPath || // Fastify route
      req.url || // fallback
      'unknown_route';

    // IDENTIFIER (user > api key > IP)
    const id: string =
      req.user?.id ||
      req.headers['x-api-key'] ||
      req.ip ||
      req.headers['x-forwarded-for'] ||
      'anon';

    const key = `${route}:${id}`.replace(/\s+/g, '_');
    // RATE LIMIT CONFIG
    const ratePerSecond = Number(process.env.RL_RATE_PER_SEC || 5);
    const capacity = Number(process.env.RL_CAPACITY || 10);
    const cost = 1;
    const { allowed, remaining } = await this.rl.allow(
      key,
      ratePerSecond,
      capacity,
      cost,
    );
    // SET HEADERS (FASTIFY ONLY)
    res.header('X-RateLimit-Remaining', Math.floor(remaining));
    res.header('X-RateLimit-Limit', capacity);
    // BLOCK IF LIMIT EXCEEDED
    if (!allowed) {
      this.logger.warn(`Rate limit exceeded for key=${key}`);
      throw new ForbiddenException('Rate limit exceeded');
    }

    return true;
  }
}
