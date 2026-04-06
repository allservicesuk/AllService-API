/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for resetting a user password via mutation.
 */

import {
  useMutation,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { type AllServicesApiError } from '../../core/errors';
import type { ResetPasswordRequest, SuccessResponse } from '../../types/auth';
import { useAllServicesClient } from '../use-allservices-client';

export function useResetPassword(
  options?: UseMutationOptions<SuccessResponse, AllServicesApiError, ResetPasswordRequest>,
) {
  const client = useAllServicesClient();
  const api = new AuthApi(client);

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => api.resetPassword(data),
    ...options,
  });
}
