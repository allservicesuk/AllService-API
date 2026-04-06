/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for updating an existing job posting as an admin.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { CareersAdminApi } from '../../api/careers-admin.api';
import { type AllServicesApiError } from '../../core/errors';
import type {
  PostingResponse,
  UpdatePostingRequest,
} from '../../types/careers-postings';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

interface UpdatePostingVariables {
  readonly id: string;
  readonly data: UpdatePostingRequest;
}

export function useAdminUpdatePosting(
  options?: UseMutationOptions<
    PostingResponse,
    AllServicesApiError,
    UpdatePostingVariables
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<
    PostingResponse,
    AllServicesApiError,
    UpdatePostingVariables
  >({
    mutationFn: (variables: UpdatePostingVariables) =>
      api.updatePosting(variables.id, variables.data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.careers.postings.all,
      });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
