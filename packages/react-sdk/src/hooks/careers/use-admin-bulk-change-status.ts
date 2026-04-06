/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for bulk-changing the status of multiple applications as an admin.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { CareersAdminApi } from '../../api/careers-admin.api';
import { type AllServicesApiError } from '../../core/errors';
import type {
  BulkChangeStatusRequest,
  BulkChangeStatusResult,
} from '../../types/careers-applications';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useAdminBulkChangeStatus(
  options?: UseMutationOptions<
    BulkChangeStatusResult,
    AllServicesApiError,
    BulkChangeStatusRequest
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<
    BulkChangeStatusResult,
    AllServicesApiError,
    BulkChangeStatusRequest
  >({
    mutationFn: (data: BulkChangeStatusRequest) => api.bulkChangeStatus(data),
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
