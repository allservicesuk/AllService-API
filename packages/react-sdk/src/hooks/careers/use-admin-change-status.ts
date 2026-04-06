/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for changing the status of a single application as an admin.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { CareersAdminApi } from '../../api/careers-admin.api';
import { type AllServicesApiError } from '../../core/errors';
import type {
  ApplicationResponse,
  ChangeStatusRequest,
} from '../../types/careers-applications';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

interface ChangeStatusVariables {
  readonly id: string;
  readonly data: ChangeStatusRequest;
}

export function useAdminChangeStatus(
  options?: UseMutationOptions<
    ApplicationResponse,
    AllServicesApiError,
    ChangeStatusVariables
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<
    ApplicationResponse,
    AllServicesApiError,
    ChangeStatusVariables
  >({
    mutationFn: (variables: ChangeStatusVariables) =>
      api.changeStatus(variables.id, variables.data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.careers.applications.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.careers.analytics(),
      });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
