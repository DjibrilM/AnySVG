import React from 'react';
import type { ResolutionPreset } from '../../lib/interfaces/conversion';

interface ScaleSelectorProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  preset: ResolutionPreset;
  onPresetChange: (preset: ResolutionPreset) => void;
}

const RESOLUTION_PRESETS: { id: ResolutionPreset; label: string; sub: string }[] = [
  { id: 'native', label: 'Native', sub: '1x' },
  { id: '1080p', label: '1080p', sub: 'FHD' },
  { id: '2k', label: '2K', sub: 'QHD' },
  { id: '4k', label: '4K', sub: 'UHD' },
  { id: '8k', label: '8K', sub: 'UHD' },
  { id: '16k', label: '16K', sub: 'Ultra' }
];

const SCALE_MULTIPLIERS = [1, 2, 4, 8, 16] as const;

export function ScaleSelector({
  scale,
  onScaleChange,
  preset,
  onPresetChange
}: ScaleSelectorProps): React.JSX.Element {
  return (
    <div className="setting-item">
      {/* Target Resolution Presets Header */}
      <div className="setting-header-row">
        <span className="setting-label">Target Resolution</span>
        <span className="setting-tag" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          {preset === 'custom' ? `${scale.toFixed(1)}x Custom` : preset.toUpperCase()}
        </span>
      </div>

      {/* Resolution Presets (FHD, 2K, 4K, 8K, 16K) */}
      <div className="segmented-control" style={{ overflowX: 'auto' }}>
        {RESOLUTION_PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`chip-btn ${preset === item.id ? 'active' : ''}`}
            onClick={() => onPresetChange(item.id)}
            title={`Set Target Resolution to ${item.label} (${item.sub})`}
          >
            <span>{item.label}</span>
            <span className="sub-pill">{item.sub}</span>
          </button>
        ))}
      </div>

      {/* Multiplier Presets Quick Bar */}
      <div className="scale-multipliers-row">
        <span className="scale-multipliers-title">Multiplier:</span>
        <div className="scale-multiplier-chips">
          {SCALE_MULTIPLIERS.map((mult) => (
            <button
              key={mult}
              type="button"
              className={`multiplier-chip ${scale === mult && preset === 'native' ? 'active' : ''}`}
              onClick={() => onScaleChange(mult)}
              title={`Scale ${mult}x`}
            >
              {mult}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
