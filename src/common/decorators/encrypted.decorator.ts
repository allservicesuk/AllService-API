/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Marks a route as only callable over an ECDH-negotiated encrypted session.
 */
import { SetMetadata } from '@nestjs/common';

export const ENCRYPTED_ONLY_KEY = 'encryptedOnly';

export const EncryptedOnly = (): ReturnType<typeof SetMetadata> =>
  SetMetadata(ENCRYPTED_ONLY_KEY, true);
