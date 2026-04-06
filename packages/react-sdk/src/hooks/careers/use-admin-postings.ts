/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for listing job postings in the admin panel with filtering and pagination.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CareersAdminApi } from '../../api/careers-admin.api';
import { type AllServicesApiError } from '../../core/errors';
import type {
  ListPostingsParams,
  ListPostingsResult,
} from '../../types/careers-postings';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useAdminPostings(
  params: ListPostingsParams = {},
  options?: Omit<
    UseQueryOptions<ListPostingsResult, AllServicesApiError>,
    'queryKey' | 'queryFn'
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);

  return useQuery<ListPostingsResult, AllServicesApiError>({
    queryKey: queryKeys.careers.postings.adminList(params),
    queryFn: () => api.listPostings(params),
    ...options,
  });
}
