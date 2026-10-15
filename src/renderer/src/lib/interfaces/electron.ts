import 'react';
import type { SvgFile } from './svg';
import type {
  ConvertOptions,
  ConvertResult,
  BatchConvertOptions,
  BatchProgressData,
  BatchConvertResult
} from './conversion';

export interface ElectronApi {
  getFiles: () => Promise<{ success: boolean; files: SvgFile[]; error?: string }>;
  getPreview: (filename: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>;
  convert: (options: ConvertOptions) => Promise<ConvertResult>;
  convertAll: (options?: BatchConvertOptions) => Promise<BatchConvertResult>;
  onConvertAllProgress?: (callback: (data: BatchProgressData) => void) => () => void;
  selectFiles: () => Promise<{ success: boolean; count?: number; error?: string }>;
  importFiles: (paths: string[]) => Promise<{ success: boolean; count?: number; files?: SvgFile[]; error?: string }>;
  openFolder: (targetPath?: string) => Promise<{ success: boolean; error?: string }>;
  getOutputDir?: () => Promise<{ success: boolean; path?: string; outputDir?: string; error?: string }>;
  selectOutputDir?: () => Promise<{ success: boolean; path?: string; outputDir?: string; canceled?: boolean; error?: string }>;
  setOutputDir?: (dir: string) => Promise<{ success: boolean; path?: string; outputDir?: string; error?: string }>;
  removeFile?: (filename: string) => Promise<{ success: boolean; error?: string }>;
  clearFiles?: () => Promise<{ success: boolean; count?: number; error?: string }>;
  uploadSvg: (name: string, content: string) => Promise<{ success: boolean; file?: SvgFile; error?: string }>;
  getPathForFile: (file: File) => string;
  isElectron: boolean;
}

declare global {
  interface Window {
    api?: ElectronApi;
  }
}

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}
