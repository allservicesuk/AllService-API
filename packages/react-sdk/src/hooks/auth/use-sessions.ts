/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for querying active user sessions.
 */

import {
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { type AllServicesApiError } from '../../core/errors';
import type { SessionInfo } from '../../types/sessions';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useSessions(
  options?: Omit<UseQueryOptions<readonly SessionInfo[], AllServicesApiError>, 'queryKey' | 'queryFn'>,
) {
  const client = useAllServicesClient();
  const api = new AuthApi(client);

  return useQuery({
    queryKey: queryKeys.auth.sessions(),
    queryFn: () => api.getSessions(),
    ...options,
  });
}
