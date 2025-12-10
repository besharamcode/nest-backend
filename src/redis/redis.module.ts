import { Module } from '@nestjs/common';
import Redis, { ClusterNode, ClusterOptions } from 'ioredis';
import { RedisService } from './redis.service';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const isProd = process.env.NODE_ENV === 'production';

        // ------------------------------------------------------
        // 🚀 PRODUCTION — Redis Cluster
        // ------------------------------------------------------
        if (isProd) {
          const nodes: ClusterNode[] = [
            { host: process.env.REDIS_NODE_1!, port: 6379 },
            { host: process.env.REDIS_NODE_2!, port: 6379 },
            { host: process.env.REDIS_NODE_3!, port: 6379 },
          ];

          const options: ClusterOptions = {
            scaleReads: 'all',
            slotsRefreshTimeout: 2000,
            slotsRefreshInterval: 5000,
            redisOptions: {
              enableReadyCheck: true,
              maxRetriesPerRequest: 5,
              reconnectOnError: () => true,
            },
          };

          console.log('🚀 Redis: Running in CLUSTER mode');
          return new Redis.Cluster(nodes, options);
        }

        // ------------------------------------------------------
        // 👨‍💻 DEVELOPMENT — Local Single Node
        // ------------------------------------------------------
        console.log('👨‍💻 Redis: Running in LOCAL SINGLE NODE mode');
        return new Redis({
          host: process.env.REDIS_HOST ?? '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          enableReadyCheck: true,
          maxRetriesPerRequest: 5,
        });
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
