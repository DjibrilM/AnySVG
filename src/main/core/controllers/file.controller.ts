import { ipcMain } from 'electron';
import { BaseController } from '../base.controller';
import { IPC_CHANNELS } from '../ipc-channels';
import type { FileService } from '../services/file.service';

export class FileController extends BaseController {
  constructor(private fileService: FileService) {
    super();
  }

  public init(): void {
    // 1. Get workspace SVG files
    ipcMain.handle(IPC_CHANNELS.FILES_GET, () => {
      return this.fileService.getFiles();
    });

    // 2. Get hardware-accelerated SVG preview protocol URL
    ipcMain.handle(IPC_CHANNELS.FILES_GET_PREVIEW, (_: any, filename: string) => {
      return this.fileService.getPreview(filename);
    });

    // 3. Open native dialog to pick SVG files
    ipcMain.handle(IPC_CHANNELS.FILES_SELECT, () => {
      return this.fileService.selectFiles();
    });

    // 4. Import files or directories dropped via filesystem paths
    ipcMain.handle(IPC_CHANNELS.FILES_IMPORT, (_: any, paths: string[]) => {
      return this.fileService.importFiles(paths);
    });

    // 5. Upload dropped SVG text content
    ipcMain.handle(IPC_CHANNELS.FILES_UPLOAD, (_: any, payload: { name: string; content: string }) => {
      const { name, content } = payload || {};
      return this.fileService.uploadSvg(name, content);
    });

    // 6. Move file to trash
    ipcMain.handle(IPC_CHANNELS.FILES_REMOVE, (_: any, filename: string) => {
      return this.fileService.removeFile(filename);
    });

    // 7. Clear all SVGs from workspace
    ipcMain.handle(IPC_CHANNELS.FILES_CLEAR, () => {
      return this.fileService.clearFiles();
    });
  }
}
