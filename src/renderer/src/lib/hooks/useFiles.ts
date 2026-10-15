import { useState, useEffect, useCallback } from 'react';
import type { SvgFile } from '../interfaces/svg';
import { fileService } from '../../core/services/file.service';

interface UseFilesOptions {
  isElectron?: boolean;
  showToast: (msg: string) => void;
  onDimensionsReset?: () => void;
  onClearResults?: () => void;
  onRemoveResult?: (filename: string) => void;
}

export function useFiles({
  showToast,
  onDimensionsReset,
  onClearResults,
  onRemoveResult
}: UseFilesOptions) {
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [files, setFiles] = useState<SvgFile[]>([]);
  const [activeFile, setActiveFile] = useState<SvgFile | null>(null);

  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  // Fetch SVG files list from FileService
  const fetchFiles = useCallback(async (): Promise<void> => {
    try {
      const res = await fileService.getFiles();
      if (res.success && res.files) {
        setFiles(res.files);
        if (res.files.length > 0) {
          setActiveFile(prev => {
            if (prev && res.files.some(f => f.name === prev.name)) return prev;
            return res.files[0];
          });
        } else {
          setActiveFile(null);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch SVG files:', err);
      showToast('Could not load workspace SVG files');
    }
  }, [showToast]);

  // Initial load
  useEffect(() => {
    fetchFiles().finally(() => {
      setIsAppLoading(false);
    });
  }, [fetchFiles]);

  // Load preview thumbnail when active file changes
  useEffect(() => {
    if (!activeFile) {
      setPreviewDataUrl(null);
      return;
    }

    let isMounted = true;
    setIsPreviewLoading(true);

    fileService.getPreview(activeFile.name)
      .then(res => {
        if (isMounted) {
          if (res.success && res.dataUrl) {
            setPreviewDataUrl(res.dataUrl);
          }
          setIsPreviewLoading(false);
        }
      })
      .catch(err => {
        console.error('Preview error:', err);
        if (isMounted) setIsPreviewLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeFile]);

  // Handle active file selection
  const handleSelectFile = useCallback((file: SvgFile): void => {
    setActiveFile(file);
    if (onDimensionsReset) onDimensionsReset();
  }, [onDimensionsReset]);

  // Import files or folders dropped via filesystem paths
  const handleImportPaths = useCallback(async (paths: string[]): Promise<void> => {
    try {
      const res = await fileService.importFiles(paths);
      if (res.success && res.files && res.files.length > 0) {
        showToast(`Imported ${res.files.length} vector file${res.files.length > 1 ? 's' : ''}`);
        await fetchFiles();
        setActiveFile(res.files[0]);
      } else {
        throw new Error(res.error || 'Import failed');
      }
    } catch (err: any) {
      console.error('Import paths error:', err);
      showToast(`Import failed: ${err.message}`);
    }
  }, [showToast, fetchFiles]);

  // Upload an SVG file via content
  const handleUploadFile = useCallback(async (file: File): Promise<void> => {
    try {
      const content = await file.text();
      const res = await fileService.uploadSvg(file.name, content);
      if (res.success && res.file) {
        showToast(`Imported ${res.file.name}`);
        await fetchFiles();
        setActiveFile(res.file);
      } else {
        throw new Error(res.error || 'Import failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      showToast(`Upload failed: ${err.message}`);
    }
  }, [showToast, fetchFiles]);

  // Native Open Dialog for picking SVGs
  const handleNativeSelectFiles = useCallback(async (): Promise<void> => {
    const res = await fileService.selectFiles();
    if (res.success && res.count && res.count > 0) {
      showToast(`Imported ${res.count} SVG files`);
      fetchFiles();
    }
  }, [showToast, fetchFiles]);

  // Remove an individual file from the vector queue/pool
  const handleRemoveFile = useCallback(async (filename: string): Promise<void> => {
    try {
      setFiles(prev => {
        const remaining = prev.filter(f => f.name !== filename);
        if (activeFile?.name === filename) {
          setActiveFile(remaining.length > 0 ? remaining[0] : null);
        }
        return remaining;
      });

      if (onRemoveResult) {
        onRemoveResult(filename);
      }

      await fileService.removeFile(filename);
      showToast(`Removed ${filename}`);
    } catch (err: any) {
      console.error('Failed to remove file:', err);
      showToast(`Could not remove file: ${err.message}`);
      fetchFiles();
    }
  }, [activeFile, onRemoveResult, showToast, fetchFiles]);

  // Clear all SVG files from the queue/pool
  const handleClearQueue = useCallback(async (): Promise<void> => {
    if (files.length === 0) return;
    if (!window.confirm(`Remove all ${files.length} vector files from the workspace queue?`)) {
      return;
    }

    try {
      setFiles([]);
      setActiveFile(null);
      if (onClearResults) onClearResults();

      await fileService.clearFiles();
      showToast('Cleared all SVGs from queue');
    } catch (err: any) {
      console.error('Failed to clear queue:', err);
      showToast(`Could not clear queue: ${err.message}`);
      fetchFiles();
    }
  }, [files.length, onClearResults, showToast, fetchFiles]);

  return {
    isAppLoading,
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
  };
}
