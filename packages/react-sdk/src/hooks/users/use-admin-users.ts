/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for fetching a paginated list of users as an admin.
 */

import {
  useQuery,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { UsersApi } from '../../api/users.api';
import { type AllServicesApiError } from '../../core/errors';
import type { ListUsersParams, ListUsersResult } from '../../types/users';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useAdminUsers(
  params: ListUsersParams = {},
  options?: Omit<
    UseQueryOptions<ListUsersResult, AllServicesApiError>,
    'queryKey' | 'queryFn'
  >,
) {
  const client = useAllServicesClient();
  const api = new UsersApi(client);

  return useQuery<ListUsersResult, AllServicesApiError>({
    queryKey: queryKeys.users.list(params),
    queryFn: ({ signal }) => api.listUsers(params, { signal }),
    ...options,
  });
}
