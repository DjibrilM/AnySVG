import React from 'react';
import type { CompressionMode } from '../../lib/interfaces/conversion';

interface CompressionSelectorProps {
  compression: CompressionMode;
  onCompressionChange: (comp: CompressionMode) => void;
}

export function CompressionSelector({
  compression,
  onCompressionChange
}: CompressionSelectorProps): React.JSX.Element {
  const getSubtext = (): string => {
    switch (compression) {
      case 'none':
        return 'Uncompressed full resolution output. Zero compression artifacts, pristine 32-bit RGBA fidelity, and instant export.';
      case 'max':
        return 'Level 9 lossless deflate optimization. Bit-exact pixel rendering with maximum file compression.';
      case 'fast':
        return 'Standard Level 6 lossless deflate. Fast balanced compression with zero visual quality loss.';
      case 'quant':
        return 'TinyPNG 8-bit quantization. Drastically reduces size (~70%) by indexing to 256 colors, but may cause banding on 4K/8K gradients.';
      default:
        return 'Choose compression level for exported raster image.';
    }
  };

  return (
    <div className="setting-item">
      <div className="setting-header-row">
        <span className="setting-label">Compression Engine</span>
        <span
          className="setting-tag"
          style={{
            color: compression === 'none' ? '#4ade80' : compression === 'quant' ? '#f59e0b' : '#38bdf8',
            borderColor:
              compression === 'none'
                ? 'rgba(74, 222, 128, 0.3)'
                : compression === 'quant'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(56, 189, 248, 0.3)'
          }}
        >
          {compression === 'none' ? 'Raw Full Res' : compression === 'quant' ? 'Lossy Palette' : 'Lossless Sharp'}
        </span>
      </div>

      <div className="comp-grid">
        <button
          className={`comp-btn ${compression === 'none' ? 'active active-raw' : ''}`}
          onClick={() => onCompressionChange('none')}
          title="Uncompressed Full Resolution (0% Compression Loss, 32-bit RGBA)"
        >
          <span>Uncompressed</span>
          <span className="sub-pill pill-raw">RAW</span>
        </button>

        <button
          className={`comp-btn ${compression === 'max' ? 'active' : ''}`}
          onClick={() => onCompressionChange('max')}
          title="Level 9 Deflate (Lossless Maximum)"
        >
          <span>Max Deflate</span>
          <span className="sub-pill">L9</span>
        </button>

        <button
          className={`comp-btn ${compression === 'fast' ? 'active' : ''}`}
          onClick={() => onCompressionChange('fast')}
          title="Standard Deflate (Lossless Balanced)"
        >
          <span>Standard</span>
          <span className="sub-pill">L6</span>
        </button>

        <button
          className={`comp-btn ${compression === 'quant' ? 'active active-quant' : ''}`}
          onClick={() => onCompressionChange('quant')}
          title="TinyPNG 8-bit Quantization (High file savings, trades color resolution)"
        >
          <span>TinyPNG 8-bit</span>
          <span className="sub-pill pill-quant">-70%</span>
        </button>
      </div>

      <span className="setting-subtext" style={{ minHeight: '32px' }}>
        {getSubtext()}
      </span>
    </div>
  );
}
