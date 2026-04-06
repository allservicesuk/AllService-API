/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for fetching a single job posting by ID in the admin panel.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CareersAdminApi } from '../../api/careers-admin.api';
import { type AllServicesApiError } from '../../core/errors';
import type { PostingResponse } from '../../types/careers-postings';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useAdminPosting(
  id: string,
  options?: Omit<
    UseQueryOptions<PostingResponse, AllServicesApiError>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);

  return useQuery<PostingResponse, AllServicesApiError>({
    queryKey: queryKeys.careers.postings.adminDetail(id),
    queryFn: () => api.getPosting(id),
    enabled: id.length > 0,
    ...options,
  });
}
