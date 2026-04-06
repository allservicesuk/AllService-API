/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for fetching the current applicant's messages via magic link token.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CareersApplicantApi } from '../../api/careers-applicant.api';
import { type AllServicesApiError } from '../../core/errors';
import type { MessageResponse } from '../../types/careers-messages';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useMyMessages(
  token: string,
  options?: Omit<
    UseQueryOptions<readonly MessageResponse[], AllServicesApiError>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersApplicantApi(client);

  return useQuery<readonly MessageResponse[], AllServicesApiError>({
    queryKey: queryKeys.careers.applications.myMessages(),
    queryFn: () => api.getMyMessages(token),
    enabled: token.length > 0,
    ...options,
  });
}
