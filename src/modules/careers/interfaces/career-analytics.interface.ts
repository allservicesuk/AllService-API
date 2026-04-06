/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Shapes returned by the career analytics endpoint for dashboard rendering.
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
  readonly statusBreakdown: StatusBreakdown[];
  readonly topPostings: PostingStats[];
}
