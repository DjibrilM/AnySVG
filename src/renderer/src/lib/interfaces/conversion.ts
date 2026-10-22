export type CompressionMode = 'none' | 'max' | 'quant' | 'fast';
export type ResolutionPreset = 'native' | '1080p' | '2k' | '4k' | '8k' | '16k' | 'custom';

export interface ConvertOptions {
  filename: string;
  scale?: number;
  width?: number | null;
  height?: number | null;
  bg?: string;
  format?: 'png' | 'jpeg';
  compression?: CompressionMode;
  preset?: ResolutionPreset;
}

export interface ConvertResult {
  success: boolean;
  outputFile?: string;
  outputPath?: string;
  fullPath?: string;
  originalSize?: number;
  compressedSize?: number;
  savings?: number;
  error?: string;
}

export interface BatchConvertOptions {
  files?: string[];
  scale?: number;
  width?: number | null;
  height?: number | null;
  bg?: string;
  format?: 'png' | 'jpeg';
  compression?: CompressionMode;
  preset?: ResolutionPreset;
}

export interface BatchProgressData {
  current: number;
  total: number;
  currentFile?: string;
  status: 'starting' | 'converting' | 'completed' | 'zipping' | 'done' | 'error';
  result?: ConvertResult;
  results?: Record<string, ConvertResult>;
  error?: string;
}

export interface BatchConvertResult {
  success: boolean;
  zipFile?: string;
  zipPath?: string;
  count?: number;
  originalSize?: number;
  compressedSize?: number;
  savings?: number;
  results?: Record<string, ConvertResult>;
  error?: string;
}

export interface ConversionState {
  scale: number;
  customWidth: number | null;
  customHeight: number | null;
  aspectLocked: boolean;
  bgColor: string;
  format: 'png' | 'jpeg';
  compression: CompressionMode;
  preset: ResolutionPreset;
  isConverting: boolean;
  isConvertingAll: boolean;
  convertAllProgress: {
    current: number;
    total: number;
    currentFile?: string;
    status?: string;
  };
  lastResult: ConvertResult | null;
  lastZipUrl: string | null;
  conversionResults: Record<string, ConvertResult>;
}

