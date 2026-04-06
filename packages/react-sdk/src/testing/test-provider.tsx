/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Test wrapper provider with pre-configured QueryClient for component tests.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useMemo } from 'react';

import { AllServicesClient } from '../core/http-client';
import type { ClientConfig } from '../core/http-client.types';
import { AllServicesContext } from '../provider/allservices-context';

export interface TestProviderProps {
  readonly config?: Partial<ClientConfig>;
  readonly client?: AllServicesClient;
  readonly children: ReactNode;
}

const DEFAULT_TEST_CONFIG: ClientConfig = {
  baseUrl: 'http://localhost:3000',
  region: 'eu',
  platform: 'web',
};

export function AllServicesTestProvider({
  config,
  client: externalClient,
  children,
}: TestProviderProps): ReactNode {
  const client = useMemo(
    () =>
      externalClient ??
      new AllServicesClient({ ...DEFAULT_TEST_CONFIG, ...config }),
    [externalClient, config],
  );

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            gcTime: 0,
          },
          mutations: {
            retry: false,
          },
        },
      }),
    [],
  );

  return (
    <AllServicesContext.Provider value={client}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AllServicesContext.Provider>
  );
}
