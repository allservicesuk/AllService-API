/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for user logout via mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { type AllServicesApiError } from '../../core/errors';
import { useAllServicesClient } from '../use-allservices-client';

export function useLogout(
  options?: UseMutationOptions<void, AllServicesApiError, void>,
) {
  const client = useAllServicesClient();
  const api = new AuthApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.clear();
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
