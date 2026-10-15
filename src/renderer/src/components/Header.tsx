import React from 'react';
import { RotateCcw, Cpu, FolderOpen } from 'lucide-react';

interface HeaderProps {
  fileCount?: number;
  onResetWorkspace?: () => void;
  onOpenOutputFolder?: () => void;
}

export default function Header({ fileCount = 0, onResetWorkspace, onOpenOutputFolder }: HeaderProps): React.JSX.Element {
  return (
    <header 
      className="app-header"
      style={{
        WebkitAppRegion: 'drag',
        paddingLeft: 78 // space for macOS traffic lights in hiddenInset mode
      }}
    >
      {/* Left traffic-light spacing */}
      <div className="header-left" style={{ WebkitAppRegion: 'no-drag', minWidth: 20 }} />

      {/* Center: Compact Workspace Status Pill (Reduced Height, Clean Zinc, No Green) */}
      <div className="header-center" style={{ WebkitAppRegion: 'no-drag' }}>
        <div
          className="workspace-pill"
          style={{
            height: 26,
            minHeight: 26,
            padding: '0 10px',
            borderRadius: 9999,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid #27272a',
            color: '#a1a1aa',
            fontSize: 11,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#71717a'
              }}
            />
            <span style={{ color: '#e4e4e7', fontWeight: 500 }}>
              {fileCount} project SVGs
            </span>
            <span style={{ color: '#71717a' }}>•</span>
            <span style={{ color: '#a1a1aa' }}>Ready</span>
          </span>

          {fileCount > 0 && onResetWorkspace && (
            <button
              onClick={onResetWorkspace}
              className="btn-icon-xs"
              title="Refresh workspace files"
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: 2
              }}
            >
              <RotateCcw size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Right: Engine Specs & Output Folder Button (Lossless 8K badge removed as requested) */}
      <div className="header-right" style={{ WebkitAppRegion: 'no-drag' }}>
        {onOpenOutputFolder && (
          <button
            onClick={onOpenOutputFolder}
            className="btn btn-xs btn-outline"
            title="Open output exports directory in Finder / Explorer"
            style={{
              height: 26,
              minHeight: 26,
              padding: '0 9px',
              gap: 5,
              fontSize: 11,
              borderRadius: 6
            }}
          >
            <FolderOpen size={12} />
            <span>Exports Folder</span>
          </button>
        )}

        <div className="engine-pill" title="Ultra-HD rasterization via Electron, Headless Chrome & Sharp v0.35">
          <Cpu size={12} strokeWidth={2} />
          <span>Electron + Sharp v0.35</span>
        </div>
      </div>
    </header>
  );
}
