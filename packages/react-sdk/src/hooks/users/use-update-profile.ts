/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for updating the current user's profile via mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { UsersApi } from '../../api/users.api';
import { type AllServicesApiError } from '../../core/errors';
import type { UpdateProfileRequest, UserResponse } from '../../types/users';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useUpdateProfile(
  options?: UseMutationOptions<UserResponse, AllServicesApiError, UpdateProfileRequest>,
) {
  const client = useAllServicesClient();
  const api = new UsersApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => api.updateMe(data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
