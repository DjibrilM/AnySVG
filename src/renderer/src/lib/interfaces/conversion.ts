export type CompressionMode = 'none' | 'max' | 'quant' | 'fast';

export interface ConvertOptions {
  filename: string;
  scale?: number;
  width?: number | null;
  height?: number | null;
  bg?: string;
  format?: 'png' | 'jpeg';
  compression?: CompressionMode;
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
