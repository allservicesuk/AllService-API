/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Barrel export for the @allservices/react-sdk/testing entrypoint.
 */
export {
  createUserFixture,
  createAuthUserFixture,
  createAuthResponseFixture,
  createSessionFixture,
  createMfaSetupFixture,
  createPostingFixture,
  createApplicationFixture,
  createDocumentFixture,
  createMessageFixture,
  createAnalyticsFixture,
  createListUsersResultFixture,
  createBulkStatusResultFixture,
  createHealthFixture,
  createReadinessFixture,
} from './testing/fixtures';

export { createMockClient } from './testing/mock-client';
export { AllServicesTestProvider, type TestProviderProps } from './testing/test-provider';
export { createMswHandlerDefinitions } from './testing/msw-handlers';
