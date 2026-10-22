import React, { useEffect } from 'react';
import Header from './components/Header';
import QueuePanel from './components/queue';
import CanvasViewport from './components/canvas';
import SettingsPanel from './components/settings';
import { useToast, useOutputDir, useConversion, useFiles } from './lib/hooks';

export default function App(): React.JSX.Element {
  const isElectron = typeof window !== 'undefined' && !!window.api?.isElectron;

  // Notification Toast Hook
  const { toast, showToast } = useToast();

  // Export Output Directory Hook
  const { outputDir, handleSelectOutputDir, handleOpenFolder } = useOutputDir({
    isElectron,
    showToast
  });

  // Conversion Settings & Execution Hook
  const {
    scale,
    customWidth,
    customHeight,
    aspectLocked,
    setAspectLocked,
    bgColor,
    setBgColor,
    format,
    setFormat,
    compression,
    setCompression,
    handleScaleChange,
    handleDimensionsChange,
    handleDimensionsReset,
    isConverting,
    isConvertingAll,
    convertAllProgress,
    lastResult,
    lastZipUrl,
    conversionResults,
    handleConvertSingle,
    handleConvertAll,
    clearConversionResults,
    removeFileResult
  } = useConversion({
    isElectron,
    showToast
  });

  // SVG Files Workspace Queue Hook
  const {
    files,
    activeFile,
    previewDataUrl,
    isPreviewLoading,
    fetchFiles,
    handleSelectFile,
    handleImportPaths,
    handleUploadFile,
    handleNativeSelectFiles,
    handleRemoveFile,
    handleClearQueue
  } = useFiles({
    isElectron,
    showToast,
    onDimensionsReset: handleDimensionsReset,
    onClearResults: clearConversionResults,
    onRemoveResult: removeFileResult
  });

  // Prevent Chromium from navigating away on dropped files outside drop targets
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent): void => {
      e.preventDefault();
    };
    const handleGlobalDrop = (e: DragEvent): void => {
      e.preventDefault();
    };

    window.addEventListener('dragover', handleGlobalDragOver, false);
    window.addEventListener('drop', handleGlobalDrop, false);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver, false);
      window.removeEventListener('drop', handleGlobalDrop, false);
    };
  }, []);

  return (
    <div className="app-layout">
      {/* Top Header with Window Dragging & Folder Button */}
      <Header
        fileCount={files.length}
        onResetWorkspace={fetchFiles}
        onOpenOutputFolder={() => handleOpenFolder(outputDir || undefined)}
      />

      {/* 3-Column Studio Layout */}
      <div className="app-main">
        {/* Left: Queue & Batch Actions */}
        <QueuePanel
          files={files}
          activeFile={activeFile}
          onSelectFile={handleSelectFile}
          onUploadFile={handleUploadFile}
          onImportPaths={isElectron ? handleImportPaths : null}
          onNativeSelectFiles={isElectron ? handleNativeSelectFiles : null}
          onOpenFolder={handleOpenFolder}
          onRemoveFile={handleRemoveFile}
          onClearQueue={handleClearQueue}
          isConverting={isConverting}
          isConvertingAll={isConvertingAll}
          convertAllProgress={convertAllProgress}
          conversionResults={conversionResults}
        />

        {/* Center: Interactive Studio Canvas */}
        <CanvasViewport
          activeFile={activeFile}
          scale={scale}
          customWidth={customWidth}
          customHeight={customHeight}
          bgColor={bgColor}
          previewDataUrl={previewDataUrl}
          isPreviewLoading={isPreviewLoading}
        />

        {/* Right: Export & Compression Settings */}
        <SettingsPanel
          files={files}
          activeFile={activeFile}
          scale={scale}
          onScaleChange={handleScaleChange}
          customWidth={customWidth}
          customHeight={customHeight}
          onDimensionsChange={handleDimensionsChange}
          aspectLocked={aspectLocked}
          onToggleAspectLock={() => setAspectLocked(!aspectLocked)}
          bgColor={bgColor}
          onBgColorChange={setBgColor}
          format={format}
          onFormatChange={setFormat}
          compression={compression}
          onCompressionChange={setCompression}
          isConverting={isConverting}
          onConvertSingle={() => handleConvertSingle(activeFile)}
          isConvertingAll={isConvertingAll}
          onConvertAll={() => handleConvertAll(files)}
          convertAllProgress={convertAllProgress}
          lastZipUrl={lastZipUrl}
          outputDir={outputDir}
          onChangeOutputDir={handleSelectOutputDir}
          onOpenFolder={handleOpenFolder}
          lastResult={lastResult}
        />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  );
}
