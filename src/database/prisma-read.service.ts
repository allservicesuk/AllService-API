/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Prisma client bound to DATABASE_READ_URL; routes reads to the local replica in each region.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import appConfig from '@config/app.config';
import databaseConfig from '@config/database.config';

import { PrismaBaseService } from './prisma-base.service';
import { buildPrismaConnectionUrl } from './prisma-url.util';

@Injectable()
export class PrismaReadService extends PrismaBaseService {
  constructor(
    @Inject(databaseConfig.KEY) dbConfig: ConfigType<typeof databaseConfig>,
    @Inject(appConfig.KEY) app: ConfigType<typeof appConfig>,
  ) {
    super(
      buildPrismaConnectionUrl(dbConfig.read, dbConfig.ssl, dbConfig.statementTimeout),
      app.isDevelopment,
      new Logger(PrismaReadService.name),
    );
  }
}
