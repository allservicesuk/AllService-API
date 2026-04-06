/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for sending a message as an applicant via magic link token.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { CareersApplicantApi } from '../../api/careers-applicant.api';
import { type AllServicesApiError } from '../../core/errors';
import type { MessageResponse, SendMessageRequest } from '../../types/careers-messages';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

interface SendMyMessageVariables {
  readonly token: string;
  readonly data: SendMessageRequest;
}

export function useSendMyMessage(
  options?: UseMutationOptions<
    MessageResponse,
    AllServicesApiError,
    SendMyMessageVariables
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersApplicantApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<
    MessageResponse,
    AllServicesApiError,
    SendMyMessageVariables
  >({
    mutationFn: (variables: SendMyMessageVariables) =>
      api.sendMyMessage(variables.token, variables.data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.careers.applications.myMessages(),
      });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
