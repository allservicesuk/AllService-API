/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for requesting magic link access to an existing application.
 */

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { CareersApplicantApi } from '../../api/careers-applicant.api';
import { type AllServicesApiError } from '../../core/errors';
import type { RequestAccessRequest } from '../../types/careers-applications';
import { useAllServicesClient } from '../use-allservices-client';

export function useRequestAccess(
  options?: UseMutationOptions<
    { readonly sent: boolean },
    AllServicesApiError,
    RequestAccessRequest
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersApplicantApi(client);

  return useMutation<
    { readonly sent: boolean },
    AllServicesApiError,
    RequestAccessRequest
  >({
    mutationFn: (data: RequestAccessRequest) => api.requestAccess(data),
    ...options,
  });
}
