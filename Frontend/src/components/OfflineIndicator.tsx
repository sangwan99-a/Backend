import React from 'react';
import { makeStyles, Text } from '@fluentui/react-components';
import { Warning20Filled } from '@fluentui/react-icons';
import { useNetworkStatus } from '@/utils/offline';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    background: 'var(--colorStatusWarningBackground1)',
    borderBottom: '2px solid var(--colorStatusWarningForeground1)',
    animation: 'slideDown 0.3s ease-out',
  },
  offline: {
    background: 'var(--colorStatusDangerBackground1)',
    borderBottomColor: 'var(--colorStatusDangerForeground1)',
  },
  icon: {
    color: 'var(--colorStatusWarningForeground1)',
    flexShrink: 0,
  },
  text: {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--colorStatusWarningForeground1)',
  },
});

/**
 * Offline Indicator Component
 * Shows network status at the top of the app
 */
const OfflineIndicator: React.FC = () => {
  const styles = useStyles();
  const { isOnline, isSlowConnection } = useNetworkStatus();

  // Don't show anything if online and connection is good
  if (isOnline && !isSlowConnection) {
    return null;
  }

  const message = isOnline
    ? `⚠️ Slow connection detected (${(navigator as any).connection?.effectiveType || 'unknown'})`
    : '🔴 You are offline - changes will be saved when connection is restored';

  return (
    <div className={`${styles.container} ${!isOnline ? styles.offline : ''}`}>
      <Warning20Filled className={styles.icon} />
      <Text className={styles.text}>{message}</Text>
    </div>
  );
};

export default OfflineIndicator;
