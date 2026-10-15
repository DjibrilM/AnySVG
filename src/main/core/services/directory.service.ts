import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import type { ConfigService } from './config.service';

/**
 * DirectoryService handles calculating, ensuring, and managing workspace filesystem paths.
 * Single Responsibility: Filesystem Paths & Working Directories.
 */
export class DirectoryService {
  private workspaceDir: string;
  private outputDir: string;
  private thumbsDir: string;

  constructor(private configService: ConfigService) {
    this.workspaceDir = this.calculateWorkspaceDir();
    this.outputDir = this.calculateOutputDir();
    this.thumbsDir = this.calculateThumbsDir();
    this.initDirectories();
  }

  private calculateWorkspaceDir(): string {
    if (app.isPackaged) {
      return path.join(app.getPath('userData'), 'workspace');
    }
    return process.cwd();
  }

  private calculateOutputDir(): string {
    const saved = this.configService.get('outputDir');
    if (saved && fs.existsSync(saved)) {
      return saved;
    }
    if (app.isPackaged) {
      return path.join(app.getPath('downloads'), 'AnySVG');
    }
    return path.join(this.workspaceDir, 'png_output');
  }

  private calculateThumbsDir(): string {
    if (app.isPackaged) {
      return path.join(app.getPath('userData'), 'thumbs');
    }
    return path.join(this.outputDir, 'thumbs');
  }

  public initDirectories(): void {
    this.workspaceDir = this.calculateWorkspaceDir();
    this.outputDir = this.calculateOutputDir();
    this.thumbsDir = this.calculateThumbsDir();

    try {
      if (!fs.existsSync(this.workspaceDir)) fs.mkdirSync(this.workspaceDir, { recursive: true });
      if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
      if (!fs.existsSync(this.thumbsDir)) fs.mkdirSync(this.thumbsDir, { recursive: true });
    } catch (err) {
      console.error('Failed to initialize working directories:', err);
    }
  }

  public getWorkspaceDir(): string {
    return this.workspaceDir;
  }

  public getOutputDir(): string {
    return this.outputDir;
  }

  public setOutputDir(newDir: string): void {
    this.outputDir = newDir;
    this.thumbsDir = this.calculateThumbsDir();
    this.configService.set('outputDir', newDir);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }
  }

  public getThumbsDir(): string {
    return this.thumbsDir;
  }
}
