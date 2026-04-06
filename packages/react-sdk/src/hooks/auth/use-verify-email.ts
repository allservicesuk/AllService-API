/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for verifying a user email address via mutation.
 */

import {
  useMutation,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { type AllServicesApiError } from '../../core/errors';
import type { SuccessResponse, VerifyEmailRequest } from '../../types/auth';
import { useAllServicesClient } from '../use-allservices-client';

export function useVerifyEmail(
  options?: UseMutationOptions<SuccessResponse, AllServicesApiError, VerifyEmailRequest>,
) {
  const client = useAllServicesClient();
  const api = new AuthApi(client);

  return useMutation({
    mutationFn: (data: VerifyEmailRequest) => api.verifyEmail(data),
    ...options,
  });
}
