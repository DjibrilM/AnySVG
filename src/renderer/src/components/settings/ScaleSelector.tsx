import React from 'react';

interface ScaleSelectorProps {
  scale: number;
  onScaleChange: (scale: number) => void;
}

const SCALE_PRESETS = [
  { val: 1, label: '1x', sub: 'SD' },
  { val: 2, label: '2x', sub: '2K' },
  { val: 4, label: '4x', sub: '4K' },
  { val: 8, label: '8x', sub: '8K' }
] as const;

export function ScaleSelector({ scale, onScaleChange }: ScaleSelectorProps): React.JSX.Element {
  return (
    <div className="setting-item">
      <div className="setting-header-row">
        <span className="setting-label">Resolution Scale</span>
        <span className="setting-tag">{scale}x Native</span>
      </div>

      <div className="segmented-control">
        {SCALE_PRESETS.map(item => (
          <button
            key={item.val}
            className={`chip-btn ${scale === item.val ? 'active' : ''}`}
            onClick={() => onScaleChange(item.val)}
            type="button"
          >
            <span>{item.label}</span>
            <span className="sub-pill">{item.sub}</span>
          </button>
        ))}
      </div>
      <span className="setting-subtext">
        High-precision rasterization with Sharp and headless subpixel rendering.
      </span>
    </div>
  );
}
