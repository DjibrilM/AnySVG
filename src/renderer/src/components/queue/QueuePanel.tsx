import React, { useRef, useState } from 'react';
import type { SvgFile } from '../../lib/interfaces/svg';
import type { ConvertResult } from '../../lib/interfaces/conversion';

import { QueueOverlay } from './QueueOverlay';
import { QueueHeader } from './QueueHeader';
import { DropZone } from './DropZone';
import { WorkspaceBanner } from './WorkspaceBanner';
import { QueueList } from './QueueList';
import { BatchProgressFooter } from './BatchProgressFooter';

export interface QueuePanelProps {
  files?: SvgFile[];
  activeFile?: SvgFile | null;
  onSelectFile: (file: SvgFile) => void;
  onUploadFile: (file: File) => void;
  onImportPaths?: ((paths: string[]) => void) | null;
  onNativeSelectFiles?: (() => void) | null;
  onOpenFolder?: (path?: string) => void;
  onRemoveFile?: (filename: string) => void;
  onClearQueue?: () => void;
  isConverting?: boolean;
  isConvertingAll: boolean;
  convertAllProgress: {
    current: number;
    total: number;
    currentFile?: string;
    status?: string;
  };
  conversionResults?: Record<string, ConvertResult>;
}

export function QueuePanel({
  files = [],
  activeFile,
  onSelectFile,
  onUploadFile,
  onImportPaths,
  onNativeSelectFiles,
  onOpenFolder,
  onRemoveFile,
  onClearQueue,
  isConverting = false,
  isConvertingAll,
  convertAllProgress,
  conversionResults = {}
}: QueuePanelProps): React.JSX.Element {
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const dragCounter = useRef<number>(0);

  const handleDragEnter = (e: React.DragEvent<HTMLElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    if (onImportPaths && window.api) {
      const paths: string[] = [];
      const fallbackFiles: File[] = [];

      for (let i = 0; i < droppedFiles.length; i++) {
        const file = droppedFiles[i];
        let filePath = '';
        if (window.api.getPathForFile) {
          try {
            filePath = window.api.getPathForFile(file);
          } catch (err) {
            console.warn('getPathForFile error:', err);
          }
        }
        if (!filePath && (file as any).path) {
          filePath = (file as any).path;
        }

        if (filePath) {
          paths.push(filePath);
        } else if (file.name.toLowerCase().endsWith('.svg')) {
          fallbackFiles.push(file);
        }
      }

      if (paths.length > 0) {
        onImportPaths(paths);
      }
      if (fallbackFiles.length > 0) {
        fallbackFiles.forEach(f => onUploadFile(f));
      }
    } else {
      Array.from(droppedFiles).forEach(file => {
        if (file.name.toLowerCase().endsWith('.svg')) {
          onUploadFile(file);
        }
      });
    }
  };

  return (
    <aside
      className={`sidebar-panel ${isDraggingOver ? 'sidebar-drag-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Visual Overlay when dragging files anywhere over the sidebar */}
      <QueueOverlay isDraggingOver={isDraggingOver} />

      {/* Panel Header */}
      <QueueHeader count={files.length} onClearQueue={onClearQueue} />

      {/* Upload Drop Zone / Native Dialog Trigger */}
      <DropZone
        isDraggingOver={isDraggingOver}
        onNativeSelectFiles={onNativeSelectFiles}
        onUploadFile={onUploadFile}
      />

      {/* Reduced-Height Detected SVGs Banner */}
      <WorkspaceBanner count={files.length} />

      {/* Queue List */}
      <QueueList
        files={files}
        activeFile={activeFile}
        conversionResults={conversionResults}
        isConverting={isConverting}
        isConvertingAll={isConvertingAll}
        convertAllProgress={convertAllProgress}
        onSelectFile={onSelectFile}
        onRemoveFile={onRemoveFile}
        onOpenFolder={onOpenFolder}
      />

      {/* Queue Footer with Live Batch Conversion Progress */}
      <BatchProgressFooter
        isConvertingAll={isConvertingAll}
        convertAllProgress={convertAllProgress}
      />
    </aside>
  );
}

export default QueuePanel;
