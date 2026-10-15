import React from 'react';
import { FileImage, Loader2, CheckCircle2, X } from 'lucide-react';
import type { SvgFile } from '../../lib/interfaces/svg';
import type { ConvertResult } from '../../lib/interfaces/conversion';
import { formatBytes, formatSavings } from '../../lib/utilities/formatters';

interface QueueItemProps {
  file: SvgFile;
  isActive: boolean;
  isThisConverting: boolean;
  result?: ConvertResult;
  onSelect: () => void;
  onRemove?: () => void;
  onOpenFolder?: (path: string) => void;
}

export function QueueItem({
  file,
  isActive,
  isThisConverting,
  result,
  onSelect,
  onRemove,
  onOpenFolder
}: QueueItemProps): React.JSX.Element {
  const isDone = !!result?.success;
  const sizeText = formatBytes(file.size);

  return (
    <div
      className={`queue-item ${isActive ? 'active' : ''} ${isThisConverting ? 'converting' : ''}`}
      onClick={onSelect}
    >
      <div className="item-thumb">
        {isThisConverting ? (
          <Loader2 size={15} style={{ animation: 'spin 1s linear infinite', color: '#60a5fa' }} />
        ) : (
          <FileImage size={15} />
        )}
      </div>

      <div className="item-info">
        <div className="item-name" title={file.name}>
          {file.name}
        </div>
        <div className="item-meta">
          {isThisConverting ? (
            <span style={{ color: '#60a5fa', fontWeight: 500 }}>Rasterizing...</span>
          ) : isDone ? (
            <>
              <span>{file.width} × {file.height}</span>
              <span>•</span>
              <span style={{ color: '#10b981', fontWeight: 500 }}>
                {((result.compressedSize || 0) / 1024).toFixed(0)} KB ({formatSavings(result.savings)})
              </span>
            </>
          ) : (
            <>
              <span>{file.width} × {file.height}</span>
              <span>•</span>
              <span>{sizeText}</span>
            </>
          )}
        </div>
      </div>

      <div className="item-actions">
        {isThisConverting ? (
          <div className="btn-icon-xs" title="Rasterizing now..." style={{ color: '#60a5fa' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : isDone ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenFolder && result.fullPath) {
                onOpenFolder(result.fullPath);
              }
            }}
            className="btn-icon-xs"
            title={`Done (${((result.compressedSize || 0) / 1024).toFixed(0)} KB) — Click to reveal in Finder`}
            style={{ color: '#10b981' }}
          >
            <CheckCircle2 size={14} />
          </button>
        ) : null}

        {onRemove && !isThisConverting && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="btn-icon-xs item-remove-btn"
            title={`Remove ${file.name} from queue`}
            aria-label={`Remove ${file.name}`}
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
