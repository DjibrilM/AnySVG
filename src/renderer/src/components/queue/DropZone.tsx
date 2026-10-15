import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface DropZoneProps {
  isDraggingOver: boolean;
  onNativeSelectFiles?: (() => void) | null;
  onUploadFile: (file: File) => void;
}

export function DropZone({
  isDraggingOver,
  onNativeSelectFiles,
  onUploadFile
}: DropZoneProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        if (file.name.toLowerCase().endsWith('.svg')) {
          onUploadFile(file);
        }
      });
    }
  };

  const handleClick = (): void => {
    if (onNativeSelectFiles) {
      onNativeSelectFiles();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      className={`drop-zone ${isDraggingOver ? 'dragover' : ''}`}
      onClick={handleClick}
    >
      <Upload size={16} className="drop-zone-icon" />
      <span className="drop-zone-text">
        {isDraggingOver ? 'Release to drop SVGs' : 'Drop SVG files here'}
      </span>
      <span className="drop-zone-sub">
        {isDraggingOver ? 'Imports directly into workspace' : 'or click to choose files from disk'}
      </span>
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
    </div>
  );
}
