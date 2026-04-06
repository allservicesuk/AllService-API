/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for verifying and enabling MFA after setup via mutation.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { type AllServicesApiError } from '../../core/errors';
import type { EnableMfaRequest, SuccessResponse } from '../../types/auth';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useMfaVerifySetup(
  options?: UseMutationOptions<SuccessResponse, AllServicesApiError, EnableMfaRequest>,
) {
  const client = useAllServicesClient();
  const api = new AuthApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation({
    mutationFn: (data: EnableMfaRequest) => api.verifyMfaSetup(data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me() });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
