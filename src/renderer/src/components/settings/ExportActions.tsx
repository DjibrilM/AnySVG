import React from 'react';
import { Download, Loader2, Archive, FolderOpen } from 'lucide-react';
import type { SvgFile } from '../../lib/interfaces/svg';
import type { CompressionMode, ResolutionPreset } from '../../lib/interfaces/conversion';

interface ExportActionsProps {
  files?: SvgFile[];
  activeFile?: SvgFile | null;
  format: 'png' | 'jpeg';
  scale: number;
  compression?: CompressionMode;
  preset?: ResolutionPreset;
  customWidth?: number | null;
  customHeight?: number | null;
  isConverting: boolean;
  onConvertSingle: () => void;
  isConvertingAll?: boolean;
  onConvertAll?: () => void;
  convertAllProgress?: {
    current: number;
    total: number;
    currentFile?: string;
    status?: string;
  };
  lastZipUrl?: string | null;
  onOpenFolder?: (path?: string) => void;
}

export function ExportActions({
  files = [],
  activeFile,
  format,
  scale,
  compression = 'none',
  preset = 'native',
  customWidth,
  customHeight,
  isConverting,
  onConvertSingle,
  isConvertingAll = false,
  onConvertAll,
  convertAllProgress,
  lastZipUrl,
  onOpenFolder
}: ExportActionsProps): React.JSX.Element {
  let resolutionTag = `${scale.toFixed(scale % 1 === 0 ? 0 : 1)}x`;
  if (preset && preset !== 'custom' && preset !== 'native') {
    resolutionTag = preset.toUpperCase();
  } else if (customWidth && customHeight) {
    const maxEdge = Math.max(customWidth, customHeight);
    if (maxEdge >= 15000) resolutionTag = '16K';
    else if (maxEdge >= 7000) resolutionTag = '8K';
    else if (maxEdge >= 3600) resolutionTag = '4K';
    else if (maxEdge >= 2400) resolutionTag = '2K';
    else if (maxEdge >= 1800) resolutionTag = '1080p';
  }

  const uncompressedTag = compression === 'none' ? ' • RAW' : '';
  const exportLabel = `Export ${format.toUpperCase()} (${resolutionTag}${uncompressedTag})`;

  return (
    <div className="settings-footer" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Single Vector Export */}
      <button
        className="btn btn-primary btn-lg w-full"
        onClick={onConvertSingle}
        disabled={!activeFile || isConverting || isConvertingAll}
        style={{
          height: 42,
          minHeight: 42,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 600,
          gap: 6
        }}
        type="button"
      >
        {isConverting ? (
          <>
            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Exporting Vector...</span>
          </>
        ) : (
          <>
            <Download size={15} />
            <span>{exportLabel}</span>
          </>
        )}
      </button>

      {/* Batch Export All as ZIP (Available when multiple files exist) */}
      {onConvertAll && files.length > 1 && (
        <button
          className="btn btn-secondary w-full"
          onClick={onConvertAll}
          disabled={isConverting || isConvertingAll}
          style={{
            height: 36,
            minHeight: 36,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 500,
            gap: 6
          }}
          type="button"
        >
          {isConvertingAll ? (
            <>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>
                {convertAllProgress?.status === 'zipping'
                  ? 'Packaging ZIP...'
                  : `Converting (${convertAllProgress?.current || 0}/${convertAllProgress?.total || files.length})...`}
              </span>
            </>
          ) : (
            <>
              <Archive size={14} />
              <span>Export All ({files.length}) as ZIP ({resolutionTag})</span>
            </>
          )}
        </button>
      )}

      {/* Reveal ZIP in Finder when available */}
      {lastZipUrl && onOpenFolder && (
        <button
          type="button"
          onClick={() => onOpenFolder(lastZipUrl)}
          className="btn btn-outline btn-xs w-full"
          style={{
            height: 28,
            minHeight: 28,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            gap: 5
          }}
        >
          <FolderOpen size={12} />
          <span>Reveal ZIP Archive</span>
        </button>
      )}
    </div>
  );
}
