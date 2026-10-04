import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT) || 3001;

  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '100mb', extended: true }));

  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // ── Security: Global Validation Pipeline ──────────────────────────
  // Rejects payloads with unexpected/injected fields (anti-injection).
  // Skips validation for endpoints without explicit DTOs so existing
  // routes continue to function while DTOs are progressively adopted.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      // Allow endpoints without DTOs to pass through without breaking
      validateCustomDecorators: true,
    }),
  );

  // Enable graceful shutdown to release port on restart
  app.enableShutdownHooks();

  const server = await app.listen(port, '0.0.0.0');
  
  // Increase server timeouts for large CSV processing
  server.setTimeout(600000); // 10 minutes
  server.keepAliveTimeout = 600000;
  server.headersTimeout = 601000;

  console.log(`🐾 WOOF Backend running on 0.0.0.0:${port}`);
}

bootstrap();
