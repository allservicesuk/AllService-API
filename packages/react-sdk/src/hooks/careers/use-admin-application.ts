/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for fetching a single application by ID in the admin panel.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CareersAdminApi } from '../../api/careers-admin.api';
import { type AllServicesApiError } from '../../core/errors';
import type { ApplicationResponse } from '../../types/careers-applications';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useAdminApplication(
  id: string,
  options?: Omit<
    UseQueryOptions<ApplicationResponse, AllServicesApiError>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);

  return useQuery<ApplicationResponse, AllServicesApiError>({
    queryKey: queryKeys.careers.applications.adminDetail(id),
    queryFn: () => api.getApplication(id),
    enabled: id.length > 0,
    ...options,
  });
}
