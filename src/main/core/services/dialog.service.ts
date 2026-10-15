import { dialog, shell, BrowserWindow } from 'electron';
import fs from 'fs';
import type { DirectoryService } from './directory.service';

export interface SelectOutputDirResult {
  success: boolean;
  canceled?: boolean;
  path: string;
  outputDir: string;
  error?: string;
}

export interface OpenFolderResult {
  success: boolean;
  error?: string;
}

/**
 * DialogService handles native OS dialogs and shell interactions.
 * Single Responsibility: Native OS Dialogs & Shell Interactions.
 */
export class DialogService {
  constructor(private directoryService: DirectoryService) {}

  public async openFolder(targetPath?: string): Promise<OpenFolderResult> {
    try {
      const p = targetPath || this.directoryService.getOutputDir();
      if (fs.existsSync(p)) {
        if (fs.statSync(p).isDirectory()) {
          await shell.openPath(p);
        } else {
          shell.showItemInFolder(p);
        }
        return { success: true };
      }
      return { success: false, error: 'Path does not exist' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async selectOutputDir(window?: BrowserWindow | null): Promise<SelectOutputDirResult> {
    const currentOutputDir = this.directoryService.getOutputDir();
    try {
      const options: Electron.OpenDialogOptions = {
        title: 'Choose Destination Folder for AnySVG Exports',
        defaultPath: currentOutputDir,
        buttonLabel: 'Select Destination',
        properties: ['openDirectory', 'createDirectory']
      };

      const result = window
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options);

      if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
        return { success: false, canceled: true, path: currentOutputDir, outputDir: currentOutputDir };
      }

      const chosen = result.filePaths[0];
      this.directoryService.setOutputDir(chosen);

      return { success: true, path: chosen, outputDir: chosen };
    } catch (err: any) {
      console.error('selectOutputDir error:', err);
      return { success: false, error: err.message, path: currentOutputDir, outputDir: currentOutputDir };
    }
  }
}
