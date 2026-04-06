/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Prisma query result shape for an application with all its relations included.
 */
import type {
  Application,
  ApplicationDocument,
  ApplicationMessage,
  ApplicationStatusHistory,
  JobPosting,
} from '@prisma/client';

export interface ApplicationDetail extends Application {
  readonly jobPosting: JobPosting;
  readonly statusHistory: ApplicationStatusHistory[];
  readonly messages: ApplicationMessage[];
  readonly documents: ApplicationDocument[];
}
