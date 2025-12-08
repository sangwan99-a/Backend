/**
 * Sentry Integration
 * Configuration and initialization for error tracking and performance monitoring
 */

let Sentry: any = null;
let BrowserTracing: any = null;

try {
  Sentry = require('@sentry/react');
  const tracingModule = require('@sentry/tracing');
  BrowserTracing = tracingModule.BrowserTracing;
} catch (e) {
  console.warn('Sentry packages not installed. Error tracking disabled.');
}

const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || '';
const APP_VERSION = process.env.REACT_APP_VERSION || '1.0.0';
const ENVIRONMENT = process.env.NODE_ENV || 'development';

interface SentryConfig {
  enabled: boolean;
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

/**
 * Initialize Sentry
 */
export function initializeSentry(): SentryConfig {
  const config: SentryConfig = {
    enabled: !!SENTRY_DSN && ENVIRONMENT !== 'development',
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
  };

  if (!config.enabled) {
    console.log('🔕 Sentry is disabled (development or no DSN configured)');
    return config;
  }

  if (!Sentry) {
    console.warn('Sentry package not available. Error tracking disabled.');
    return config;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: APP_VERSION,
      integrations: BrowserTracing ? [new BrowserTracing()] : [],
      tracesSampleRate: config.tracesSampleRate,
      replaysSessionSampleRate: config.replaysSessionSampleRate,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,
      maxBreadcrumbs: 50,
      maxValueLength: 1024,
      enabled: true,
    });
    console.log(`✅ Sentry initialized for ${config.environment}`);
  } catch (error) {
    console.warn('Sentry initialization failed:', error);
  }
  
  return config;
}

/**
 * Set user context
 */
export function setSentryUser(userId: string, email?: string, tenant?: string) {
  if (!Sentry) return;
  
  Sentry.setUser({
    id: userId,
    email: email || undefined,
    username: undefined,
  });

  // Custom context
  Sentry.setContext('user', {
    userId,
    email: email || 'unknown',
    tenant: tenant || 'unknown',
  });

  console.log('👤 Sentry user context set');
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  if (!Sentry) return;
  
  Sentry.setUser(null);
  console.log('👤 Sentry user context cleared');
}

/**
 * Capture exception with breadcrumbs
 */
export function captureException(
  error: Error | string,
  context?: Record<string, any>,
  tags?: Record<string, string>
) {
  if (!Sentry) return;
  
  if (typeof error === 'string') {
    Sentry.captureMessage(error, 'error');
  } else {
    Sentry.captureException(error, { contexts: context ? { custom: context } : undefined, tags });
  }
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!Sentry) return;
  
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: 'auth' | 'navigation' | 'http' | 'user-action' | 'data' | 'ui' = 'user-action',
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  if (!Sentry) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Track authentication events
 */
export function trackAuthEvent(action: 'login' | 'logout' | 'signup' | 'mfa' | 'passwordReset') {
  addBreadcrumb(`Auth: ${action}`, 'auth', 'info');
}

/**
 * Track navigation
 */
export function trackNavigation(from: string, to: string) {
  addBreadcrumb(`Navigation: ${from} → ${to}`, 'navigation', 'info', {
    from,
    to,
  });
}

/**
 * Track HTTP requests
 */
export function trackHttpRequest(
  method: string,
  url: string,
  status?: number,
  duration?: number
) {
  const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\?.*/, '');
  addBreadcrumb(
    `${method} ${cleanUrl} ${status ? `(${status})` : ''}`,
    'http',
    status && status >= 400 ? 'error' : 'info',
    {
      method,
      url: cleanUrl,
      status,
      duration,
    }
  );
}

/**
 * Track user actions
 */
export function trackUserAction(
  action: string,
  details?: Record<string, any>
) {
  addBreadcrumb(`Action: ${action}`, 'user-action', 'info', details);
}

/**
 * Track data operations
 */
export function trackDataOperation(
  operation: 'create' | 'read' | 'update' | 'delete',
  resource: string,
  details?: Record<string, any>
) {
  addBreadcrumb(
    `Data: ${operation.toUpperCase()} ${resource}`,
    'data',
    'info',
    details
  );
}

/**
 * Track UI events
 */
export function trackUIEvent(
  event: string,
  component?: string,
  details?: Record<string, any>
) {
  const message = component ? `${component}: ${event}` : event;
  addBreadcrumb(message, 'ui', 'info', details);
}

/**
 * Start performance transaction
 */
export function startTransaction(name: string, op: string = 'http.request') {
  if (!Sentry) return null;
  
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Set custom tags
 */
export function setTag(key: string, value: string) {
  if (!Sentry) return;
  
  Sentry.setTag(key, value);
}

/**
 * Set custom context
 */
export function setContext(name: string, context: Record<string, any>) {
  if (!Sentry) return;
  
  Sentry.setContext(name, context);
}

/**
 * Force an event to be sent to Sentry
 */
export function flush(timeout: number = 2000): Promise<boolean> {
  if (!Sentry) return Promise.resolve(true);
  
  return Sentry.flush(timeout);
}

/**
 * Get Sentry client
 */
export function getSentryClient() {
  if (!Sentry) return null;
  
  return Sentry.getCurrentClient();
}

/**
 * Check if Sentry is initialized
 */
export function isSentryEnabled(): boolean {
  return !!SENTRY_DSN && ENVIRONMENT !== 'development';
}

export default Sentry;
