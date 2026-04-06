/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * React hook for fetching messages on a specific application in the admin panel.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { CareersAdminApi } from '../../api/careers-admin.api';
import { type AllServicesApiError } from '../../core/errors';
import type { MessageResponse } from '../../types/careers-messages';
import { queryKeys } from '../query-keys';
import { useAllServicesClient } from '../use-allservices-client';

export function useAdminApplicationMessages(
  applicationId: string,
  options?: Omit<
    UseQueryOptions<readonly MessageResponse[], AllServicesApiError>,
    'queryKey' | 'queryFn' | 'enabled'
  >,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);

  return useQuery<readonly MessageResponse[], AllServicesApiError>({
    queryKey: queryKeys.careers.applications.adminMessages(applicationId),
    queryFn: () => api.getMessages(applicationId),
    enabled: applicationId.length > 0,
    ...options,
  });
}
