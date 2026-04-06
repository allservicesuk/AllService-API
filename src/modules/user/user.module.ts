/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Business module that owns the User entity and exports UserService and UserMapper.
 */
import { forwardRef, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AuthModule } from '../auth/auth.module';

import { SelfOrAdminGuard } from './guards/self-or-admin.guard';
import { UserController } from './user.controller';
import { UserMapper } from './user.mapper';
import { UserService } from './user.service';

@Module({
  imports: [EventEmitterModule.forRoot(), forwardRef(() => AuthModule)],
  controllers: [UserController],
  providers: [UserService, UserMapper, SelfOrAdminGuard],
  exports: [UserService, UserMapper],
})
export class UserModule {}
