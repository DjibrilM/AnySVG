import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import sharp from 'sharp';
import JSZip from 'jszip';
import type { SystemService } from './system.service';
import type { DirectoryService } from './directory.service';
import { findChromiumBrowser, rasterizeSingleSvg } from '../convert';
import { ChromiumRasterizer } from './chromium-rasterizer.service';

export interface ConvertOptions {
  filename: string;
  scale?: number;
  width?: number | null;
  height?: number | null;
  bg?: string;
  format?: 'png' | 'jpeg';
  compression?: 'max' | 'quant' | 'fast';
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
  bg?: string;
  format?: 'png' | 'jpeg';
  compression?: 'max' | 'quant' | 'fast';
}

export interface BatchConvertResult {
  success: boolean;
  zipFile?: string;
  zipPath?: string;
  count?: number;
  originalSize?: number;
  compressedSize?: number;
  savings?: number;
  results?: Record<string, any>;
  error?: string;
}

export class ConversionService {
  private browserPath: string | null = null;
  private isWarmedUp: boolean = false;
  private rasterizer: ChromiumRasterizer;

  constructor(
    private systemService: SystemService | DirectoryService,
    rasterizer?: ChromiumRasterizer
  ) {
    this.rasterizer = rasterizer || new ChromiumRasterizer();
  }

  /**
   * Start and pre-warm the persistent Chromium instance right after boot
   */
  public async initEngine(): Promise<{ ready: boolean; browserPath?: string; error?: string }> {
    try {
      // 1. Start persistent Chromium rasterizer instance
      await this.rasterizer.start();
      this.isWarmedUp = true;
      console.log('Persistent Chromium rasterization instance active and ready');
      return { ready: true };
    } catch (err: any) {
      console.warn('Persistent rasterizer initialization fallback:', err);
      this.browserPath = findChromiumBrowser();
      return { ready: !!this.browserPath, browserPath: this.browserPath || undefined };
    }
  }

  public getRasterizer(): ChromiumRasterizer {
    return this.rasterizer;
  }

  public getBrowserPath(): string {
    if (!this.browserPath) {
      this.browserPath = findChromiumBrowser();
    }
    if (!this.browserPath) {
      throw new Error('Chromium browser not found. Please install Google Chrome or Chromium.');
    }
    return this.browserPath;
  }

