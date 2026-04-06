/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Top-level provider combining HTTP client, auth state, and TanStack QueryClient.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { AllServicesClient } from '../core/http-client';
import type { ClientConfig } from '../core/http-client.types';
import type { AuthResponseUser } from '../types/auth';

import { AllServicesContext } from './allservices-context';
import { AuthContext, type AuthState } from './auth-context';

export interface AllServicesProviderProps {
  readonly config: ClientConfig;
  readonly queryClient?: QueryClient;
  readonly children: ReactNode;
}

export function AllServicesProvider({
  config,
  queryClient: externalQueryClient,
  children,
}: AllServicesProviderProps): ReactNode {
  const configRef = useRef(config);
  configRef.current = config;

  const client = useMemo(
    () => new AllServicesClient(configRef.current),
    [configRef.current.baseUrl, configRef.current.region, configRef.current.platform],
  );

  const defaultQueryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [],
  );

  const queryClient = externalQueryClient ?? defaultQueryClient;

  const [user, setUser] = useState<AuthResponseUser | null>(null);

  const setAuth = useCallback(
    (authUser: AuthResponseUser, accessToken: string) => {
      client.tokenManager.setAccessToken(accessToken);
      setUser(authUser);
    },
    [client],
  );

  const clearAuth = useCallback(() => {
    client.tokenManager.clearAccessToken();
    setUser(null);
    queryClient.clear();
  }, [client, queryClient]);

  const authState: AuthState = useMemo(
    () => ({
      isAuthenticated: user !== null,
      user,
      setAuth,
      clearAuth,
    }),
    [user, setAuth, clearAuth],
  );

  return (
    <AllServicesContext.Provider value={client}>
      <AuthContext.Provider value={authState}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </AuthContext.Provider>
    </AllServicesContext.Provider>
  );
}
