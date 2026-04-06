/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Main barrel export for @allservices/react-sdk providing hooks, provider, client, and types.
 */

export { AllServicesProvider, type AllServicesProviderProps } from './provider/allservices-provider';
export { useAllServicesClient } from './hooks/use-allservices-client';
export { useAuthState, type AuthState } from './provider/auth-context';
export { queryKeys } from './hooks/query-keys';

export { AllServicesClient } from './core/http-client';
export type {
  ClientConfig,
  ClientPlatform,
  RegionCode,
  RegionUrls,
  RequestOptions,
  TokenStorage,
  RateLimitInfo,
} from './core/http-client.types';

export {
  AllServicesError,
  AllServicesApiError,
  AllServicesNetworkError,
  AllServicesTimeoutError,
  isAllServicesApiError,
  isAllServicesNetworkError,
  isAllServicesTimeoutError,
} from './core/errors';

export { AuthApi } from './api/auth.api';
export { UsersApi } from './api/users.api';
export { CareersPublicApi } from './api/careers-public.api';
export { CareersApplicantApi } from './api/careers-applicant.api';
export { CareersAdminApi } from './api/careers-admin.api';
export { HealthApi } from './api/health.api';

export { useRegister } from './hooks/auth/use-register';
export { useLogin } from './hooks/auth/use-login';
export { useLogout } from './hooks/auth/use-logout';
export { useForgotPassword } from './hooks/auth/use-forgot-password';
export { useResetPassword } from './hooks/auth/use-reset-password';
export { useVerifyEmail } from './hooks/auth/use-verify-email';
export { useSessions } from './hooks/auth/use-sessions';
export { useRevokeSession } from './hooks/auth/use-revoke-session';
export { useMfaSetup } from './hooks/auth/use-mfa-setup';
export { useMfaVerifySetup } from './hooks/auth/use-mfa-verify-setup';
export { useMfaDisable } from './hooks/auth/use-mfa-disable';
export { useChangePassword } from './hooks/auth/use-change-password';

export { useCurrentUser } from './hooks/users/use-current-user';
export { useUpdateProfile } from './hooks/users/use-update-profile';
export { useUser } from './hooks/users/use-user';
export { useAdminUsers } from './hooks/users/use-admin-users';
export { useAdminCreateUser } from './hooks/users/use-admin-create-user';
export { useAdminUpdateUser } from './hooks/users/use-admin-update-user';
export { useAdminDeleteUser } from './hooks/users/use-admin-delete-user';
export { useAdminRestoreUser } from './hooks/users/use-admin-restore-user';
export { useAdminLockUser } from './hooks/users/use-admin-lock-user';
export { useAdminUnlockUser } from './hooks/users/use-admin-unlock-user';

export { usePublicPostings } from './hooks/careers/use-public-postings';
export { usePublicPostingBySlug } from './hooks/careers/use-public-posting-by-slug';
export { useApplicantVerifyEmail } from './hooks/careers/use-applicant-verify-email';
export { useSubmitApplication } from './hooks/careers/use-submit-application';
export { useRequestAccess } from './hooks/careers/use-request-access';
export { useMyApplication } from './hooks/careers/use-my-application';
export { useMyMessages } from './hooks/careers/use-my-messages';
export { useSendMyMessage } from './hooks/careers/use-send-my-message';
export { useWithdrawApplication } from './hooks/careers/use-withdraw-application';
export { useAdminCreatePosting } from './hooks/careers/use-admin-create-posting';
export { useAdminPostings } from './hooks/careers/use-admin-postings';
export { useAdminPosting } from './hooks/careers/use-admin-posting';
export { useAdminUpdatePosting } from './hooks/careers/use-admin-update-posting';
export { useAdminPublishPosting } from './hooks/careers/use-admin-publish-posting';
export { useAdminClosePosting } from './hooks/careers/use-admin-close-posting';
export { useAdminArchivePosting } from './hooks/careers/use-admin-archive-posting';
export { useAdminApplications } from './hooks/careers/use-admin-applications';
export { useAdminApplication } from './hooks/careers/use-admin-application';
export { useAdminChangeStatus } from './hooks/careers/use-admin-change-status';
export { useAdminBulkChangeStatus } from './hooks/careers/use-admin-bulk-change-status';
export { useAdminApplicationMessages } from './hooks/careers/use-admin-application-messages';
export { useAdminSendMessage } from './hooks/careers/use-admin-send-message';
export { useAdminDownloadDocument } from './hooks/careers/use-admin-download-document';
export { useAdminAnalytics } from './hooks/careers/use-admin-analytics';

export { useHealth } from './hooks/health/use-health';
export { useReadiness } from './hooks/health/use-readiness';

export { isMfaChallenge } from './types/auth';

export {
  JobPostingStatus,
  JobPostingType,
  JobPostingWorkMode,
  ApplicationStatus,
  MessageSenderType,
  Role,
} from './types/enums';

export { ErrorCode } from './types/error-codes';
export { Permission } from './types/permissions';
