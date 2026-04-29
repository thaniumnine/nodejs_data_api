import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { env } from './config/env';

function parseCorsOrigins(value: string): string[] | boolean {
  if (value === '*') return true;
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true })
  );

  await app.register(helmet);

  app.enableCors({
    origin: parseCorsOrigins(env.CORS_ORIGIN),
    credentials: true
  });

  app.setGlobalPrefix('api/v1');

  await app.listen(env.PORT, '0.0.0.0');
}

void bootstrap();
