/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Global database module exposing PRISMA_WRITE and PRISMA_READ Prisma clients as injection tokens.
 */
import { Global, Module } from '@nestjs/common';

import { PRISMA_READ, PRISMA_WRITE } from './database.tokens';
import { PrismaHealthIndicator } from './prisma.health';
import { PrismaReadService } from './prisma-read.service';
import { PrismaWriteService } from './prisma-write.service';

@Global()
@Module({
  providers: [
    { provide: PRISMA_WRITE, useClass: PrismaWriteService },
    { provide: PRISMA_READ, useClass: PrismaReadService },
    PrismaHealthIndicator,
  ],
  exports: [PRISMA_WRITE, PRISMA_READ, PrismaHealthIndicator],
})
export class DatabaseModule {}
