/**
 * SVG to High-Resolution Rasterizer (TypeScript Core Engine & CLI)
 * Precision vector rasterization using system headless Chromium.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface RasterizeOptions {
  inputFiles: string[];
  scale?: number;
  width?: number | null;
  height?: number | null;
  dpi?: number | null;
  bg?: string;
  outDir?: string;
  convertAll?: boolean;
}

export interface SvgDimensionInfo {
  width: number;
  height: number;
  hasViewBox: boolean;
}

export interface RasterizeResult {
  file: string;
  outPath: string;
  width: number;
  height: number;
  sizeBytes: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

/**
 * Locate system Google Chrome, Chromium, Brave, or Edge binary if available.
 * Note: Within AnySVG (Electron), Electron's bundled Chromium engine is used directly
 * via ChromiumRasterizer, so no external browser installation is required.
 */
export function findChromiumBrowser(): string | null {
  const candidates: string[] = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser'
  ];

  for (const bin of candidates) {
    if (bin.startsWith('/')) {
      if (fs.existsSync(bin)) return bin;
    } else {
      try {
        execSync(`which ${bin}`, { stdio: 'ignore' });
        return bin;
      } catch {}
    }
  }
  return null;
}

/**
 * Extract SVG width, height, and viewBox from root <svg> element.
 */
export function parseSvgDimensions(content: string): SvgDimensionInfo {
  let width = 800;
  let height = 600;

  const svgMatch = content.match(/<svg\b([^>]*)>/i);
  const attrs = svgMatch ? svgMatch[1] : content;

  const viewBoxMatch = attrs.match(/viewBox=["']([^"']+)["']/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      width = parts[2];
      height = parts[3];
      return { width, height, hasViewBox: true };
    }
  }

  const widthMatch = attrs.match(/\bwidth=["']([\d.]+)(?:px)?["']/i);
  const heightMatch = attrs.match(/\bheight=["']([\d.]+)(?:px)?["']/i);
  if (widthMatch && heightMatch) {
    width = parseFloat(widthMatch[1]);
    height = parseFloat(heightMatch[1]);
  }

  return { width, height, hasViewBox: !!viewBoxMatch };
}

/**
 * Rasterize a single SVG file using headless Chromium screenshot.
 */
export function rasterizeSingleSvg(
  filePath: string,
  options: {
    browserPath: string;
    scale?: number;
    width?: number | null;
    height?: number | null;
    bg?: string;
    outDir: string;
    outPath?: string;
  }
): RasterizeResult {
  const startTime = Date.now();
  const scale = options.scale ?? 4;
  const bgColor = options.bg ?? 'transparent';
  const outDir = options.outDir;

  const baseName = path.basename(filePath, path.extname(filePath));
  const outPath = options.outPath || path.join(outDir, `${baseName}_${scale}x.png`);

  try {
    const svgContent = fs.readFileSync(filePath, 'utf8');
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

    let finalSvg = svgContent;
    if (!dims.hasViewBox) {
      finalSvg = finalSvg.replace(/<svg\b/i, `<svg viewBox="0 0 ${dims.width} ${dims.height}" `);
    }

    const bgCss = bgColor.toLowerCase() === 'transparent' ? 'transparent' : bgColor;
    const tempHtml = path.join(outDir, `.__temp_${process.pid}_${Date.now()}.html`);

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

    fs.writeFileSync(tempHtml, htmlContent, 'utf8');

    const chromeBgArg = bgColor.toLowerCase() === 'transparent' ? '--default-background-color=00000000' : '';
    const cmd = `"${options.browserPath}" --headless=new --disable-gpu ${chromeBgArg} --hide-scrollbars --force-device-scale-factor=1 --screenshot="${outPath}" --window-size=${finalW},${finalH} "file://${tempHtml}" 2>&1`;

    execSync(cmd, { stdio: 'pipe' });

    try {
      fs.unlinkSync(tempHtml);
    } catch {}

    const stat = fs.statSync(outPath);
    return {
      file: filePath,
      outPath,
      width: finalW,
      height: finalH,
      sizeBytes: stat.size,
      durationMs: Date.now() - startTime,
      success: true
    };
  } catch (err: any) {
    return {
      file: filePath,
      outPath,
      width: 0,
      height: 0,
      sizeBytes: 0,
      durationMs: Date.now() - startTime,
      success: false,
      error: err.message
    };
  }
}

