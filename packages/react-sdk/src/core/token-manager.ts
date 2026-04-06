/**
 * AllServices — ALS Marketing UK Ltd
 * Copyright (c) 2026. All rights reserved.
 * Developer: linkst
 *
 * In-memory access token store with refresh deduplication queue.
 */
import type { RefreshResponse } from '../types/auth';
import type { TokenStorage } from './http-client.types';

type RefreshFn = () => Promise<RefreshResponse>;

export class TokenManager {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  private readonly storage: TokenStorage | null;

  constructor(storage?: TokenStorage) {
    this.storage = storage ?? null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  async clearAll(): Promise<void> {
    this.accessToken = null;
    if (this.storage) {
      await this.storage.clearRefreshToken();
    }
  }

  async storeRefreshToken(token: string): Promise<void> {
    if (this.storage) {
      await this.storage.setRefreshToken(token);
    }
  }

  async getRefreshToken(): Promise<string | null> {
    if (this.storage) {
      return this.storage.getRefreshToken();
    }
    return null;
  }

  async refresh(refreshFn: RefreshFn): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.executeRefresh(refreshFn).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async executeRefresh(refreshFn: RefreshFn): Promise<string> {
    const result = await refreshFn();
    this.accessToken = result.accessToken;

    if (result.refreshToken && this.storage) {
      await this.storage.setRefreshToken(result.refreshToken);
    }

    return result.accessToken;
  }
}
