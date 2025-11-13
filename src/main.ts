import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import fastifyMultipart from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  const configService = app.get(ConfigService);

  // Register Fastify plugins
  await app.register(fastifyHelmet);
  await app.register(fastifyCors, {
    origin: [configService.get('CORS_ORIGIN') || 'http://localhost:3000'],
    credentials: true,
  });

  await app.register(fastifyMultipart, {
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 1000000, // Max field value size in bytes
      fields: 10, // Max number of non-file fields
      fileSize: 1000000, // For multipart/form-data, the max file size in bytes
      files: 5, // Max number of file fields
    },
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port: number = configService.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
}
void bootstrap();