  /**
   * Apply deep secondary compression via Sharp (mozjpeg / pngquant / level-9 deflate)
   */
  private async compressWithSharp(
    rawPath: string,
    finalPath: string,
    isJpeg: boolean,
    compression: 'max' | 'quant' | 'fast'
  ): Promise<{ finalStat: fs.Stats; savings: number; buffer: Buffer }> {
    const rawStat = fs.statSync(rawPath);
    let pipeline = sharp(rawPath);

    if (isJpeg) {
      pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
    } else if (compression === 'quant') {
      pipeline = pipeline.png({ palette: true, quality: 90, effort: 10 });
    } else if (compression === 'fast') {
      pipeline = pipeline.png({ compressionLevel: 6 });
    } else {
      pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10 });
    }

    const buffer = await pipeline.toBuffer();
    fs.writeFileSync(finalPath, buffer);

    if (finalPath !== rawPath && fs.existsSync(rawPath)) {
      try {
        fs.unlinkSync(rawPath);
      } catch {}
    }

    const finalStat = fs.statSync(finalPath);
    const savings = Math.max(0, Math.round((1 - finalStat.size / rawStat.size) * 100));

    return { finalStat, savings, buffer };
  }

  public async convert(options: ConvertOptions): Promise<ConvertResult> {
    try {
      const {
        filename,
        scale = 4,
        width = null,
        height = null,
        bg = 'transparent',
        format = 'png',
        compression = 'max'
      } = options;

      const root = this.systemService.getWorkspaceDir();
      const outDir = this.systemService.getOutputDir();

      const safeFile = path.basename(filename);
      const svgPath = path.join(root, safeFile);
      if (!fs.existsSync(svgPath)) throw new Error('Source SVG file not found');

      const baseName = path.basename(safeFile, path.extname(safeFile));

      // Stage 1: Vector Rasterization via persistent Chromium instance
      let rawPath: string;
      if (!this.rasterizer.getIsReady()) {
        await this.rasterizer.start();
      }

      if (this.rasterizer.getIsReady()) {
        const res = await this.rasterizer.rasterize(svgPath, {
          scale,
          width,
          height,
          bg,
          outDir
        });
        if (!res.success) throw new Error(res.error || 'Vector rasterization failed');
        rawPath = res.outPath;
      } else {
        const browserPath = this.getBrowserPath();
        const rasterResult = rasterizeSingleSvg(svgPath, {
          browserPath,
          scale,
          width,
          height,
          bg,
          outDir
        });
        if (!rasterResult.success) throw new Error(rasterResult.error || 'Rasterization failed');
        rawPath = rasterResult.outPath;
      }

      const rawStat = fs.statSync(rawPath);
      const isJpeg = format.toLowerCase() === 'jpeg' || format.toLowerCase() === 'jpg';
      const finalExt = isJpeg ? 'jpg' : 'png';
      const finalFileName = `${baseName}_${scale}x.${finalExt}`;
      const finalPath = path.join(outDir, finalFileName);

      // Stage 2: Deep secondary compression via Sharp
      const { finalStat, savings } = await this.compressWithSharp(rawPath, finalPath, isJpeg, compression);

      return {
        success: true,
        outputFile: finalFileName,
        outputPath: `atom://${finalPath}`,
        fullPath: finalPath,
        originalSize: rawStat.size,
        compressedSize: finalStat.size,
        savings
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async convertAll(
    options: BatchConvertOptions = {},
    onProgress?: (data: any) => void
  ): Promise<BatchConvertResult> {
    try {
      const {
        files: requestedFiles,
        scale = 4,
        bg = 'transparent',
        format = 'png',
        compression = 'max'
      } = options;

      const root = this.systemService.getWorkspaceDir();
      const outDir = this.systemService.getOutputDir();

      const allWorkspaceFiles = fs
        .readdirSync(root)
        .filter(f => f.toLowerCase().endsWith('.svg') && !f.startsWith('.'));

      let svgFiles: string[] = [];
      if (requestedFiles && Array.isArray(requestedFiles) && requestedFiles.length > 0) {
        svgFiles = requestedFiles.filter(f => fs.existsSync(path.join(root, path.basename(f))));
      }
      if (svgFiles.length === 0) {
        svgFiles = allWorkspaceFiles;
      }

      if (svgFiles.length === 0) throw new Error('No SVG files found in workspace');

      const total = svgFiles.length;
      if (onProgress) {
        onProgress({ current: 0, total, status: 'starting' });
      }

      if (!this.rasterizer.getIsReady()) {
        try {
          await this.rasterizer.start();
        } catch (e) {
          console.warn('Persistent rasterizer start failed in batch:', e);
        }
      }

      const browserPath = this.rasterizer.getIsReady() ? '' : (findChromiumBrowser() || '');
      const isJpeg = format.toLowerCase() === 'jpeg' || format.toLowerCase() === 'jpg';
      const ext = isJpeg ? 'jpg' : 'png';
      const zip = new JSZip();

      let totalOriginal = 0;
      let totalCompressed = 0;
      const fileResults: Record<string, any> = {};

      for (let i = 0; i < svgFiles.length; i++) {
        const file = svgFiles[i];
        if (onProgress) {
          onProgress({ current: i, total, currentFile: file, status: 'converting' });
        }

        try {
          const baseName = path.basename(file, path.extname(file));
          const svgFilePath = path.isAbsolute(file) ? file : path.join(root, path.basename(file));

          // Stage 1: Vector Rasterization via persistent Chromium instance
          let rawPath: string;
          if (this.rasterizer.getIsReady()) {
            const res = await this.rasterizer.rasterize(svgFilePath, {
              scale,
              bg,
              outDir
            });
            if (!res.success) throw new Error(res.error || `Rasterization failed for ${file}`);
            rawPath = res.outPath;
          } else {
            const rasterResult = rasterizeSingleSvg(svgFilePath, {
              browserPath,
              scale,
              bg,
              outDir
            });
            if (!rasterResult.success) throw new Error(rasterResult.error || `Rasterization failed for ${file}`);
            rawPath = rasterResult.outPath;
          }
          const rawStat = fs.statSync(rawPath);
          totalOriginal += rawStat.size;

          const outName = `${baseName}_${scale}x.${ext}`;
          const outPath = path.join(outDir, outName);

          // Stage 2: Deep secondary compression via Sharp
          const { finalStat, savings, buffer } = await this.compressWithSharp(
            rawPath,
            outPath,
            isJpeg,
            compression
          );

          totalCompressed += buffer.length;
          zip.file(outName, buffer);

          const itemResult = {
            success: true,
            outputFile: outName,
            outputPath: `atom://${outPath}`,
            fullPath: outPath,
            originalSize: rawStat.size,
            compressedSize: finalStat.size,
            savings
          };
          fileResults[file] = itemResult;

          if (onProgress) {
            onProgress({
              current: i + 1,
              total,
              currentFile: file,
              status: 'completed',
              result: itemResult
            });
          }
        } catch (itemErr: any) {
          console.error(`Error converting ${file}:`, itemErr);
        }
      }

      if (onProgress) {
        onProgress({ current: total, total, status: 'zipping' });
      }

      // Generate batch ZIP archive
      const zipFileName = `anysvg_exports_${scale}x_${Date.now()}.zip`;
      const zipFilePath = path.join(outDir, zipFileName);
      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      fs.writeFileSync(zipFilePath, zipBuffer);

      const savings = Math.max(0, Math.round((1 - totalCompressed / Math.max(1, totalOriginal)) * 100));

      const finalBatchResult: BatchConvertResult = {
        success: true,
        zipFile: zipFileName,
        zipPath: zipFilePath,
        count: svgFiles.length,
        originalSize: totalOriginal,
        compressedSize: totalCompressed,
        savings,
        results: fileResults
      };

      if (onProgress) {
        onProgress({
          current: total,
          total,
          status: 'done',
          result: finalBatchResult,
          results: fileResults
        });
      }

      return finalBatchResult;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
