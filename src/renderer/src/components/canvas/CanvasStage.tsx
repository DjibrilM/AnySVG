import React from 'react';
import { RotateCcw } from 'lucide-react';
import type { SvgFile } from '../../lib/interfaces/svg';

interface CanvasStageProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  activeFile?: SvgFile | null;
  pan: { x: number; y: number };
  zoom: number;
  isDragging: boolean;
  origW: number;
  origH: number;
  bgColor?: string;
  previewDataUrl?: string | null;
  isPreviewLoading?: boolean;
  imgLoaded: boolean;
  onImgLoad: () => void;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
}

export function CanvasStage({
  containerRef,
  activeFile,
  pan,
  zoom,
  isDragging,
  origW,
  origH,
  bgColor = 'transparent',
  previewDataUrl,
  isPreviewLoading,
  imgLoaded,
  onImgLoad,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel
}: CanvasStageProps): React.JSX.Element {
  return (
    <div
      ref={containerRef}
      className="viewport-stage"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {activeFile ? (
        <div
          className="canvas-pan-container"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
        >
          <div
            className={`canvas-wrapper ${(!bgColor || bgColor === 'transparent') ? 'checkerboard-bg' : ''}`}
            style={{
              width: origW,
              height: origH,
              backgroundColor: (bgColor && bgColor !== 'transparent') ? bgColor : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt={activeFile.name}
                onLoad={onImgLoad}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: imgLoaded ? 1 : 0.4,
                  transition: 'opacity 0.2s ease',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
              />
            ) : null}

            {(!imgLoaded || isPreviewLoading) && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(9, 9, 11, 0.6)',
                  color: '#a1a1aa',
                  fontSize: 12,
                  gap: 8
                }}
              >
                <RotateCcw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Loading rasterizer preview...</span>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
