/**
 * Unified API Client
 * Production-grade API layer with auth, retry, caching, and error handling
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useQuery, useMutation, useInfiniteQuery } from 'react-query';

export interface APIConfig {
  baseURL: string;
  wsURL?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  cacheDuration?: number;
}

export interface APIResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface APIError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Retry Configuration
 */
interface RetryConfig {
  attempts: number;
  delay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Unified API Client Class
 */
export class UnifiedAPIClient {
  private client: AxiosInstance;
  private config: APIConfig;
  private authToken: string | null = null;
  private retryConfig: RetryConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private rateLimitResetTime: number = 0;

  constructor(config: APIConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      ...config,
    };

    this.retryConfig = {
      attempts: this.config.retryAttempts || 3,
      delay: this.config.retryDelay || 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Version': (globalThis as any).import?.meta?.env?.VITE_APP_VERSION || '1.0.0',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for auth, retry, and error handling
   */
  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: any) => {
        if (this.authToken) {
          if (!config.headers) {
            config.headers = {};
          }
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Check rate limiting
        if (this.rateLimitResetTime > Date.now()) {
          const waitTime = this.rateLimitResetTime - Date.now();
          console.warn(`⏱️ Rate limited. Retrying in ${waitTime}ms`);
        }

        return config;
      },
      (error: any) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log successful requests in development
        if (process.env.NODE_ENV === 'development') {
          console.debug(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} (${response.status})`);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Prevent infinite retry loops
        if (!originalRequest._retryCount) {
          originalRequest._retryCount = 0;
        }

        // Handle 401 Unauthorized - token expired
        if (error.response?.status === 401 && originalRequest._retryCount === 0) {
          originalRequest._retryCount++;

          try {
            // Attempt token refresh
            window.dispatchEvent(new Event('auth:token-expired'));
            // Wait for token to be refreshed
            await new Promise((resolve) => setTimeout(resolve, 500));
            return this.client(originalRequest);
          } catch (refreshError) {
            // Redirect to login
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Handle 429 Too Many Requests - rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || '60';
          this.rateLimitResetTime = Date.now() + parseInt(retryAfter) * 1000;
          console.error(`⚠️ Rate limited. Retry after ${retryAfter}s`);

          if (originalRequest._retryCount < this.retryConfig.attempts) {
            originalRequest._retryCount++;
            const delay = parseInt(retryAfter) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            return this.client(originalRequest);
          }
        }

        // Handle 5xx errors with exponential backoff
        if (
          error.response?.status &&
          error.response.status >= 500 &&
          originalRequest._retryCount < this.retryConfig.attempts
        ) {
          originalRequest._retryCount++;
          const delay = Math.min(
            this.retryConfig.delay * Math.pow(this.retryConfig.backoffMultiplier, originalRequest._retryCount - 1),
            this.retryConfig.maxDelay
          );
          console.warn(`⚠️ Server error. Retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.client(originalRequest);
        }

        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, error.message);
        }

        return Promise.reject(this.parseError(error));
      }
    );
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  /**
   * Upload file
   */
  async uploadFile<T = any>(url: string, file: File, metadata?: Record<string, any>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Queue request for retry (offline support)
   */
  queueRequest(request: () => Promise<any>) {
    this.requestQueue.push(request);
    this.processQueue();
  }

  /**
   * Process queued requests when online
   */
  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift();
        if (request) {
          try {
            await request();
          } catch (error) {
            console.error('Failed to process queued request:', error);
          }
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Parse error response
   */
  private parseError(error: AxiosError): APIError {
    const apiError = new Error(error.message) as APIError;
    apiError.status = error.response?.status;

    if (error.response?.data) {
      const data = error.response.data as any;
      apiError.code = data.code || data.error;
      apiError.details = data.details || data;
      apiError.message = data.message || error.message;
    }

    return apiError;
  }

  /**
   * Get axios instance for advanced usage
   */
  getClient(): AxiosInstance {
    return this.client;
  }
}

/**
 * Create API client instance
 */
export function createApiClient(config: APIConfig): UnifiedAPIClient {
  return new UnifiedAPIClient(config);
}

/**
 * Global API client instance
 */
let globalApiClient: UnifiedAPIClient | null = null;

/**
 * Initialize global API client
 */
export function initializeApiClient(config: APIConfig): UnifiedAPIClient {
  globalApiClient = createApiClient(config);
  return globalApiClient;
}

/**
 * Get global API client
 */
export function getApiClient(): UnifiedAPIClient {
  if (!globalApiClient) {
    throw new Error('API client not initialized. Call initializeApiClient first.');
  }
  return globalApiClient;
}

/**
 * React Query hooks for data fetching
 */

/**
 * Hook for GET requests with caching
 */
export function useApi<T = any>(
  queryKey: string | string[] | readonly string[],
  queryFn: () => Promise<T>,
  options?: any
) {
  return useQuery<T>(queryKey, queryFn, options);
}

/**
 * Hook for infinite scroll queries
 */
export function useInfiniteApi<T = any>(
  key: string | string[],
  fn: ({ pageParam }: { pageParam?: any }) => Promise<PaginatedResponse<T>>,
  options?: any
) {
  return useInfiniteQuery(key, fn, {
    getNextPageParam: (lastPage: PaginatedResponse<T>) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook for POST/PUT/DELETE mutations
 */
export function useMutateApi<TData = any, TError = any, TVariables = any>(
  fn: (variables: TVariables) => Promise<TData>,
  options?: any
) {
  return useMutation<TData, TError, TVariables>(fn, {
    retry: 1,
    ...options,
  });
}

export default getApiClient;
