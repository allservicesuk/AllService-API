/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for querying publicly listed job postings.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CareersPublicApi } from '../../api/careers-public.api';
import { type AllServicesApiError } from '../../core/errors';
import type {
  ListPostingsParams,
  ListPostingsResult,
} from '../../types/careers-postings';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function usePublicPostings(
  params: ListPostingsParams = {},
  options?: Omit<
    UseQueryOptions<ListPostingsResult, AllServicesApiError>,
    'queryKey' | 'queryFn'
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersPublicApi(client);

  return useQuery<ListPostingsResult, AllServicesApiError>({
    queryKey: queryKeys.careers.postings.publicList(params),
    queryFn: () => api.listPostings(params),
    ...options,
  });
}
