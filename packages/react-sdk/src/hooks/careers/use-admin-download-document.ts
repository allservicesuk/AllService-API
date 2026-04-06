/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Hook for downloading an application document as a Blob.
 */
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { CareersAdminApi } from '../../api/careers-admin.api';
import type { AllServicesApiError } from '../../core/errors';
import { useAllServicesClient } from '../use-allservices-client';

interface DownloadDocumentInput {
  readonly applicationId: string;
  readonly documentId: string;
}

export function useAdminDownloadDocument(
  options?: UseMutationOptions<Blob, AllServicesApiError, DownloadDocumentInput>,
) {
  const client = useAllServicesClient();
  const api = new CareersAdminApi(client);

  return useMutation({
    mutationFn: ({ applicationId, documentId }: DownloadDocumentInput) =>
      api.downloadDocument(applicationId, documentId),
    ...options,
  });
}
