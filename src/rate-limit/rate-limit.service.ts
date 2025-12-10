/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';

@Injectable()
export class RateLimitService implements OnModuleInit {
  private readonly logger = new Logger(RateLimitService.name);
  private lua: string;
  private redis: Redis;
  private scriptSha: string | null = null;
  private readonly prefix = process.env.RL_PREFIX || 'rl:'; // namespace

  constructor(@Inject('REDIS_CLIENT') redis: Redis) {
    this.redis = redis;
    this.lua = fs.readFileSync(
      path.resolve(__dirname, '../../rate-limit.lua'),
      'utf8',
    );
  }
  async onModuleInit() {
    // define command via SHA or defineCommand for convenience
    try {
      // Try LOAD the script and keep SHA for EVALSHA
      this.scriptSha = (await this.redis.script('LOAD', this.lua)) as string;
      this.logger.log('Loaded rate-limit lua script, sha=' + this.scriptSha);
    } catch (err) {
      this.logger.error('Failed to load rate-limit lua script', err);
      // fallback: define as custom command (ioredis defineCommand)
      (this.redis as any).defineCommand('tokenBucket', {
        numberOfKeys: 1,
        lua: this.lua,
      });
      this.scriptSha = null;
    }
  }

  /**
   * Attempt to use token bucket
   * key - unique bucket id already namespaced (e.g. 'rl:login:ip:1.2.3.4')
   * ratePerSecond - tokens/second
   * capacity - max burst
   * cost - tokens to consume (default 1)
   */
  async allow(key: string, ratePerSecond = 5, capacity = 10, cost = 1) {
    const now = Date.now();
    const ratePerMs = ratePerSecond / 1000.0;
    const redisKey = this.prefix + key;
    try {
      // Prefer EVALSHA for performance if scriptSha is available
      if (this.scriptSha) {
        const res = (await this.redis.evalsha(
          this.scriptSha,
          1,
          redisKey,
          now,
          ratePerMs,
          capacity,
          cost,
        )) as unknown[];
        // res[0] => allowed (1/0), res[1] => tokens
        return {
          allowed: res[0] === 1,
          remaining: parseFloat(res[1] as string),
        };
      }
      // else, call defined command
      if ((this.redis as any).tokenBucket) {
        const res = await (this.redis as any).tokenBucket(
          redisKey,
          now,
          ratePerMs,
          capacity,
          cost,
        );
        return {
          allowed: res[0] === 1,
          remaining: parseFloat(res[1] as string),
        };
      }

      // fallback: EVAL (less efficient)
      const res = (await this.redis.eval(
        this.lua,
        1,
        redisKey,
        now,
        ratePerMs,
        capacity,
        cost,
      )) as unknown[];
      return { allowed: res[0] === 1, remaining: parseFloat(res[1] as string) };
    } catch (err) {
      this.logger.error('RateLimitService.allow failed', err);
      // Fail-open or fail-closed? Choose fail-open to avoid blocking users when Redis down.
      return { allowed: true, remaining: Number.MAX_SAFE_INTEGER };
    }
  }
}
