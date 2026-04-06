/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Application entry point that bootstraps Nest with security headers, CORS, validation, versioning, and shutdown hooks.
 */
import { HttpStatus, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';

import appConfig from '@config/app.config';
import corsConfig from '@config/cors.config';
import regionConfig from '@config/region.config';

import { AppModule } from './app.module';

const DEFAULT_API_VERSION = '1';
const BODY_LIMIT = '1mb';
const CORS_MAX_AGE_SECONDS = 86_400;
const TRUST_PROXY_HOPS = 1;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.set('trust proxy', TRUST_PROXY_HOPS);
  app.useLogger(app.get(PinoLogger));

  const appSettings = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const corsSettings = app.get<ConfigType<typeof corsConfig>>(corsConfig.KEY);
  const regionSettings = app.get<ConfigType<typeof regionConfig>>(regionConfig.KEY);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          imgSrc: ["'self'"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      hsts: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use(cookieParser());

  app.enableCors({
    origin: [...corsSettings.allowedOrigins],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-Idempotency-Key',
      'X-Client-Version',
      'X-Client-Platform',
    ],
    exposedHeaders: [
      'X-Request-Id',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Region',
      'X-Read-Only',
    ],
    maxAge: CORS_MAX_AGE_SECONDS,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: DEFAULT_API_VERSION,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  app.use(json({ limit: BODY_LIMIT }));
  app.use(urlencoded({ limit: BODY_LIMIT, extended: true }));

  if (!appSettings.isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AllServices API')
      .setDescription('AllServices platform API documentation')
      .setVersion(appSettings.apiVersion)
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`v${DEFAULT_API_VERSION}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableShutdownHooks();

  await app.listen(appSettings.port, '0.0.0.0');

  if (typeof process.send === 'function') {
    process.send('ready');
  }

  Logger.log(
    `AllServices API listening on 0.0.0.0:${appSettings.port} region=${regionSettings.region} role=${regionSettings.role} env=${appSettings.nodeEnv}`,
    'Bootstrap',
  );
}

void bootstrap();
