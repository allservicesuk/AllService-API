/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for updating an existing user as an admin via mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { UsersApi } from '../../api/users.api';
import { type AllServicesApiError } from '../../core/errors';
import type { AdminUpdateUserRequest, UserResponse } from '../../types/users';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

interface AdminUpdateUserVariables {
  readonly id: string;
  readonly data: AdminUpdateUserRequest;
}

export function useAdminUpdateUser(
  options?: UseMutationOptions<UserResponse, AllServicesApiError, AdminUpdateUserVariables>,
) {
  const client = useAllServicesClient();
  const api = new UsersApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: ({ id, data }: AdminUpdateUserVariables) => api.updateUser(id, data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
