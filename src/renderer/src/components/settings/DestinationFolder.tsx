import React from 'react';
import { FolderOpen } from 'lucide-react';
import { formatDisplayPath } from '../../lib/utilities/formatters';

interface DestinationFolderProps {
  outputDir?: string;
  onChangeOutputDir?: () => void;
  onOpenFolder?: (path?: string) => void;
}

export function DestinationFolder({
  outputDir,
  onChangeOutputDir,
  onOpenFolder
}: DestinationFolderProps): React.JSX.Element {
  return (
    <div className="setting-item">
      <div className="setting-header-row">
        <span className="setting-label">Destination Folder</span>
        <span className="setting-tag" style={{ color: '#a1a1aa' }}>
          Export Path
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderRadius: 6,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid #27272a',
          gap: 8,
          minHeight: 34
        }}
      >
        <div
          onClick={onChangeOutputDir}
          title={`Current destination: ${outputDir || 'Default'}\nClick to choose another directory`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
            flex: 1,
            cursor: onChangeOutputDir ? 'pointer' : 'default'
          }}
        >
          <FolderOpen size={14} style={{ color: '#38bdf8', flexShrink: 0 }} />
          <span
            style={{
              fontSize: 11,
              color: '#e4e4e7',
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {formatDisplayPath(outputDir)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {onChangeOutputDir && (
            <button
              type="button"
              onClick={onChangeOutputDir}
              className="btn btn-xs btn-outline"
              title="Choose destination directory via native folder picker"
              style={{
                height: 24,
                minHeight: 24,
                padding: '0 8px',
                fontSize: 11,
                borderRadius: 4,
                fontWeight: 500
              }}
            >
              Change...
            </button>
          )}

          {onOpenFolder && (
            <button
              type="button"
              onClick={() => onOpenFolder(outputDir)}
              className="btn-icon-xs"
              title="Reveal folder in Finder"
              style={{ width: 24, height: 24, borderRadius: 4 }}
            >
              <FolderOpen size={12} />
            </button>
          )}
        </div>
      </div>
      <span className="setting-subtext">
        Choose where rasterized images and batch ZIP archives will be saved.
      </span>
    </div>
  );
}
