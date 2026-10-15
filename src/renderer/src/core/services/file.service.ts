import type { SvgFile } from '../../lib/interfaces/svg';
import { IpcClient } from './ipc.client';

export class FileService {
  public async getFiles(): Promise<{ success: boolean; files: SvgFile[]; error?: string }> {
    return IpcClient.invoke(
      async () => {
        if (!window.api?.getFiles) throw new Error('api.getFiles unavailable');
        return window.api.getFiles();
      },
      async () => {
        const res = await fetch('/api/files');
        const data = await res.json();
        return { success: true, files: data.files || [] };
      }
    );
  }

  public async getPreview(filename: string): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
    return IpcClient.invoke(
      async () => {
        if (!window.api?.getPreview) throw new Error('api.getPreview unavailable');
        return window.api.getPreview(filename);
      },
      async () => {
        return {
          success: true,
          dataUrl: `/api/preview?file=${encodeURIComponent(filename)}`
        };
      }
    );
  }

  public async selectFiles(): Promise<{ success: boolean; count?: number; error?: string }> {
    return IpcClient.invoke(async () => {
      if (!window.api?.selectFiles) throw new Error('api.selectFiles unavailable');
      return window.api.selectFiles();
    });
  }

  public async importFiles(paths: string[]): Promise<{
    success: boolean;
    count?: number;
    files?: SvgFile[];
    error?: string;
  }> {
    return IpcClient.invoke(async () => {
      if (!window.api?.importFiles) throw new Error('api.importFiles unavailable');
      return window.api.importFiles(paths);
    });
  }

  public async uploadSvg(
    name: string,
    content: string
  ): Promise<{ success: boolean; file?: SvgFile; error?: string }> {
    return IpcClient.invoke(
      async () => {
        if (!window.api?.uploadSvg) throw new Error('api.uploadSvg unavailable');
        return window.api.uploadSvg(name, content);
      },
      async () => {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, content })
        });
        return res.json();
      }
    );
  }

  public async removeFile(filename: string): Promise<{ success: boolean; error?: string }> {
    return IpcClient.invoke(
      async () => {
        if (!window.api?.removeFile) throw new Error('api.removeFile unavailable');
        return window.api.removeFile(filename);
      },
      async () => {
        const res = await fetch('/api/remove-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename })
        });
        return res.json();
      }
    );
  }

  public async clearFiles(): Promise<{ success: boolean; count?: number; error?: string }> {
    return IpcClient.invoke(
      async () => {
        if (!window.api?.clearFiles) throw new Error('api.clearFiles unavailable');
        return window.api.clearFiles();
      },
      async () => {
        const res = await fetch('/api/clear-files', { method: 'POST' });
        return res.json();
      }
    );
  }

  public getPathForFile(file: File): string {
    if (window.api?.getPathForFile) {
      try {
        return window.api.getPathForFile(file);
      } catch (err) {
        console.warn('getPathForFile error:', err);
      }
    }
    return (file as any).path || '';
  }
}

export const fileService = new FileService();
