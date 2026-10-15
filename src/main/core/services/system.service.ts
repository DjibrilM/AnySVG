import type { BrowserWindow } from 'electron';
import { ConfigService, type AppConfig } from './config.service';
import { DirectoryService } from './directory.service';
import { DialogService, type OpenFolderResult, type SelectOutputDirResult } from './dialog.service';

/**
 * SystemService acts as a unified facade coordinating configuration,
 * directory paths, and native OS dialog services.
 */
export class SystemService {
  public readonly config: ConfigService;
  public readonly directory: DirectoryService;
  public readonly dialog: DialogService;

  constructor(
    configService?: ConfigService,
    directoryService?: DirectoryService,
    dialogService?: DialogService
  ) {
    this.config = configService || new ConfigService();
    this.directory = directoryService || new DirectoryService(this.config);
    this.dialog = dialogService || new DialogService(this.directory);
  }

  // Directory delegation
  public getWorkspaceDir(): string {
    return this.directory.getWorkspaceDir();
  }

  public getOutputDir(): string {
    return this.directory.getOutputDir();
  }

  public getThumbsDir(): string {
    return this.directory.getThumbsDir();
  }

  public initDirectories(): void {
    this.directory.initDirectories();
  }

  // Dialog & Shell delegation
  public openFolder(targetPath?: string): Promise<OpenFolderResult> {
    return this.dialog.openFolder(targetPath);
  }

  public selectOutputDir(window?: BrowserWindow | null): Promise<SelectOutputDirResult> {
    return this.dialog.selectOutputDir(window);
  }

  // Config delegation
  public loadConfig(): AppConfig {
    return this.config.loadConfig();
  }

  public saveConfig(cfg: Partial<AppConfig>): void {
    this.config.saveConfig(cfg);
  }
}
