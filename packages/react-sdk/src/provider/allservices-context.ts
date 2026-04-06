/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React context for the AllServicesClient instance.
 */
import { createContext, useContext } from 'react';

import type { AllServicesClient } from '../core/http-client';

export const AllServicesContext = createContext<AllServicesClient | null>(null);

export function useAllServicesClientContext(): AllServicesClient {
  const client = useContext(AllServicesContext);
  if (!client) {
    throw new Error(
      'useAllServicesClient must be used within an <AllServicesProvider>',
    );
  }
  return client;
}
