import React from 'react';

interface BatchProgressFooterProps {
  isConvertingAll: boolean;
  convertAllProgress: {
    current: number;
    total: number;
    currentFile?: string;
    status?: string;
  };
}

export function BatchProgressFooter({
  isConvertingAll,
  convertAllProgress
}: BatchProgressFooterProps): React.JSX.Element | null {
  if (!isConvertingAll && convertAllProgress.status !== 'done') {
    return null;
  }

  const percentage = Math.round(
    (convertAllProgress.current / Math.max(1, convertAllProgress.total)) * 100
  );
  const fillWidth = Math.min(100, percentage);

  return (
    <div className="queue-footer">
      <div className="progress-wrap">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${fillWidth}%`,
              backgroundColor: convertAllProgress.status === 'done' ? '#10b981' : '#ffffff'
            }}
          />
        </div>
        <div className="progress-text">
          <span
            className="progress-label"
            title={convertAllProgress.currentFile || ''}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '170px'
            }}
          >
            {convertAllProgress.status === 'zipping'
              ? 'Compressing ZIP archive...'
              : convertAllProgress.status === 'done'
              ? 'Batch conversion complete!'
              : convertAllProgress.currentFile
              ? `Rasterizing ${convertAllProgress.currentFile}`
              : `Rasterizing batch...`}
          </span>
          <span className="progress-count" style={{ fontWeight: 600, color: '#e4e4e7', flexShrink: 0 }}>
            {convertAllProgress.current}/{convertAllProgress.total} ({percentage}%)
          </span>
        </div>
      </div>
    </div>
  );
}
