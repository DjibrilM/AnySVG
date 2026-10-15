import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type { ConvertOptions, BatchConvertOptions } from '../main/core';
import { IPC_CHANNELS } from '../main/core';

const api = {
  // Files domain
  getFiles: () => ipcRenderer.invoke(IPC_CHANNELS.FILES_GET),
  getPreview: (filename: string) => ipcRenderer.invoke(IPC_CHANNELS.FILES_GET_PREVIEW, filename),
  selectFiles: () => ipcRenderer.invoke(IPC_CHANNELS.FILES_SELECT),
  importFiles: (paths: string[]) => ipcRenderer.invoke(IPC_CHANNELS.FILES_IMPORT, paths),
  uploadSvg: (name: string, content: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.FILES_UPLOAD, { name, content }),
  removeFile: (filename: string) => ipcRenderer.invoke(IPC_CHANNELS.FILES_REMOVE, filename),
  clearFiles: () => ipcRenderer.invoke(IPC_CHANNELS.FILES_CLEAR),

  // Conversion domain
  convert: (options: ConvertOptions) => ipcRenderer.invoke(IPC_CHANNELS.CONVERSION_CONVERT, options),
  convertAll: (options?: BatchConvertOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.CONVERSION_CONVERT_ALL, options),
  onConvertAllProgress: (callback: (data: any) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on(IPC_CHANNELS.CONVERSION_PROGRESS, subscription);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.CONVERSION_PROGRESS, subscription);
    };
  },

  // System domain
  openFolder: (targetPath?: string) => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_OPEN_FOLDER, targetPath),
  getOutputDir: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_OUTPUT_DIR),
  selectOutputDir: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_SELECT_OUTPUT_DIR),

  // Splash & Initialization progress
  onInitProgress: (callback: (data: { step: number; totalSteps: number; progress: number; message: string }) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on('init:progress', subscription);
    return () => {
      ipcRenderer.removeListener('init:progress', subscription);
    };
  },

  // Utility helpers
  getPathForFile: (file: File): string => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
    } catch (e) {
      console.warn('getPathForFile failed:', e);
    }
    return (file as any).path || '';
  },
  isElectron: true
};

try {
  contextBridge.exposeInMainWorld('api', api);
} catch (error) {
  console.error('Failed to expose api in preload:', error);
}

export type ElectronApi = typeof api;
