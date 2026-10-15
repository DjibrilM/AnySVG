import React from 'react';
import type { SvgFile } from '../../lib/interfaces/svg';
import type { ConvertResult } from '../../lib/interfaces/conversion';
import { QueueEmpty } from './QueueEmpty';
import { QueueItem } from './QueueItem';

interface QueueListProps {
  files: SvgFile[];
  activeFile?: SvgFile | null;
  conversionResults?: Record<string, ConvertResult>;
  isConverting?: boolean;
  isConvertingAll: boolean;
  convertAllProgress: {
    current: number;
    total: number;
    currentFile?: string;
    status?: string;
  };
  onSelectFile: (file: SvgFile) => void;
  onRemoveFile?: (filename: string) => void;
  onOpenFolder?: (path?: string) => void;
}

export function QueueList({
  files,
  activeFile,
  conversionResults = {},
  isConverting = false,
  isConvertingAll,
  convertAllProgress,
  onSelectFile,
  onRemoveFile,
  onOpenFolder
}: QueueListProps): React.JSX.Element {
  if (files.length === 0) {
    return (
      <div className="queue-list">
        <QueueEmpty />
      </div>
    );
  }

  return (
    <div className="queue-list">
      {files.map((file) => {
        const isActive = activeFile?.name === file.name;
        const res = conversionResults[file.name];
        const isThisConverting =
          (isConverting && activeFile?.name === file.name) ||
          (isConvertingAll &&
            convertAllProgress.status === 'converting' &&
            convertAllProgress.currentFile === file.name);

        return (
          <QueueItem
            key={file.name}
            file={file}
            isActive={isActive}
            isThisConverting={isThisConverting}
            result={res}
            onSelect={() => onSelectFile(file)}
            onRemove={onRemoveFile ? () => onRemoveFile(file.name) : undefined}
            onOpenFolder={onOpenFolder}
          />
        );
      })}
    </div>
  );
}
