/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for user registration via mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { type AllServicesApiError } from '../../core/errors';
import type { AuthResponse, RegisterRequest } from '../../types/auth';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useRegister(
  options?: UseMutationOptions<AuthResponse, AllServicesApiError, RegisterRequest>,
) {
  const client = useAllServicesClient();
  const api = new AuthApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: (data: RegisterRequest) => api.register(data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
