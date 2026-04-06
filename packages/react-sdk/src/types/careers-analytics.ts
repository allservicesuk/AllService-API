/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Analytics response types for the admin career dashboard.
 */

export interface StatusBreakdown {
  readonly status: string;
  readonly count: number;
}

export interface PostingStats {
  readonly postingId: string;
  readonly title: string;
  readonly applicationCount: number;
}

export interface CareerAnalytics {
  readonly totalPostings: number;
  readonly publishedPostings: number;
  readonly totalApplications: number;
  readonly statusBreakdown: readonly StatusBreakdown[];
  readonly topPostings: readonly PostingStats[];
}
