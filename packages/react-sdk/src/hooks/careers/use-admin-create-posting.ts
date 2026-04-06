/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for creating a new job posting as an admin.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { CareersAdminApi } from '../../api/careers-admin.api';
import { type AllServicesApiError } from '../../core/errors';
import type {
  CreatePostingRequest,
  PostingResponse,
} from '../../types/careers-postings';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useAdminCreatePosting(
  options?: UseMutationOptions<
    PostingResponse,
    AllServicesApiError,
    CreatePostingRequest
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<
    PostingResponse,
    AllServicesApiError,
    CreatePostingRequest
  >({
    mutationFn: (data: CreatePostingRequest) => api.createPosting(data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.careers.postings.all,
      });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
