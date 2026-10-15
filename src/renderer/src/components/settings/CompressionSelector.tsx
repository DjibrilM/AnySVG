import React from 'react';

interface CompressionSelectorProps {
  compression: 'max' | 'quant' | 'fast';
  onCompressionChange: (comp: 'max' | 'quant' | 'fast') => void;
}

export function CompressionSelector({
  compression,
  onCompressionChange
}: CompressionSelectorProps): React.JSX.Element {
  return (
    <div className="setting-item">
      <div className="setting-header-row">
        <span className="setting-label">Compression Engine</span>
        <span className="setting-tag" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          Sharp Engine
        </span>
      </div>

      <div className="segmented-control">
        <button
          className={`comp-btn ${compression === 'max' ? 'active' : ''}`}
          onClick={() => onCompressionChange('max')}
          title="Level 9 Deflate (Lossless)"
        >
          <span>Max Deflate</span>
          <span className="sub-pill">L9</span>
        </button>
        <button
          className={`comp-btn ${compression === 'quant' ? 'active' : ''}`}
          onClick={() => onCompressionChange('quant')}
          title="TinyPNG 8-bit Quantization (High Savings)"
        >
          <span>TinyPNG 8-bit</span>
          <span className="sub-pill">-70%</span>
        </button>
        <button
          className={`comp-btn ${compression === 'fast' ? 'active' : ''}`}
          onClick={() => onCompressionChange('fast')}
          title="Standard Compression"
        >
          <span>Standard</span>
          <span className="sub-pill">L6</span>
        </button>
      </div>
      <span className="setting-subtext">
        Executes secondary deep deflate optimization or 8-bit palette reduction via Sharp.
      </span>
    </div>
  );
}
