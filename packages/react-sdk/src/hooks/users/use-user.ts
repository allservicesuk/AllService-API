/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for fetching a single user by ID.
 */

import {
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { UsersApi } from '../../api/users.api';
import { type AllServicesApiError } from '../../core/errors';
import type { UserResponse } from '../../types/users';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useUser(
  id: string,
  options?: Omit<
    UseQueryOptions<UserResponse, AllServicesApiError>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const client = useAllServicesClient();
  const api = new UsersApi(client);

  return useQuery<UserResponse, AllServicesApiError>({
    queryKey: queryKeys.users.detail(id),
    queryFn: ({ signal }) => api.getUser(id, { signal }),
    enabled: !!id,
    ...options,
  });
}
