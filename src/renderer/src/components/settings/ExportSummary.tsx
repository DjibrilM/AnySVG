import React from 'react';
import { formatDimensions } from '../../lib/utilities/formatters';
import type { CompressionMode, ResolutionPreset } from '../../lib/interfaces/conversion';

interface ExportSummaryProps {
  currentW: number;
  currentH: number;
  scale: number;
  megaPixels: string;
  compression: CompressionMode;
  preset?: ResolutionPreset;
}

export function ExportSummary({
  currentW,
  currentH,
  scale,
  megaPixels,
  compression,
  preset
}: ExportSummaryProps): React.JSX.Element {
  const maxEdge = Math.max(currentW, currentH);
  let resCategory = 'Standard';
  if (maxEdge >= 15000) resCategory = '16K Ultra';
  else if (maxEdge >= 7000) resCategory = '8K UHD';
  else if (maxEdge >= 3600) resCategory = '4K UHD';
  else if (maxEdge >= 2400) resCategory = '2K QHD';
  else if (maxEdge >= 1800) resCategory = '1080p FHD';

  const getModeLabel = (): string => {
    switch (compression) {
      case 'none':
        return 'Uncompressed (32-bit Raw)';
      case 'max':
        return 'Lossless Deflate (L9)';
      case 'fast':
        return 'Standard Deflate (L6)';
      case 'quant':
        return '8-Bit TinyPNG (Indexed)';
      default:
        return 'Lossless';
    }
  };

  return (
    <div className="summary-card">
      <div className="summary-row">
        <span className="summary-label">Target Canvas:</span>
        <span className="summary-val text-highlight font-mono">
          {formatDimensions(currentW, currentH)} px
        </span>
      </div>
      <div className="summary-row">
        <span className="summary-label">Resolution Class:</span>
        <span className="summary-val font-semibold" style={{ color: '#38bdf8' }}>
          {resCategory} ({megaPixels} MP)
        </span>
      </div>
      <div className="summary-row">
        <span className="summary-label">Scale Factor:</span>
        <span className="summary-val font-mono">{scale.toFixed(scale % 1 === 0 ? 0 : 2)}x Native</span>
      </div>
      <div className="summary-row">
        <span className="summary-label">Fidelity Mode:</span>
        <span
          className="summary-val font-medium"
          style={{
            color: compression === 'none' ? '#4ade80' : compression === 'quant' ? '#f59e0b' : 'inherit'
          }}
        >
          {getModeLabel()}
        </span>
      </div>
    </div>
  );
}
