/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for submitting a new job application with file upload support.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { CareersApplicantApi } from '../../api/careers-applicant.api';
import { type AllServicesApiError } from '../../core/errors';
import type {
  ApplicationResponse,
  SubmitApplicationRequest,
} from '../../types/careers-applications';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useSubmitApplication(
  options?: UseMutationOptions<
    ApplicationResponse,
    AllServicesApiError,
    SubmitApplicationRequest
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersApplicantApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<
    ApplicationResponse,
    AllServicesApiError,
    SubmitApplicationRequest
  >({
    mutationFn: (data: SubmitApplicationRequest) =>
      api.submitApplication(data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.careers.applications.my(),
      });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
