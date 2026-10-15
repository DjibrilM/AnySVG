import React from 'react';
import { Upload } from 'lucide-react';

interface QueueOverlayProps {
  isDraggingOver: boolean;
}

export function QueueOverlay({ isDraggingOver }: QueueOverlayProps): React.JSX.Element | null {
  if (!isDraggingOver) return null;

  return (
    <div className="sidebar-drop-overlay">
      <div className="sidebar-drop-overlay-box">
        <Upload size={30} className="sidebar-drop-overlay-icon" />
        <span className="sidebar-drop-overlay-title">Drop SVGs to Add</span>
        <span className="sidebar-drop-overlay-sub">Release anywhere to import into Vector Queue</span>
      </div>
    </div>
  );
}
