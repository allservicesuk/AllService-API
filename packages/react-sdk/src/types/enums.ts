/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * All backend enum values mirrored as const objects for type-safe client usage.
 */

export const JobPostingStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  CLOSED: 'CLOSED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type JobPostingStatusValue =
  (typeof JobPostingStatus)[keyof typeof JobPostingStatus];

export const JobPostingType = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
} as const;

export type JobPostingTypeValue =
  (typeof JobPostingType)[keyof typeof JobPostingType];

export const JobPostingWorkMode = {
  REMOTE: 'REMOTE',
  HYBRID: 'HYBRID',
  ONSITE: 'ONSITE',
} as const;

export type JobPostingWorkModeValue =
  (typeof JobPostingWorkMode)[keyof typeof JobPostingWorkMode];

export const SalaryPeriod = {
  HOURLY: 'HOURLY',
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;

export type SalaryPeriodValue =
  (typeof SalaryPeriod)[keyof typeof SalaryPeriod];

export const ApplicationStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  SHORTLISTED: 'SHORTLISTED',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  INTERVIEWED: 'INTERVIEWED',
  OFFER_EXTENDED: 'OFFER_EXTENDED',
  HIRED: 'HIRED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export type ApplicationStatusValue =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const MessageSenderType = {
  ADMIN: 'ADMIN',
  APPLICANT: 'APPLICANT',
} as const;

export type MessageSenderTypeValue =
  (typeof MessageSenderType)[keyof typeof MessageSenderType];

export const Role = {
  USER: 'user',
  TENANT_ADMIN: 'tenant-admin',
  ADMIN: 'admin',
} as const;

export type RoleValue = (typeof Role)[keyof typeof Role];
