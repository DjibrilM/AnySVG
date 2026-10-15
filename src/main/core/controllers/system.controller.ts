import { ipcMain, BrowserWindow } from 'electron';
import { BaseController } from '../base.controller';
import { IPC_CHANNELS } from '../ipc-channels';
import type { DirectoryService } from '../services/directory.service';
import type { DialogService } from '../services/dialog.service';
import type { SystemService } from '../services/system.service';

export class SystemController extends BaseController {
  private directoryService: DirectoryService;
  private dialogService: DialogService;

  constructor(
    systemServiceOrDir: SystemService | DirectoryService,
    dialogService?: DialogService
  ) {
    super();
    if ('directory' in systemServiceOrDir && 'dialog' in systemServiceOrDir) {
      this.directoryService = (systemServiceOrDir as SystemService).directory;
      this.dialogService = (systemServiceOrDir as SystemService).dialog;
    } else {
      this.directoryService = systemServiceOrDir as DirectoryService;
      this.dialogService = dialogService!;
    }
  }

  public init(): void {
    // 1. Reveal path / output directory
    ipcMain.handle(IPC_CHANNELS.SYSTEM_OPEN_FOLDER, async (_: any, targetPath?: string) => {
      return this.dialogService.openFolder(targetPath);
    });

    // 2. Get output directory
    ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_OUTPUT_DIR, async () => {
      const outDir = this.directoryService.getOutputDir();
      return { success: true, path: outDir, outputDir: outDir };
    });

    // 3. Select custom output directory via native dialog
    ipcMain.handle(IPC_CHANNELS.SYSTEM_SELECT_OUTPUT_DIR, async (event: Electron.IpcMainInvokeEvent) => {
      const win = BrowserWindow.fromWebContents(event.sender) || BrowserWindow.getFocusedWindow();
      return this.dialogService.selectOutputDir(win);
    });
  }
}
