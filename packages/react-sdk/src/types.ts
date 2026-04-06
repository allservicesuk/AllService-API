/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Barrel export for the @allservices/react-sdk/types entrypoint (zero-runtime, types only).
 */
export {
  JobPostingStatus,
  JobPostingType,
  JobPostingWorkMode,
  ApplicationStatus,
  MessageSenderType,
  Role,
} from './types/enums';

export type {
  JobPostingStatusValue,
  JobPostingTypeValue,
  JobPostingWorkModeValue,
  ApplicationStatusValue,
  MessageSenderTypeValue,
  RoleValue,
} from './types/enums';

export { ErrorCode } from './types/error-codes';
export type { ErrorCodeValue } from './types/error-codes';

export { Permission } from './types/permissions';
export type { PermissionCode } from './types/permissions';

export type {
  PaginationMeta,
  ApiMeta,
  ApiResponse,
  ErrorDetail,
  ApiErrorBody,
  ApiErrorEnvelope,
} from './types/api-envelope';

export type { PaginationParams, PaginatedResult } from './types/pagination';

export type { CustomFieldType, CustomFieldDefinition } from './types/custom-fields';

export type { SessionInfo } from './types/sessions';

export type { MfaSetupResult } from './types/mfa';

export type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
  EnableMfaRequest,
  DisableMfaRequest,
  AuthResponseUser,
  AuthResponse,
  MfaChallengeResponse,
  LoginResponse,
  RefreshResponse,
  SuccessResponse,
  SuccessMessageResponse,
} from './types/auth';

export { isMfaChallenge } from './types/auth';

export type {
  UserResponse,
  UpdateProfileRequest,
  ListUsersParams,
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  LockUserRequest,
  ListUsersResult,
} from './types/users';

export type {
  PostingResponse,
  CreatePostingRequest,
  UpdatePostingRequest,
  ListPostingsParams,
  ListPostingsResult,
} from './types/careers-postings';

export type {
  ApplicationDocumentResponse,
  ApplicationResponse,
  VerifyApplicationEmailRequest,
  SubmitApplicationRequest,
  RequestAccessRequest,
  ChangeStatusRequest,
  BulkChangeStatusRequest,
  BulkChangeStatusResult,
  ListApplicationsParams,
  ListApplicationsResult,
} from './types/careers-applications';

export type { MessageResponse, SendMessageRequest } from './types/careers-messages';

export type {
  StatusBreakdown,
  PostingStats,
  CareerAnalytics,
} from './types/careers-analytics';

export type { HealthResponse, ReadinessResponse } from './types/health';
