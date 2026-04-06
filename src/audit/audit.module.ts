/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Global audit module exposing AuditService and the opt-in AuditInterceptor.
 */
import { Global, Module } from '@nestjs/common';

import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [AuditService, AuditInterceptor],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
