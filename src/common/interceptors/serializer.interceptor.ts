/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Global class-transformer serializer that strips @Exclude-marked fields from every response.
 */
import { ClassSerializerInterceptor, Injectable } from '@nestjs/common';

@Injectable()
export class SerializerInterceptor extends ClassSerializerInterceptor {}
