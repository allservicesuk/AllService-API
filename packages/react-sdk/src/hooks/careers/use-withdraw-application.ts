/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for withdrawing the current applicant's application via magic link token.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { CareersApplicantApi } from '../../api/careers-applicant.api';
import { type AllServicesApiError } from '../../core/errors';
import type { ApplicationResponse } from '../../types/careers-applications';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useWithdrawApplication(
  options?: UseMutationOptions<
    ApplicationResponse,
    AllServicesApiError,
    string
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersApplicantApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<ApplicationResponse, AllServicesApiError, string>({
    mutationFn: (token: string) => api.withdraw(token),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.careers.applications.my(),
      });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
