import React from 'react';
import { makeStyles, Skeleton, SkeletonItem } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
  },
  content: {
    flex: 1,
  },
  titleLine: {
    height: '16px',
    width: '80%',
    marginBottom: '8px',
  },
  textLine: {
    height: '12px',
    width: '100%',
    marginBottom: '4px',
  },
  card: {
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid var(--colorNeutralStroke1)',
  },
});

interface LoadingSkeletonProps {
  variant?: 'line' | 'card' | 'avatar' | 'chat' | 'table';
  count?: number;
  width?: string;
  height?: string;
}

/**
 * Loading Skeleton Component
 * Provides visual feedback during data loading
 */
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 1,
  width = '100%',
  height = 'auto',
}) => {
  const styles = useStyles();

  const renderSkeletons = () => {
    const skeletons = [];

    for (let i = 0; i < count; i++) {
      switch (variant) {
        case 'line':
          skeletons.push(
            <Skeleton key={i} style={{ width, height }}>
              <SkeletonItem style={{ width, height }} />
            </Skeleton>
          );
          break;

        case 'avatar':
          skeletons.push(
            <div key={i} className={styles.row}>
              <Skeleton appearance="opaque">
                <SkeletonItem className={styles.avatar} />
              </Skeleton>
              <div className={styles.content}>
                <Skeleton appearance="opaque">
                  <SkeletonItem style={{ width: '120px', height: '16px', marginBottom: '8px' }} />
                </Skeleton>
                <Skeleton appearance="opaque">
                  <SkeletonItem style={{ width: '100px', height: '12px' }} />
                </Skeleton>
              </div>
            </div>
          );
          break;

        case 'card':
          skeletons.push(
            <div key={i} className={styles.card}>
              <Skeleton appearance="opaque">
                <SkeletonItem className={styles.titleLine} />
              </Skeleton>
              <Skeleton appearance="opaque">
                <SkeletonItem className={styles.textLine} />
              </Skeleton>
              <Skeleton appearance="opaque">
                <SkeletonItem className={styles.textLine} style={{ width: '90%' }} />
              </Skeleton>
            </div>
          );
          break;

        case 'chat':
          skeletons.push(
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
              <Skeleton appearance="opaque">
                <SkeletonItem style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              </Skeleton>
              <div style={{ flex: 1 }}>
                <Skeleton appearance="opaque">
                  <SkeletonItem style={{ width: '60%', height: '12px', marginBottom: '8px' }} />
                </Skeleton>
                <Skeleton appearance="opaque">
                  <SkeletonItem style={{ width: '80%', height: '12px' }} />
                </Skeleton>
              </div>
            </div>
          );
          break;

        case 'table':
          skeletons.push(
            <div key={i} style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid var(--colorNeutralStroke1)' }}>
              <Skeleton appearance="opaque">
                <SkeletonItem style={{ width: '20%', height: '16px' }} />
              </Skeleton>
              <Skeleton appearance="opaque">
                <SkeletonItem style={{ width: '30%', height: '16px' }} />
              </Skeleton>
              <Skeleton appearance="opaque">
                <SkeletonItem style={{ width: '25%', height: '16px' }} />
              </Skeleton>
              <Skeleton appearance="opaque">
                <SkeletonItem style={{ width: '25%', height: '16px' }} />
              </Skeleton>
            </div>
          );
          break;

        default:
          skeletons.push(null);
      }
    }

    return skeletons;
  };

  return <div className={styles.container}>{renderSkeletons()}</div>;
};

export default LoadingSkeleton;
