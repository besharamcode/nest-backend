import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cluster } from 'ioredis';
import * as zlib from 'zlib';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Cluster, // <-- FIXED
  ) {}

  private compress(value: unknown): string {
    const json = JSON.stringify(value);
    return zlib.deflateSync(json).toString('base64');
  }

  private safeJsonParse<T>(json: string): T {
    return JSON.parse(json) as T;
  }

  private decompress<T>(value: string): T {
    const buffer = Buffer.from(value, 'base64');
    const json = zlib.inflateSync(buffer).toString('utf-8');
    return this.safeJsonParse<T>(json);
  }

  async set(key: string, value: unknown, ttl = 60): Promise<void> {
    try {
      const compressed = this.compress(value);
      await this.redis.set(key, compressed, 'EX', ttl);
    } catch (err) {
      this.logger.error(
        'Redis SET failed:',
        err instanceof Error ? err.message : `${err}`,
      );
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return this.decompress<T>(value);
    } catch (err) {
      this.logger.error(
        'Redis GET failed:',
        err instanceof Error ? err.message : `${err}`,
      );
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.error(
        'Redis DEL failed:',
        err instanceof Error ? err.message : `${err}`,
      );
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.redis.exists(key);
    } catch (err) {
      this.logger.error(
        'Redis EXISTS failed:',
        err instanceof Error ? err.message : `${err}`,
      );
      return 0;
    }
  }
}
