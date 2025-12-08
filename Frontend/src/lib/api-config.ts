/**
 * API Configuration
 * Environment-based endpoint configuration, feature flags, and defaults
 */

export interface ApiConfig {
  // Base URLs
  apiUrl: string;
  wsUrl: string;

  // Service timeouts
  requestTimeout: number; // ms
  wsTimeout: number; // ms

  // Retry configuration
  maxRetries: number;
  retryDelay: number; // ms
  retryBackoffMultiplier: number;
  maxRetryDelay: number; // ms

  // Rate limiting
  enableRateLimit: boolean;
  rateLimitWindow: number; // ms
  rateLimitMaxRequests: number;

  // Caching
  enableCache: boolean;
  defaultCacheDuration: number; // ms

  // Offline support
  enableOfflineQueue: boolean;
  maxQueueSize: number;

  // WebSocket
  wsReconnect: boolean;
  wsReconnectInterval: number; // ms
  wsMaxReconnectAttempts: number;

  // Feature flags
  features: {
    analytics: boolean;
    realTimeChat: boolean;
    fileSync: boolean;
    semanticSearch: boolean;
    aiInsights: boolean;
    multiTenant: boolean;
  };

  // Logging
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Development configuration
 */
const developmentConfig: ApiConfig = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1',
  wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws',

  requestTimeout: 30000,
  wsTimeout: 30000,

  maxRetries: 3,
  retryDelay: 1000,
  retryBackoffMultiplier: 2,
  maxRetryDelay: 10000,

  enableRateLimit: false,
  rateLimitWindow: 60000,
  rateLimitMaxRequests: 100,

  enableCache: true,
  defaultCacheDuration: 5 * 60 * 1000,

  enableOfflineQueue: true,
  maxQueueSize: 100,

  wsReconnect: true,
  wsReconnectInterval: 3000,
  wsMaxReconnectAttempts: 10,

  features: {
    analytics: true,
    realTimeChat: true,
    fileSync: true,
    semanticSearch: true,
    aiInsights: true,
    multiTenant: true,
  },

  enableLogging: true,
  logLevel: 'debug',
};

/**
 * Production configuration
 */
const productionConfig: ApiConfig = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://api.fusiondesk.app/api/v1',
  wsUrl: process.env.REACT_APP_WS_URL || 'wss://api.fusiondesk.app/ws',

  requestTimeout: 30000,
  wsTimeout: 30000,

  maxRetries: 3,
  retryDelay: 1000,
  retryBackoffMultiplier: 2,
  maxRetryDelay: 10000,

  enableRateLimit: true,
  rateLimitWindow: 60000,
  rateLimitMaxRequests: 100,

  enableCache: true,
  defaultCacheDuration: 5 * 60 * 1000,

  enableOfflineQueue: true,
  maxQueueSize: 200,

  wsReconnect: true,
  wsReconnectInterval: 5000,
  wsMaxReconnectAttempts: 5,

  features: {
    analytics: true,
    realTimeChat: true,
    fileSync: true,
    semanticSearch: true,
    aiInsights: true,
    multiTenant: true,
  },

  enableLogging: false,
  logLevel: 'error',
};

/**
 * Get configuration based on environment
 */
export function getApiConfig(): ApiConfig {
  const env = process.env.NODE_ENV || 'development';
  const config = env === 'production' ? productionConfig : developmentConfig;

  // Validate required environment variables
  validateConfig(config);

  return config;
}

/**
 * Validate configuration
 */
function validateConfig(config: ApiConfig): void {
  const required = ['apiUrl', 'wsUrl', 'requestTimeout'];

  for (const field of required) {
    if (!config[field as keyof ApiConfig]) {
      console.warn(`Missing required config: ${field}`);
    }
  }

  // Ensure URLs don't have trailing slashes
  config.apiUrl = config.apiUrl.replace(/\/$/, '');
  config.wsUrl = config.wsUrl.replace(/\/$/, '');
}

/**
 * Update configuration at runtime
 */
export function updateApiConfig(updates: Partial<ApiConfig>): void {
  const currentConfig = getApiConfig();
  Object.assign(currentConfig, updates);
  validateConfig(currentConfig);
}

/**
 * Get feature flag status
 */
export function isFeatureEnabled(feature: keyof ApiConfig['features']): boolean {
  const config = getApiConfig();
  return config.features[feature];
}

/**
 * Export singleton instance
 */
export const apiConfig = getApiConfig();
