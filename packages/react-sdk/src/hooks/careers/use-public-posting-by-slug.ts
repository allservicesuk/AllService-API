/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for fetching a single public job posting by its URL slug.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CareersPublicApi } from '../../api/careers-public.api';
import { type AllServicesApiError } from '../../core/errors';
import type { PostingResponse } from '../../types/careers-postings';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function usePublicPostingBySlug(
  slug: string,
  options?: Omit<
    UseQueryOptions<PostingResponse, AllServicesApiError>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersPublicApi(client);

  return useQuery<PostingResponse, AllServicesApiError>({
    queryKey: queryKeys.careers.postings.bySlug(slug),
    queryFn: () => api.getBySlug(slug),
    enabled: slug.length > 0,
    ...options,
  });
}
