/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for locking a user account as an admin via mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { UsersApi } from '../../api/users.api';
import { type AllServicesApiError } from '../../core/errors';
import type { LockUserRequest } from '../../types/users';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

interface AdminLockUserVariables {
  readonly id: string;
  readonly data: LockUserRequest;
}

export function useAdminLockUser(
  options?: UseMutationOptions<void, AllServicesApiError, AdminLockUserVariables>,
) {
  const client = useAllServicesClient();
  const api = new UsersApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: ({ id, data }: AdminLockUserVariables) => api.lockUser(id, data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
