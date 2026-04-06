/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for initiating a forgot-password flow via mutation.
 */

import {
  useMutation,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { type AllServicesApiError } from '../../core/errors';
import type { ForgotPasswordRequest, SuccessMessageResponse } from '../../types/auth';
import { useAllServicesClient } from '../use-allservices-client';

export function useForgotPassword(
  options?: UseMutationOptions<SuccessMessageResponse, AllServicesApiError, ForgotPasswordRequest>,
) {
  const client = useAllServicesClient();
  const api = new AuthApi(client);

  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => api.forgotPassword(data),
    ...options,
  });
}
