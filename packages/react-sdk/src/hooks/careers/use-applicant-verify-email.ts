/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for verifying an applicant email address before submission.
 */

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { CareersApplicantApi } from '../../api/careers-applicant.api';
import { type AllServicesApiError } from '../../core/errors';
import type { VerifyApplicationEmailRequest } from '../../types/careers-applications';
import { useAllServicesClient } from '../use-allservices-client';

export function useApplicantVerifyEmail(
  options?: UseMutationOptions<
    { readonly sent: boolean },
    AllServicesApiError,
    VerifyApplicationEmailRequest
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersApplicantApi(client);

  return useMutation<
    { readonly sent: boolean },
    AllServicesApiError,
    VerifyApplicationEmailRequest
  >({
    mutationFn: (data: VerifyApplicationEmailRequest) => api.verifyEmail(data),
    ...options,
  });
}
