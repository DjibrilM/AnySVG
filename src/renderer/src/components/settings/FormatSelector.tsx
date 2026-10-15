import React from 'react';

interface FormatSelectorProps {
  format: 'png' | 'jpeg';
  onFormatChange: (fmt: 'png' | 'jpeg') => void;
}

export function FormatSelector({ format, onFormatChange }: FormatSelectorProps): React.JSX.Element {
  return (
    <div className="setting-item">
      <div className="setting-header-row">
        <span className="setting-label">Export Format</span>
        <span className="setting-tag">{format.toUpperCase()}</span>
      </div>

      <div className="segmented-control">
        <button
          className={`format-btn ${format === 'png' ? 'active' : ''}`}
          onClick={() => onFormatChange('png')}
        >
          PNG (Lossless Alpha)
        </button>
        <button
          className={`format-btn ${format === 'jpeg' ? 'active' : ''}`}
          onClick={() => onFormatChange('jpeg')}
        >
          JPEG (MozJPEG 90%)
        </button>
      </div>
    </div>
  );
}
