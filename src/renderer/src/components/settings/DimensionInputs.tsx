import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface DimensionInputsProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  origW: number;
  origH: number;
  currentW: number;
  currentH: number;
  aspectLocked: boolean;
  onToggleAspectLock: () => void;
  onDimensionsChange: (w: number, h: number) => void;
}

export function DimensionInputs({
  scale,
  onScaleChange,
  origW,
  origH,
  currentW,
  currentH,
  aspectLocked,
  onToggleAspectLock,
  onDimensionsChange
}: DimensionInputsProps): React.JSX.Element {
  const handleWidthInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = parseInt(e.target.value, 10);
    if (!val || val <= 0) return;
    if (aspectLocked && origW > 0) {
      const newH = Math.round((val / origW) * origH);
      onDimensionsChange(val, newH);
    } else {
      onDimensionsChange(val, currentH);
    }
  };

  const handleHeightInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = parseInt(e.target.value, 10);
    if (!val || val <= 0) return;
    if (aspectLocked && origH > 0) {
      const newW = Math.round((val / origH) * origW);
      onDimensionsChange(newW, val);
    } else {
      onDimensionsChange(currentW, val);
    }
  };

  const maxSlider = Math.max(16, Math.ceil(scale));
  const displayScale = Number(scale.toFixed(2));

  return (
    <div className="custom-dims-box">
      <div className="slider-block">
        <div className="slider-header">
          <span className="slider-title">Scale Factor</span>
          <span className="slider-num font-mono">{displayScale}x</span>
        </div>
        <input
          type="range"
          min="1"
          max={maxSlider}
          step="0.5"
          value={Math.min(scale, maxSlider)}
          onChange={(e) => onScaleChange(parseFloat(e.target.value))}
          className="shadcn-slider"
        />
      </div>

      <div className="dims-row">
        <div className="input-wrap">
          <span className="input-label">Width (px)</span>
          <input
            type="number"
            value={currentW}
            onChange={handleWidthInput}
            className="shadcn-input font-mono"
            min="1"
            max="16384"
          />
        </div>

        <button
          className={`aspect-btn ${aspectLocked ? 'active' : ''}`}
          onClick={onToggleAspectLock}
          title={aspectLocked ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}
          type="button"
        >
          {aspectLocked ? <Lock size={13} /> : <Unlock size={13} />}
        </button>

        <div className="input-wrap">
          <span className="input-label">Height (px)</span>
          <input
            type="number"
            value={currentH}
            onChange={handleHeightInput}
            className="shadcn-input font-mono"
            min="1"
            max="16384"
          />
        </div>
      </div>
    </div>
  );
}
