import React from 'react';
import { Download, Loader2, Archive, FolderOpen } from 'lucide-react';
import type { SvgFile } from '../../lib/interfaces/svg';
import type { CompressionMode } from '../../lib/interfaces/conversion';

interface ExportActionsProps {
  files?: SvgFile[];
  activeFile?: SvgFile | null;
  format: 'png' | 'jpeg';
  scale: number;
  compression?: CompressionMode;
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
  compression,
  isConverting,
  onConvertSingle,
  isConvertingAll = false,
  onConvertAll,
  convertAllProgress,
  lastZipUrl,
  onOpenFolder
}: ExportActionsProps): React.JSX.Element {
  const rawTag = compression === 'none' ? ' • RAW' : '';

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
            <span>Export {format.toUpperCase()} ({scale}x{rawTag})</span>
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
              <span>Export All ({files.length}) as ZIP ({scale}x)</span>
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
