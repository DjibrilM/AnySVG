import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import sharp from 'sharp';
import JSZip from 'jszip';
import type { SystemService } from './system.service';
import type { DirectoryService } from './directory.service';
import { findChromiumBrowser, rasterizeSingleSvg, parseSvgDimensions } from '../convert';
import { ChromiumRasterizer } from './chromium-rasterizer.service';

export interface ConvertOptions {
  filename: string;
  scale?: number;
  width?: number | null;
  height?: number | null;
  bg?: string;
  format?: 'png' | 'jpeg';
  compression?: 'none' | 'max' | 'quant' | 'fast';
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
  compression?: 'none' | 'max' | 'quant' | 'fast';
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
   * Calculate proportional target width and height according to scale or custom width/height
   */
  public computeDimensionsForFile(
    fileDimensions: { width: number; height: number },
    options: {
      scale?: number;
      width?: number | null;
      height?: number | null;
    }
  ): { targetW: number; targetH: number; tag: string } {
    const origW = fileDimensions.width || 800;
    const origH = fileDimensions.height || 600;
    const scale = options.scale ?? 4;

    if (options.width && options.height) {
      return { targetW: options.width, targetH: options.height, tag: `${options.width}x${options.height}` };
    }

    if (options.width && !options.height) {
      const targetW = options.width;
      const targetH = Math.max(1, Math.round((origH / origW) * options.width));
      return { targetW, targetH, tag: `${targetW}x${targetH}` };
    }

    if (options.height && !options.width) {
      const targetH = options.height;
      const targetW = Math.max(1, Math.round((origW / origH) * options.height));
      return { targetW, targetH, tag: `${targetW}x${targetH}` };
    }

    const targetW = Math.max(1, Math.round(origW * scale));
    const targetH = Math.max(1, Math.round(origH * scale));
    return { targetW, targetH, tag: `${scale}x` };
  }

  /**
   * Apply deep secondary compression via Sharp (mozjpeg / pngquant / level-9 deflate)
   * or export uncompressed with full 32-bit RGBA bit depth / JPEG 100% 4:4:4.
   */
  private async compressWithSharp(
    rawPath: string,
    finalPath: string,
    isJpeg: boolean,
    compression: 'none' | 'max' | 'quant' | 'fast'
  ): Promise<{ finalStat: fs.Stats; savings: number; buffer: Buffer }> {
    const rawStat = fs.statSync(rawPath);

    if (compression === 'none') {
      if (isJpeg) {
        // Full fidelity JPEG: 100% quality with 4:4:4 chroma subsampling (no color resolution loss)
        const pipeline = sharp(rawPath).jpeg({ quality: 100, chromaSubsampling: '4:4:4' });
        const buffer = await pipeline.toBuffer();
        fs.writeFileSync(finalPath, buffer);
        if (finalPath !== rawPath && fs.existsSync(rawPath)) {
          try { fs.unlinkSync(rawPath); } catch {}
        }
        const finalStat = fs.statSync(finalPath);
        return { finalStat, savings: 0, buffer };
      } else {
        // Pure uncompressed PNG: directly preserve raw lossless Chromium 32-bit RGBA raster
        if (finalPath !== rawPath) {
          fs.copyFileSync(rawPath, finalPath);
          try { fs.unlinkSync(rawPath); } catch {}
        }
        const finalStat = fs.statSync(finalPath);
        const buffer = fs.readFileSync(finalPath);
        return { finalStat, savings: 0, buffer };
      }
    }

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
        compression = 'none'
      } = options;

      const root = this.systemService.getWorkspaceDir();
      const outDir = this.systemService.getOutputDir();

      const safeFile = path.basename(filename);
      const svgPath = path.join(root, safeFile);
      if (!fs.existsSync(svgPath)) throw new Error('Source SVG file not found');

      const baseName = path.basename(safeFile, path.extname(safeFile));
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      const dims = parseSvgDimensions(svgContent);

