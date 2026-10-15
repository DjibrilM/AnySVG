import { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { parseSvgDimensions } from '../convert';

export interface RasterizeOutput {
  outPath: string;
  width: number;
  height: number;
  sizeBytes: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

/**
 * ChromiumRasterizer maintains a persistent, pre-warmed Chromium instance
 * re-used across the application lifecycle for ultra-fast, zero-cold-start SVG rasterization.
 */
export class ChromiumRasterizer {
  private window: BrowserWindow | null = null;
  private isReady: boolean = false;

  /**
   * Start and pre-warm the persistent Chromium instance right after boot
   */
  public async start(): Promise<void> {
    if (this.window && !this.window.isDestroyed()) {
      return;
    }

    const start = Date.now();
    this.window = new BrowserWindow({
      width: 1280,
      height: 800,
      show: false,
      frame: false,
      transparent: true,
      enableLargerThanScreen: true,
      webPreferences: {
        sandbox: false,
        offscreen: true
      }
    });

    const warmHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;"><svg width="1" height="1"></svg></body></html>`;
    await this.window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(warmHtml)}`);

    this.isReady = true;
    console.log(`Persistent Chromium rasterizer instance started & warmed up in ${Date.now() - start}ms`);
  }

  public getIsReady(): boolean {
    return this.isReady && !!this.window && !this.window.isDestroyed();
  }

  /**
   * Rasterize an SVG using the persistent Chromium instance
   */
  public async rasterize(
    svgFilePath: string,
    options: {
      scale?: number;
      width?: number | null;
      height?: number | null;
      bg?: string;
      outDir: string;
    }
  ): Promise<RasterizeOutput> {
    const startTime = Date.now();
    const scale = options.scale ?? 4;
    const bgColor = options.bg ?? 'transparent';
    const outDir = options.outDir;

    const baseName = path.basename(svgFilePath, path.extname(svgFilePath));
    const outPath = path.join(outDir, `${baseName}_${scale}x.png`);

    let tempHtml: string | null = null;

    try {
      if (!this.window || this.window.isDestroyed()) {
        await this.start();
      }

      const svgContent = fs.readFileSync(svgFilePath, 'utf8');
      const dims = parseSvgDimensions(svgContent);

      let finalW = Math.round(dims.width * scale);
      let finalH = Math.round(dims.height * scale);

      if (options.width && !options.height) {
        finalW = options.width;
        finalH = Math.round((dims.height / dims.width) * options.width);
      } else if (options.height && !options.width) {
        finalH = options.height;
        finalW = Math.round((dims.width / dims.height) * options.height);
      } else if (options.width && options.height) {
        finalW = options.width;
        finalH = options.height;
      }

      if (finalW <= 0) finalW = 800;
      if (finalH <= 0) finalH = 600;

      // Proportional clamp to Chromium GPU texture limit (16,384px) to prevent hardware overflow
      const maxTextureDim = 16384;
      if (finalW > maxTextureDim || finalH > maxTextureDim) {
        const ratio = Math.min(maxTextureDim / finalW, maxTextureDim / finalH);
        finalW = Math.round(finalW * ratio);
        finalH = Math.round(finalH * ratio);
      }

      let finalSvg = svgContent;
      if (!dims.hasViewBox) {
        finalSvg = finalSvg.replace(/<svg\b/i, `<svg viewBox="0 0 ${dims.width} ${dims.height}" `);
      }

      const bgCss = bgColor.toLowerCase() === 'transparent' ? 'transparent' : bgColor;
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${finalW}px;
    height: ${finalH}px;
    overflow: hidden;
    background: ${bgCss};
  }
  svg {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
    overflow: visible !important;
  }
</style>
</head>
<body>
${finalSvg}
</body>
</html>`;

      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      // Write to temp file to completely avoid Chromium's 2MB data: URL length limit (ERR_INVALID_URL)
      tempHtml = path.join(outDir, `.__temp_rasterize_${process.pid}_${Date.now()}.html`);
      fs.writeFileSync(tempHtml, htmlContent, 'utf8');

      // Set exact target dimensions and load file directly into the persistent Chromium instance
      this.window!.setContentSize(finalW, finalH);
      await this.window!.loadFile(tempHtml);

      const nativeImg = await this.window!.webContents.capturePage({ 
        x: 0, 
        y: 0, 
        width: finalW, 
        height: finalH 
      });
      const pngBuffer = nativeImg.toPNG();

      fs.writeFileSync(outPath, pngBuffer);

      return {
        outPath,
        width: finalW,
        height: finalH,
        sizeBytes: pngBuffer.length,
        durationMs: Date.now() - startTime,
        success: true
      };
    } catch (err: any) {
      console.error('Persistent Chromium rasterization error:', err);
      return {
        outPath,
        width: 0,
        height: 0,
        sizeBytes: 0,
        durationMs: Date.now() - startTime,
        success: false,
        error: err.message
      };
    } finally {
      if (tempHtml && fs.existsSync(tempHtml)) {
        try {
          fs.unlinkSync(tempHtml);
        } catch {}
      }
    }
  }

  public destroy(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy();
      this.window = null;
      this.isReady = false;
    }
  }
}
