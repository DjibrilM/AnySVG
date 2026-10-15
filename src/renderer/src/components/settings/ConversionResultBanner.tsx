import React from 'react';
import { CheckCircle2, FolderOpen } from 'lucide-react';
import type { ConvertResult } from '../../lib/interfaces/conversion';
import { formatSavings } from '../../lib/utilities/formatters';

interface ConversionResultBannerProps {
  lastResult?: ConvertResult | null;
  onOpenFolder?: (path?: string) => void;
}

export function ConversionResultBanner({
  lastResult,
  onOpenFolder
}: ConversionResultBannerProps): React.JSX.Element | null {
  if (!lastResult || !lastResult.success) return null;

  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: 5 }}>
          <CheckCircle2 size={13} />
          Rasterized & Compressed
        </span>
        <span style={{ fontSize: 10, color: '#a1a1aa' }}>
          {formatSavings(lastResult.savings)} saved
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#e4e4e7' }}>
        Size: <strong>{((lastResult.compressedSize || 0) / 1024).toFixed(0)} KB</strong> (from {((lastResult.originalSize || 0) / 1024).toFixed(0)} KB)
      </div>
      {onOpenFolder && lastResult.fullPath && (
        <button
          onClick={() => onOpenFolder(lastResult.fullPath)}
          className="btn btn-xs btn-primary"
          style={{ marginTop: 4, height: 26, minHeight: 26, width: '100%' }}
        >
          <FolderOpen size={12} />
          <span>Reveal in Finder</span>
        </button>
      )}
    </div>
  );
}
