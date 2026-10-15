import React from 'react';
import { Layers } from 'lucide-react';

interface QueueHeaderProps {
  count: number;
  onClearQueue?: () => void;
}

export function QueueHeader({ count, onClearQueue }: QueueHeaderProps): React.JSX.Element {
  return (
    <div className="panel-header">
      <div className="panel-header-title">
        <Layers size={14} className="text-muted-foreground" />
        <span className="panel-title">Vector Queue</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {count > 0 && onClearQueue && (
          <button
            onClick={onClearQueue}
            className="btn-clear-queue"
            title="Clear all SVGs from queue"
          >
            Clear
          </button>
        )}
        <span className="badge">{count} SVGs</span>
      </div>
    </div>
  );
}