      const { targetW, targetH, tag } = this.computeDimensionsForFile(dims, {
        scale,
        width,
        height
      });

      const isJpeg = format.toLowerCase() === 'jpeg' || format.toLowerCase() === 'jpg';
      const finalExt = isJpeg ? 'jpg' : 'png';
      const finalFileName = `${baseName}_${tag}.${finalExt}`;
      const finalPath = path.join(outDir, finalFileName);

      // If exporting uncompressed PNG, rasterize directly to finalPath to eliminate temp file & re-compression
      const isDirectUncompressedPng = !isJpeg && compression === 'none';
      const rawPath = isDirectUncompressedPng
        ? finalPath
        : path.join(outDir, `.__temp_raw_${process.pid}_${Date.now()}.png`);

      // Stage 1: Vector Rasterization via persistent Chromium instance
      if (!this.rasterizer.getIsReady()) {
        await this.rasterizer.start();
      }

      if (this.rasterizer.getIsReady()) {
        const res = await this.rasterizer.rasterize(svgPath, {
          scale,
          width: targetW,
          height: targetH,
          bg,
          outDir,
          outPath: rawPath
        });
        if (!res.success) throw new Error(res.error || 'Vector rasterization failed');
      } else {
        const browserPath = this.getBrowserPath();
        const rasterResult = rasterizeSingleSvg(svgPath, {
          browserPath,
          scale,
          width: targetW,
          height: targetH,
          bg,
          outDir,
          outPath: rawPath
        });
        if (!rasterResult.success) throw new Error(rasterResult.error || 'Rasterization failed');
      }

      const rawStat = fs.statSync(rawPath);
      let finalStat = rawStat;
      let savings = 0;

      // Stage 2: Compression via Sharp if not direct uncompressed PNG
      if (!isDirectUncompressedPng) {
        const compressRes = await this.compressWithSharp(rawPath, finalPath, isJpeg, compression);
        finalStat = compressRes.finalStat;
        savings = compressRes.savings;
      }

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
        width = null,
        height = null,
        bg = 'transparent',
        format = 'png',
        compression = 'none'
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
          const svgContent = fs.readFileSync(svgFilePath, 'utf8');
          const dims = parseSvgDimensions(svgContent);

          const { targetW, targetH, tag } = this.computeDimensionsForFile(dims, {
            scale,
            width,
            height
          });

          const outName = `${baseName}_${tag}.${ext}`;
          const outPath = path.join(outDir, outName);
          const isDirectUncompressedPng = !isJpeg && compression === 'none';
          const rawPath = isDirectUncompressedPng
            ? outPath
            : path.join(outDir, `.__temp_raw_${process.pid}_${i}_${Date.now()}.png`);

          // Stage 1: Vector Rasterization via persistent Chromium instance
          if (this.rasterizer.getIsReady()) {
            const res = await this.rasterizer.rasterize(svgFilePath, {
              scale,
              width: targetW,
              height: targetH,
              bg,
              outDir,
              outPath: rawPath
            });
            if (!res.success) throw new Error(res.error || `Rasterization failed for ${file}`);
          } else {
            const rasterResult = rasterizeSingleSvg(svgFilePath, {
              browserPath,
              scale,
              width: targetW,
              height: targetH,
              bg,
              outDir,
              outPath: rawPath
            });
            if (!rasterResult.success) throw new Error(rasterResult.error || `Rasterization failed for ${file}`);
          }

          const rawStat = fs.statSync(rawPath);
          totalOriginal += rawStat.size;

          let finalStat = rawStat;
          let savings = 0;
          let buffer: Buffer;

          if (isDirectUncompressedPng) {
            buffer = fs.readFileSync(outPath);
          } else {
            const compressRes = await this.compressWithSharp(
              rawPath,
              outPath,
              isJpeg,
              compression
            );
            finalStat = compressRes.finalStat;
            savings = compressRes.savings;
            buffer = compressRes.buffer;
          }

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
