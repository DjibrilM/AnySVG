import { ipcMain } from 'electron';
import { BaseController } from '../base.controller';
import { IPC_CHANNELS } from '../ipc-channels';
import type { ConversionService, ConvertOptions, BatchConvertOptions } from '../services/conversion.service';

export class ConversionController extends BaseController {
  constructor(private conversionService: ConversionService) {
    super();
  }

  public init(): void {
    // 1. Convert single SVG
    ipcMain.handle(IPC_CHANNELS.CONVERSION_CONVERT, async (_: any, options: ConvertOptions) => {
      return this.conversionService.convert(options);
    });

    // 2. Convert batch of SVGs with live progress notifications
    ipcMain.handle(
      IPC_CHANNELS.CONVERSION_CONVERT_ALL,
      async (event: Electron.IpcMainInvokeEvent, options: BatchConvertOptions = {}) => {
        const sendProgress = (data: any) => {
          try {
            event.sender.send(IPC_CHANNELS.CONVERSION_PROGRESS, data);
          } catch (e) {
            console.warn('Failed to send conversion progress:', e);
          }
        };

        return this.conversionService.convertAll(options, sendProgress);
      }
    );
  }
}
