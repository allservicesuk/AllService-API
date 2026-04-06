/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Hook for checking API readiness status.
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { HealthApi } from '../../api/health.api';
import type { AllServicesApiError } from '../../core/errors';
import type { ReadinessResponse } from '../../types/health';
import { useAllServicesClient } from '../use-allservices-client';
import { queryKeys } from '../query-keys';

export function useReadiness(
  options?: Omit<UseQueryOptions<ReadinessResponse, AllServicesApiError>, 'queryKey' | 'queryFn'>,
) {
  const client = useAllServicesClient();
  const api = new HealthApi(client);

  return useQuery({
    queryKey: queryKeys.health.ready(),
    queryFn: () => api.ready(),
    ...options,
  });
}
