import { Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { RateLimitController } from './rate-limit.controller';
import { RedisModule } from 'src/redis/redis.module';
import { RateLimitGuard } from './rate-limit.guard';

@Module({
  imports: [RedisModule],
  controllers: [RateLimitController],
  providers: [RateLimitService, RateLimitGuard],
  exports: [RateLimitService, RateLimitGuard],
})
export class RateLimitModule {}
