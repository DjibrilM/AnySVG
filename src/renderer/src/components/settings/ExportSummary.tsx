import React from 'react';
import { formatDimensions } from '../../lib/utilities/formatters';
import type { CompressionMode } from '../../lib/interfaces/conversion';

interface ExportSummaryProps {
  currentW: number;
  currentH: number;
  scale: number;
  megaPixels: string;
  compression: CompressionMode;
}

export function ExportSummary({
  currentW,
  currentH,
  scale,
  megaPixels,
  compression
}: ExportSummaryProps): React.JSX.Element {
  return (
    <div className="summary-card">
      <div className="summary-row">
        <span className="summary-label">Target Canvas:</span>
        <span className="summary-val text-highlight font-mono">
          {formatDimensions(currentW, currentH)} px
        </span>
      </div>
      <div className="summary-row">
        <span className="summary-label">Scale Factor:</span>
        <span className="summary-val">{scale}x Resolution</span>
      </div>
      <div className="summary-row">
        <span className="summary-label">Total Pixels:</span>
        <span className="summary-val font-mono">{megaPixels} Megapixels</span>
      </div>
      <div className="summary-row">
        <span className="summary-label">Mode:</span>
        <span
          className="summary-val"
          style={{
            color: compression === 'none' ? '#4ade80' : 'inherit',
            fontWeight: compression === 'none' ? 600 : 'inherit'
          }}
        >
          {compression === 'none'
            ? 'Uncompressed (RAW)'
            : compression === 'quant'
              ? '8-Bit Quantized'
              : compression === 'fast'
                ? 'Standard Deflate (L6)'
                : 'L9 Deflate'}
        </span>
      </div>
    </div>
  );
}
