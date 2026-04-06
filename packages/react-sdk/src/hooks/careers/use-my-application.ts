/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for fetching the current applicant's application via magic link token.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CareersApplicantApi } from '../../api/careers-applicant.api';
import { type AllServicesApiError } from '../../core/errors';
import type { ApplicationResponse } from '../../types/careers-applications';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useMyApplication(
  token: string,
  options?: Omit<
    UseQueryOptions<ApplicationResponse, AllServicesApiError>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersApplicantApi(client);

  return useQuery<ApplicationResponse, AllServicesApiError>({
    queryKey: queryKeys.careers.applications.my(),
    queryFn: () => api.getMyApplication(token),
    enabled: token.length > 0,
    ...options,
  });
}
