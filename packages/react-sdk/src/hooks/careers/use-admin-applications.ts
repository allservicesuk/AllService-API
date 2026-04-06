/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for listing applications in the admin panel with filtering and pagination.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CareersAdminApi } from '../../api/careers-admin.api';
import { type AllServicesApiError } from '../../core/errors';
import type {
  ListApplicationsParams,
  ListApplicationsResult,
} from '../../types/careers-applications';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useAdminApplications(
  params: ListApplicationsParams = {},
  options?: Omit<
    UseQueryOptions<ListApplicationsResult, AllServicesApiError>,
    'queryKey' | 'queryFn'
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);

  return useQuery<ListApplicationsResult, AllServicesApiError>({
    queryKey: queryKeys.careers.applications.adminList(params),
    queryFn: () => api.listApplications(params),
    ...options,
  });
}
