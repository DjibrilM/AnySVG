import { IpcClient } from './ipc.client';

export class SystemService {
  public async getOutputDir(): Promise<{ success: boolean; path?: string; outputDir?: string; error?: string }> {
    return IpcClient.invoke(async () => {
      if (!window.api?.getOutputDir) throw new Error('api.getOutputDir unavailable');
      return window.api.getOutputDir();
    });
  }

  public async selectOutputDir(): Promise<{
    success: boolean;
    path?: string;
    outputDir?: string;
    canceled?: boolean;
    error?: string;
  }> {
    return IpcClient.invoke(async () => {
      if (!window.api?.selectOutputDir) throw new Error('api.selectOutputDir unavailable');
      return window.api.selectOutputDir();
    });
  }

  public async openFolder(targetPath?: string): Promise<{ success: boolean; error?: string }> {
    return IpcClient.invoke(async () => {
      if (!window.api?.openFolder) throw new Error('api.openFolder unavailable');
      return window.api.openFolder(targetPath);
    });
  }
}

export const systemService = new SystemService();
