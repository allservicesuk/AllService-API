/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for sending a message on an application as an admin.
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { CareersAdminApi } from '../../api/careers-admin.api';
import { type AllServicesApiError } from '../../core/errors';
import type { MessageResponse, SendMessageRequest } from '../../types/careers-messages';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

interface AdminSendMessageVariables {
  readonly applicationId: string;
  readonly data: SendMessageRequest;
}

export function useAdminSendMessage(
  options?: UseMutationOptions<
    MessageResponse,
    AllServicesApiError,
    AdminSendMessageVariables
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<
    MessageResponse,
    AllServicesApiError,
    AdminSendMessageVariables
  >({
    mutationFn: (variables: AdminSendMessageVariables) =>
      api.sendMessage(variables.applicationId, variables.data),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.careers.applications.adminMessages(
          variables.applicationId,
        ),
      });
      onSuccess?.(data, variables, onMutateResult, context);
    },
    ...restOptions,
  });
}
