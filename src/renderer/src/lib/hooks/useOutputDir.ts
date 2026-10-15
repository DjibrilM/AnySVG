import { useState, useEffect, useCallback } from 'react';
import { systemService } from '../../core/services/system.service';

interface UseOutputDirOptions {
  isElectron?: boolean;
  showToast: (msg: string) => void;
}

export function useOutputDir({ showToast }: UseOutputDirOptions) {
  const [outputDir, setOutputDir] = useState<string>('');

  // Fetch initial destination output directory
  useEffect(() => {
    systemService.getOutputDir().then(res => {
      if (res.success && (res.outputDir || res.path)) {
        setOutputDir(res.outputDir || res.path || '');
      }
    }).catch(err => {
      console.warn('Could not fetch output dir:', err);
    });
  }, []);

  // Prompt user to select destination folder using native directory picker
  const handleSelectOutputDir = useCallback(async (): Promise<void> => {
    try {
      const res = await systemService.selectOutputDir();
      if (res.success && (res.outputDir || res.path)) {
        const chosen = res.outputDir || res.path || '';
        setOutputDir(chosen);
        const folderName = chosen.replace(/\/$/, '').split('/').pop() || chosen;
        showToast(`Export destination changed to: ${folderName}`);
      } else if (!res.canceled && res.error) {
        showToast(`Could not change folder: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Failed to select destination folder:', err);
      showToast(`Could not change folder: ${err.message}`);
    }
  }, [showToast]);

  // Open output folder in Finder
  const handleOpenFolder = useCallback((targetPath?: string): void => {
    systemService.openFolder(targetPath);
  }, []);

  return {
    outputDir,
    handleSelectOutputDir,
    handleOpenFolder
  };
}
