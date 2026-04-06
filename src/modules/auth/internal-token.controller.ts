/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Internal endpoint for replica regions to request JWT access-token signing from the primary.
 */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Post,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { ErrorCode } from '@common/constants';
import { Public } from '@common/decorators/public.decorator';
import { InternalApiGuard } from '@common/guards/internal-api.guard';
import regionConfig from '@config/region.config';

import { InternalSignDto } from './dto/internal-sign.dto';
import { TokenService } from './token.service';

@Controller('internal/tokens')
export class InternalTokenController {
  constructor(
    private readonly tokenService: TokenService,
    @Inject(regionConfig.KEY) private readonly region: ConfigType<typeof regionConfig>,
  ) {}

  @Post('sign')
  @Version('1')
  @Public()
  @UseGuards(InternalApiGuard)
  @HttpCode(HttpStatus.OK)
  async sign(@Body() dto: InternalSignDto): Promise<{ accessToken: string }> {
    if (!this.region.isPrimary) {
      throw new InternalServerErrorException({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Token signing is only available on the primary region',
      });
    }
    const accessToken = await this.tokenService.generateAccessToken({
      sub: dto.sub,
      email: dto.email,
      roles: dto.roles,
      permissions: dto.permissions,
      tenantId: dto.tenantId,
      jti: dto.jti,
    });
    return { accessToken };
  }
}
