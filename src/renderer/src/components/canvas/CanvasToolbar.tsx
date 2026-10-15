import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { formatDimensions } from '../../lib/utilities/formatters';

interface CanvasToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  origW: number;
  origH: number;
  outW: number;
  outH: number;
  scale: number;
}

export function CanvasToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  origW,
  origH,
  outW,
  outH,
  scale
}: CanvasToolbarProps): React.JSX.Element {
  return (
    <div className="floating-toolbar">
      {/* Zoom controls */}
      <div className="toolbar-group">
        <button
          className="btn-icon-xs"
          onClick={onZoomOut}
          title="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>
        <span className="zoom-value">{Math.round(zoom * 100)}%</span>
        <button
          className="btn-icon-xs"
          onClick={onZoomIn}
          title="Zoom In"
        >
          <ZoomIn size={13} />
        </button>
        <button
          className="btn-icon-xs"
          onClick={onFit}
          title="Fit to Screen"
        >
          <Maximize2 size={13} />
        </button>
        <button
          className="btn-icon-xs"
          onClick={onReset}
          title="Reset 100%"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Specs Output Readout */}
      <div className="toolbar-specs">
        <span className="spec-source">{origW}×{origH}</span>
        <span className="spec-arrow">→</span>
        <span className="spec-output">{formatDimensions(outW, outH)}</span>
        <span className="spec-tag">{scale}x</span>
      </div>
    </div>
  );
}
