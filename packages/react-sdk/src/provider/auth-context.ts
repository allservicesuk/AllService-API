/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * Auth state context providing isAuthenticated, user, and auth actions.
 */
import { createContext, useContext } from 'react';

import type { AuthResponseUser } from '../types/auth';

export interface AuthState {
  readonly isAuthenticated: boolean;
  readonly user: AuthResponseUser | null;
  readonly setAuth: (user: AuthResponseUser, accessToken: string) => void;
  readonly clearAuth: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuthState(): AuthState {
  const state = useContext(AuthContext);
  if (!state) {
    throw new Error('useAuthState must be used within an <AllServicesProvider>');
  }
  return state;
}
