/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Crypto module wiring master key provider, at-rest CryptoService, and ECDH key exchange services.
 */
import { Module } from '@nestjs/common';

import { CryptoService } from './crypto.service';
import { CRYPTO_REST_KEY, CRYPTO_TOKEN_KEY } from './crypto.tokens';
import { KeyExchangeService } from './key-exchange.service';
import { KeyStoreService } from './key-store.service';
import { MasterKeyProvider } from './master-key.provider';

@Module({
  providers: [
    MasterKeyProvider,
    {
      provide: CRYPTO_REST_KEY,
      useFactory: (provider: MasterKeyProvider): ReturnType<MasterKeyProvider['getRestKeySet']> =>
        provider.getRestKeySet(),
      inject: [MasterKeyProvider],
    },
    {
      provide: CRYPTO_TOKEN_KEY,
      useFactory: (provider: MasterKeyProvider): Buffer => provider.getTokenKey(),
      inject: [MasterKeyProvider],
    },
    CryptoService,
    KeyStoreService,
    KeyExchangeService,
  ],
  exports: [CryptoService, KeyStoreService, KeyExchangeService],
})
export class CryptoModule {}
