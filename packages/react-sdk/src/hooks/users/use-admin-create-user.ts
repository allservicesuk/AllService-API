/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for creating a new user as an admin via mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { UsersApi } from '../../api/users.api';
import { type AllServicesApiError } from '../../core/errors';
import type { AdminCreateUserRequest, UserResponse } from '../../types/users';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useAdminCreateUser(
  options?: UseMutationOptions<UserResponse, AllServicesApiError, AdminCreateUserRequest>,
) {
  const client = useAllServicesClient();
  const api = new UsersApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: (data: AdminCreateUserRequest) => api.createUser(data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
