/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Exposes the Prometheus /metrics scrape endpoint with the correct content type.
 */
import { Controller, Get, Res, Version } from '@nestjs/common';
import type { Response } from 'express';

import { Public } from '@common/decorators/public.decorator';
import { RawResponse } from '@common/decorators/raw-response.decorator';

import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Version('1')
  @Public()
  @RawResponse()
  async scrape(@Res({ passthrough: true }) res: Response): Promise<string> {
    res.setHeader('Content-Type', this.metrics.getContentType());
    res.setHeader('Cache-Control', 'no-store');
    return this.metrics.getMetrics();
  }
}
