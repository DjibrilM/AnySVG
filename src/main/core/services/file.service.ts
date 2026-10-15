import { dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import type { SystemService } from './system.service';
import type { DirectoryService } from './directory.service';

export interface SvgDimensions {
  width: number;
  height: number;
  viewBox: string;
}

export interface SvgFileMetadata {
  name: string;
  size: number;
  mtime: Date;
  width: number;
  height: number;
  viewBox: string;
}

export class FileService {
  constructor(private systemService: SystemService | DirectoryService) {}

  public getSvgDimensions(filePath: string): SvgDimensions {
    try {
      const stat = fs.statSync(filePath);
      const readLen = Math.min(stat.size, 1024 * 512); // read up to 512KB
      const fd = fs.openSync(filePath, 'r');
      const buf = Buffer.alloc(readLen);
      const bytesRead = fs.readSync(fd, buf, 0, readLen, 0);
      fs.closeSync(fd);
      const header = buf.toString('utf8', 0, bytesRead);

      let origW = 800;
      let origH = 600;
      let viewBox: string | null = null;

      // Specifically target opening <svg ...> tag to avoid matching inner elements
      const svgMatch = header.match(/<svg\b([^>]*)>/is);
      const attrs = svgMatch ? svgMatch[1] : header;

      const vb = attrs.match(/viewBox=["']([^"']+)["']/i);
      if (vb) {
        const parts = vb[1].trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          origW = parts[2];
          origH = parts[3];
          viewBox = vb[1];
          return {
            width: Math.round(origW),
            height: Math.round(origH),
            viewBox
          };
        }
      }

      const wm = attrs.match(/\bwidth=["']([\d.]+)(?:px)?["']/i);
      const hm = attrs.match(/\bheight=["']([\d.]+)(?:px)?["']/i);
      if (wm && hm) {
        const wVal = parseFloat(wm[1]);
        const hVal = parseFloat(hm[1]);
        if (wVal > 0 && hVal > 0) {
          origW = wVal;
          origH = hVal;
        }
      } else if (wm) {
        const wVal = parseFloat(wm[1]);
        if (wVal > 0) origW = wVal;
      } else if (hm) {
        const hVal = parseFloat(hm[1]);
        if (hVal > 0) origH = hVal;
      }

      return {
        width: Math.round(origW),
        height: Math.round(origH),
        viewBox: viewBox || `0 0 ${origW} ${origH}`
      };
    } catch {
      return { width: 800, height: 600, viewBox: '0 0 800 600' };
    }
  }

  public async getFiles(): Promise<{ success: boolean; files: SvgFileMetadata[]; error?: string }> {
    try {
      const root = this.systemService.getWorkspaceDir();
      const files = fs
        .readdirSync(root)
        .filter(f => f.toLowerCase().endsWith('.svg') && !f.startsWith('.'))
        .map(name => {
          const fullPath = path.join(root, name);
          const stats = fs.statSync(fullPath);
          const dims = this.getSvgDimensions(fullPath);
          return {
            name,
            size: stats.size,
            mtime: stats.mtime,
            width: dims.width,
            height: dims.height,
            viewBox: dims.viewBox
          };
        });
      return { success: true, files };
    } catch (err: any) {
      return { success: false, error: err.message, files: [] };
    }
  }

  public async getPreview(filename: string): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
    try {
      if (!filename) throw new Error('Filename required');
      const root = this.systemService.getWorkspaceDir();
      const safeFile = path.basename(filename);
      const svgPath = path.join(root, safeFile);
      if (!fs.existsSync(svgPath)) throw new Error('SVG not found');

      return {
        success: true,
        dataUrl: `anysvg://${svgPath}`
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async selectFiles(): Promise<{ success: boolean; count: number; files?: string[]; error?: string }> {
    try {
      const root = this.systemService.getWorkspaceDir();
      const result = await dialog.showOpenDialog({
        title: 'Import SVG Files',
        filters: [{ name: 'SVG Images', extensions: ['svg'] }],
        properties: ['openFile', 'multiSelections']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, count: 0, files: [] };
      }

      const imported: string[] = [];
      for (const srcPath of result.filePaths) {
        const fileName = path.basename(srcPath);
        const destPath = path.join(root, fileName);
        if (srcPath !== destPath) {
          try {
            fs.copyFileSync(srcPath, destPath, fs.constants.COPYFILE_FICLONE);
          } catch {
            fs.copyFileSync(srcPath, destPath);
          }
        }
        imported.push(fileName);
      }

      return { success: true, count: imported.length, files: imported };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message };
    }
  }

  public async importFiles(paths: string[]): Promise<{
    success: boolean;
    count: number;
    files?: SvgFileMetadata[];
    error?: string;
  }> {
    try {
      if (!Array.isArray(paths) || paths.length === 0) {
        return { success: false, error: 'No paths provided', count: 0, files: [] };
      }

      const root = this.systemService.getWorkspaceDir();
      const importedNames: string[] = [];
      const addFile = (filePath: string): void => {
        if (!fs.existsSync(filePath)) return;
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          const subFiles = fs.readdirSync(filePath);
          for (const sub of subFiles) {
            if (!sub.startsWith('.')) {
              addFile(path.join(filePath, sub));
            }
          }
        } else if (filePath.toLowerCase().endsWith('.svg')) {
          const baseName = path.basename(filePath);
          const destPath = path.join(root, baseName);
          if (filePath !== destPath) {
            try {
              fs.copyFileSync(filePath, destPath, fs.constants.COPYFILE_FICLONE);
            } catch {
              fs.copyFileSync(filePath, destPath);
            }
          }
          if (!importedNames.includes(baseName)) {
            importedNames.push(baseName);
          }
        }
      };

      for (const p of paths) {
        addFile(p);
      }

      if (importedNames.length === 0) {
        return { success: false, error: 'No SVG files found in dropped items', count: 0, files: [] };
      }

      const files = importedNames.map(name => {
        const fullPath = path.join(root, name);
        const stats = fs.statSync(fullPath);
        const dims = this.getSvgDimensions(fullPath);
        return {
          name,
          size: stats.size,
          mtime: stats.mtime,
          width: dims.width,
          height: dims.height,
          viewBox: dims.viewBox
        };
      });

      return { success: true, count: importedNames.length, files };
    } catch (err: any) {
      return { success: false, error: err.message, count: 0, files: [] };
    }
  }

  public async uploadSvg(
    name: string,
    content: string
  ): Promise<{ success: boolean; file?: SvgFileMetadata; error?: string }> {
    try {
      if (!name || !content) throw new Error('Missing file data');
      const root = this.systemService.getWorkspaceDir();
      const safeName = path.basename(name).replace(/[/\\]/g, '') || `vector_${Date.now()}.svg`;
      const targetPath = path.join(root, safeName);
      fs.writeFileSync(targetPath, content, 'utf8');

      const stat = fs.statSync(targetPath);
      const dims = this.getSvgDimensions(targetPath);

      return {
        success: true,
        file: {
          name: safeName,
          size: stat.size,
          mtime: stat.mtime,
          width: dims.width,
          height: dims.height,
          viewBox: dims.viewBox
        }
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async removeFile(filename: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!filename) throw new Error('Filename required');
      const root = this.systemService.getWorkspaceDir();
      const safeFile = path.basename(filename);
      const targetPath = path.join(root, safeFile);
      const baseName = path.basename(safeFile, path.extname(safeFile));

      if (fs.existsSync(targetPath)) {
        try {
          await shell.trashItem(targetPath);
        } catch {
          fs.unlinkSync(targetPath);
        }
      }

      const thumbPath = path.join(this.systemService.getThumbsDir(), `${baseName}_thumb.png`);
      if (fs.existsSync(thumbPath)) {
        try {
          fs.unlinkSync(thumbPath);
        } catch {}
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  public async clearFiles(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const root = this.systemService.getWorkspaceDir();
      const files = fs
        .readdirSync(root)
        .filter(f => f.toLowerCase().endsWith('.svg') && !f.startsWith('.'));

      for (const file of files) {
        const targetPath = path.join(root, file);
        const baseName = path.basename(file, path.extname(file));
        try {
          await shell.trashItem(targetPath);
        } catch {
          try {
            fs.unlinkSync(targetPath);
          } catch {}
        }
        const thumbPath = path.join(this.systemService.getThumbsDir(), `${baseName}_thumb.png`);
        if (fs.existsSync(thumbPath)) {
          try {
            fs.unlinkSync(thumbPath);
          } catch {}
        }
      }

      return { success: true, count: files.length };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
