/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for fetching career analytics data in the admin dashboard.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CareersAdminApi } from '../../api/careers-admin.api';
import { type AllServicesApiError } from '../../core/errors';
import type { CareerAnalytics } from '../../types/careers-analytics';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useAdminAnalytics(
  options?: Omit<
    UseQueryOptions<CareerAnalytics, AllServicesApiError>,
    'queryKey' | 'queryFn'
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);

  return useQuery<CareerAnalytics, AllServicesApiError>({
    queryKey: queryKeys.careers.analytics(),
    queryFn: () => api.getAnalytics(),
    ...options,
  });
}
