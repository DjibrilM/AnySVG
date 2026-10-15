import React from 'react';
import { isPresetColor, normalizeHex } from '../../lib/utilities/color';

interface BackgroundColorPickerProps {
  bgColor: string;
  onBgColorChange: (color: string) => void;
}

const BG_PRESETS = [
  { id: 'transparent', label: 'Alpha', color: 'transparent' },
  { id: '#ffffff', label: 'White', color: '#ffffff' },
  { id: '#000000', label: 'Black', color: '#000000' }
] as const;

export function BackgroundColorPicker({
  bgColor,
  onBgColorChange
}: BackgroundColorPickerProps): React.JSX.Element {
  const isPreset = isPresetColor(bgColor);
  const hexValue = normalizeHex(bgColor);

  return (
    <div className="setting-item">
      <div className="setting-header-row">
        <span className="setting-label">Canvas Background</span>
        <span className="setting-tag font-mono">{bgColor}</span>
      </div>

      <div className="bg-segmented">
        {BG_PRESETS.map(item => {
          const isSelected = bgColor.toLowerCase() === item.id.toLowerCase();
          return (
            <label
              key={item.id}
              className={`radio-card ${isSelected ? 'active' : ''}`}
              onClick={() => onBgColorChange(item.id)}
            >
              <input
                type="radio"
                name="bg"
                value={item.id}
                checked={isSelected}
                readOnly
              />
              <span
                className="swatch-inline"
                style={{
                  backgroundColor: item.color === 'transparent' ? undefined : item.color,
                  background: item.color === 'transparent'
                    ? 'repeating-conic-gradient(#52525b 0% 25%, #27272a 0% 50%) 50% / 6px 6px'
                    : item.color
                }}
              />
              <span>{item.label}</span>
            </label>
          );
        })}

        {/* Custom Color Picker via native OS dialog */}
        <label
          className={`radio-card custom-swatch-card ${!isPreset ? 'active' : ''}`}
          title="Choose custom background color"
        >
          <input
            type="color"
            className="color-picker-input"
            value={hexValue}
            onChange={(e) => onBgColorChange(e.target.value)}
          />
          <span
            className="swatch-inline"
            style={{
              backgroundColor: !isPreset ? hexValue : undefined,
              background: isPreset
                ? 'conic-gradient(#ef4444, #f59e0b, #10b981, #06b6d4, #8b5cf6, #ef4444)'
                : undefined
            }}
          />
          <span>Custom</span>
        </label>
      </div>
    </div>
  );
}
