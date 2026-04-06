/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for changing the current user password via mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { type AllServicesApiError } from '../../core/errors';
import type { ChangePasswordRequest, SuccessResponse } from '../../types/auth';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useChangePassword(
  options?: UseMutationOptions<SuccessResponse, AllServicesApiError, ChangePasswordRequest>,
) {
  const client = useAllServicesClient();
  const api = new AuthApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => api.changePassword(data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.sessions() });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
