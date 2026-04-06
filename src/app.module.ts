/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Root application module that wires every feature module, global guards, interceptors, filters, and middleware.
 */
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AllExceptionsFilter } from '@common/filters/all-exceptions.filter';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@common/guards/permissions.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ThrottlerBehindProxyGuard } from '@common/guards/throttler-behind-proxy.guard';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { RegionInterceptor } from '@common/interceptors/region.interceptor';
import { SerializerInterceptor } from '@common/interceptors/serializer.interceptor';
import { TimeoutInterceptor } from '@common/interceptors/timeout.interceptor';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RealIpMiddleware } from './common/middleware/real-ip.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { RedisThrottlerStorage } from './common/throttler/redis-throttler.storage';
import { ThrottlerStorageModule } from './common/throttler/throttler-storage.module';
import careersConfig from '@config/careers.config';
import appConfig from '@config/app.config';
import argon2Config from '@config/argon2.config';
import { configValidationOptions, configValidationSchema } from '@config/config.schema';
import corsConfig from '@config/cors.config';
import cryptoConfig from '@config/crypto.config';
import databaseConfig from '@config/database.config';
import jwtConfig from '@config/jwt.config';
import mailConfig from '@config/mail.config';
import posthogConfig from '@config/posthog.config';
import redisConfig from '@config/redis.config';
import regionConfig from '@config/region.config';
import sentryConfig from '@config/sentry.config';
import throttleConfig from '@config/throttle.config';

import { AuditModule } from './audit/audit.module';
import { CryptoModule } from './crypto/crypto.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { CareersModule } from './modules/careers/careers.module';
import { UserModule } from './modules/user/user.module';
import { ObservabilityModule } from './observability/observability.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';
import { RegionModule } from './region/region.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        corsConfig,
        throttleConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        regionConfig,
        sentryConfig,
        mailConfig,
        cryptoConfig,
        posthogConfig,
        argon2Config,
        careersConfig,
      ],
      validationSchema: configValidationSchema,
      validationOptions: configValidationOptions,
    }),
    LoggerModule.forRootAsync({
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) => ({
        pinoHttp: {
          level: config.logLevel,
          autoLogging: false,
          quietReqLogger: true,
          ...(config.isDevelopment
            ? { transport: { target: 'pino-pretty', options: { singleLine: true } } }
            : {}),
        },
      }),
    }),
    EventEmitterModule.forRoot(),
    ThrottlerStorageModule,
    ThrottlerModule.forRootAsync({
      imports: [ThrottlerStorageModule],
      inject: [throttleConfig.KEY, RedisThrottlerStorage],
      useFactory: (config: ConfigType<typeof throttleConfig>, storage: RedisThrottlerStorage) => ({
        throttlers: [{ ttl: config.globalTtlMs, limit: config.globalLimit }],
        storage,
      }),
    }),
    DatabaseModule,
    RedisModule,
    ObservabilityModule,
    RegionModule,
    CryptoModule,
    AuditModule,
    HealthModule,
    MailModule,
    QueueModule,
    UserModule,
    AuthModule,
    CareersModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: RegionInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SerializerInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerBehindProxyGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, CorrelationIdMiddleware, RealIpMiddleware).forRoutes('*');
  }
}
