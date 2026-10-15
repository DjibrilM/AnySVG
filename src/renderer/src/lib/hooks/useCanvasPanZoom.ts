import { useState, useRef, useEffect, useCallback } from 'react';

interface UseCanvasPanZoomOptions {
  origW: number;
  origH: number;
  activeFileName?: string;
}

export function useCanvasPanZoom({ origW, origH, activeFileName }: UseCanvasPanZoomOptions) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan.x, pan.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>): void => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart.x, dragStart.y]);

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(prev => Math.min(Math.max(0.05, prev * zoomFactor), 8));
  }, []);

  const handleFit = useCallback((): void => {
    if (!containerRef.current || !activeFileName) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth <= 0 || clientHeight <= 0) return;
    const padding = 80;
    const availW = Math.max(100, clientWidth - padding);
    const availH = Math.max(100, clientHeight - padding);
    const fitScale = Math.min(availW / origW, availH / origH, 1.0);
    setZoom(Number(fitScale.toFixed(3)));
    setPan({ x: 0, y: 0 });
  }, [activeFileName, origW, origH]);

  const zoomIn = useCallback((): void => {
    setZoom(z => Math.min(8, z * 1.15));
  }, []);

  const zoomOut = useCallback((): void => {
    setZoom(z => Math.max(0.1, z * 0.85));
  }, []);

  const resetZoom = useCallback((): void => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Fit to screen when active file changes
  useEffect(() => {
    handleFit();
    setImgLoaded(false);
  }, [activeFileName, origW, origH, handleFit]);

  // Window resize auto-fit listener
  useEffect(() => {
    const onResize = () => handleFit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [origW, origH, activeFileName, handleFit]);

  return {
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
  };
}
