import React from 'react';
import type { SvgFile } from '../../lib/interfaces/svg';
import { useCanvasPanZoom } from '../../lib/hooks/useCanvasPanZoom';
import { CanvasStage } from './CanvasStage';
import { CanvasToolbar } from './CanvasToolbar';

export interface CanvasViewportProps {
  activeFile?: SvgFile | null;
  scale?: number;
  customWidth?: number | null;
  customHeight?: number | null;
  bgColor?: string;
  previewDataUrl?: string | null;
  isPreviewLoading?: boolean;
}

export function CanvasViewport({
  activeFile,
  scale = 4,
  customWidth,
  customHeight,
  bgColor = 'transparent',
  previewDataUrl,
  isPreviewLoading
}: CanvasViewportProps): React.JSX.Element {
  const origW = activeFile?.width || 800;
  const origH = activeFile?.height || 600;
  const outW = customWidth || Math.round(origW * scale);
  const outH = customHeight || Math.round(origH * scale);

  const {
    zoom,
    pan,
    isDragging,
    imgLoaded,
    setImgLoaded,
    containerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleFit,
    zoomIn,
    zoomOut,
    resetZoom
  } = useCanvasPanZoom({
    origW,
    origH,
    activeFileName: activeFile?.name
  });

  return (
    <main className="preview-area">
      {/* Main Viewport Stage with Pan & Zoom */}
      <CanvasStage
        containerRef={containerRef}
        activeFile={activeFile}
        pan={pan}
        zoom={zoom}
        isDragging={isDragging}
        origW={origW}
        origH={origH}
        bgColor={bgColor}
        previewDataUrl={previewDataUrl}
        isPreviewLoading={isPreviewLoading}
        imgLoaded={imgLoaded}
        onImgLoad={() => {
          setImgLoaded(true);
          handleFit();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating Studio Toolbar */}
      {activeFile && (
        <CanvasToolbar
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onFit={handleFit}
          onReset={resetZoom}
          origW={origW}
          origH={origH}
          outW={outW}
          outH={outH}
          scale={scale}
        />
      )}
    </main>
  );
}

export default CanvasViewport;
