import React, { ReactNode, ErrorInfo } from 'react';
import {
  makeStyles,
  Breadcrumb,
  BreadcrumbButton,
  BreadcrumbDivider,
  Button,
  Card,
  CardHeader,
  Text,
} from '@fluentui/react-components';
import { ErrorCircle20Filled, ArrowSync20Filled, Home20Filled } from '@fluentui/react-icons';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  module?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    background: 'var(--colorNeutralBackground1)',
  },
  card: {
    maxWidth: '600px',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  icon: {
    color: 'var(--colorStatusDangerForeground1)',
    fontSize: '24px',
  },
  errorBox: {
    background: 'var(--colorNeutralBackground3)',
    padding: '16px',
    borderRadius: '6px',
    marginBottom: '16px',
    borderLeft: '4px solid var(--colorStatusDangerForeground1)',
  },
  errorMessage: {
    fontFamily: 'monospace',
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: 'var(--colorNeutralForeground1)',
    maxHeight: '200px',
    overflow: 'auto',
  },
  stackTrace: {
    background: 'var(--colorNeutralBackground2)',
    padding: '12px',
    borderRadius: '4px',
    marginTop: '12px',
    fontSize: '11px',
    fontFamily: 'monospace',
    maxHeight: '150px',
    overflow: 'auto',
    color: 'var(--colorNeutralForeground3)',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  breadcrumb: {
    marginBottom: '16px',
  },
  devInfo: {
    background: 'var(--colorNeutralBackground2)',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'var(--colorNeutralForeground3)',
    marginTop: '12px',
  },
});

/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error UI with recovery options
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorCount } = this.state;
    const newCount = errorCount + 1;

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorCount: newCount,
    });

    // Log to Sentry with context (requires @sentry/react installation)
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //     custom: {
    //       module: this.props.module || 'unknown',
    //       errorCount: newCount,
    //       timestamp: new Date().toISOString(),
    //     },
    //   },
    //   tags: {
    //     component: 'ErrorBoundary',
    //     module: this.props.module || 'global',
    //     severity: newCount > 2 ? 'critical' : 'high',
    //   },
    //   level: newCount > 2 ? 'fatal' : 'error',
    // });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:');
      console.error(error);
      console.error('Component Stack:');
      console.error(errorInfo.componentStack);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  restartApp = () => {
    // Reload the entire application
    window.location.href = '/';
  };

  navigateHome = () => {
    // Try to navigate home using React Router if available
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    } else {
      this.resetError();
    }
  };

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback, module } = this.props;
    const styles = useStyles();

    // Check if we're in a crash loop
    if (errorCount > 3) {
      return (
        <div className={styles.container}>
          <Card className={styles.card}>
            <CardHeader>
              <div className={styles.header}>
                <ErrorCircle20Filled className={styles.icon} />
                <Text weight="semibold" size={500}>Critical Error</Text>
              </div>
            </CardHeader>
            <div style={{ padding: '16px' }}>
              <p>
                FusionDesk has encountered a critical error and needs to be restarted.
                Your data has been automatically saved.
              </p>
              <div className={styles.actions}>
                <Button
                  appearance="primary"
                  icon={<ArrowSync20Filled />}
                  onClick={this.restartApp}
                >
                  Restart App
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <div className={styles.devInfo}>
                  <strong>Development Info:</strong>
                  <br />
                  Error Count: {errorCount}
                  <br />
                  Module: {module || 'global'}
                </div>
              )}
            </div>
          </Card>
        </div>
      );
    }

    if (!hasError) {
      return children;
    }

    // Use custom fallback if provided
    if (fallback && error) {
      return fallback(error, this.resetError);
    }

    // Default error UI
    return (
      <div className={styles.container}>
        <Card className={styles.card}>
          <CardHeader>
            <div className={styles.header}>
              <ErrorCircle20Filled className={styles.icon} />
              <Text weight="semibold" size={500}>
                {module ? `${module} Error` : 'Something Went Wrong'}
              </Text>
            </div>
          </CardHeader>
          <div style={{ padding: '16px' }}>
            {/* Breadcrumb for navigation context */}
            {module && (
              <div className={styles.breadcrumb}>
                <Breadcrumb>
                  <BreadcrumbButton icon={<Home20Filled />}>Home</BreadcrumbButton>
                  <BreadcrumbDivider />
                  <BreadcrumbButton>{module}</BreadcrumbButton>
                </Breadcrumb>
              </div>
            )}

            <p>
              We're sorry, but something unexpected happened. The error has been reported to our
              team and we'll investigate it.
            </p>

            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && error && (
              <>
                <div className={styles.errorBox}>
                  <div className={styles.errorMessage}>{error.toString()}</div>
                  {errorInfo?.componentStack && (
                    <div className={styles.stackTrace}>{errorInfo.componentStack}</div>
                  )}
                </div>

                <div className={styles.devInfo}>
                  <strong>Debug Information:</strong>
                  <br />
                  Error Count: {errorCount}
                  <br />
                  Module: {module || 'global'}
                  <br />
                  Time: {new Date().toLocaleTimeString()}
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className={styles.actions}>
              <Button
                appearance="primary"
                icon={<ArrowSync20Filled />}
                onClick={this.resetError}
              >
                Try Again
              </Button>
              <Button icon={<Home20Filled />} onClick={this.navigateHome}>
                Go Home
              </Button>
              <Button appearance="secondary" onClick={this.restartApp}>
                Restart App
              </Button>
            </div>

            {/* Additional help information */}
            <div className={styles.devInfo} style={{ marginTop: '16px' }}>
              <strong>What you can try:</strong>
              <ul style={{ marginTop: '8px', marginBottom: 0 }}>
                <li>Click "Try Again" to recover from this error</li>
                <li>Click "Go Home" to return to the main dashboard</li>
                <li>Click "Restart App" to restart the entire application</li>
                <li>Check your internet connection</li>
                <li>Clear your browser cache if the error persists</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  }
}

export default ErrorBoundary;

/**
 * Standalone error handler for top-level application errors
 */
export function setupGlobalErrorHandler() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    // Sentry.captureException(event.reason, {
    //   tags: {
    //     errorType: 'unhandledRejection',
    //   },
    // });
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error);
    // Sentry.captureException(event.error, {
    //   tags: {
    //     errorType: 'globalError',
    //   },
    // });
  });
}
