import React from 'react';
import { FileImage } from 'lucide-react';

export function QueueEmpty(): React.JSX.Element {
  return (
    <div className="queue-empty">
      <FileImage size={28} className="empty-icon" />
      <span className="empty-title">No SVGs Imported</span>
      <span className="empty-sub">Drop vector files above to start studio rasterization</span>
    </div>
  );
}
