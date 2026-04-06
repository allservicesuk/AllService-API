/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for initiating MFA setup via mutation.
 */

import {
  useMutation,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { AuthApi } from '../../api/auth.api';
import { type AllServicesApiError } from '../../core/errors';
import type { MfaSetupResult } from '../../types/mfa';
import { useAllServicesClient } from '../use-allservices-client';

export function useMfaSetup(
  options?: UseMutationOptions<MfaSetupResult, AllServicesApiError, void>,
) {
  const client = useAllServicesClient();
  const api = new AuthApi(client);

  return useMutation({
    mutationFn: () => api.setupMfa(),
    ...options,
  });
}
