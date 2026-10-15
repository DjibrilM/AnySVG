import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export interface AppConfig {
  outputDir?: string;
}

/**
 * ConfigService handles reading and writing user preferences to disk.
 * Single Responsibility: Configuration Persistence.
 */
export class ConfigService {
  private configPath: string;

  constructor() {
    this.configPath = this.resolveConfigPath();
  }

  private resolveConfigPath(): string {
    try {
      return path.join(app.getPath('userData'), 'anysvg-config.json');
    } catch {
      return path.join(process.cwd(), 'anysvg-config.json');
    }
  }

  public getConfigPath(): string {
    return this.configPath;
  }

  public loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (err) {
      console.warn('Failed to load config, using defaults:', err);
    }
    return {};
  }

  public saveConfig(cfg: Partial<AppConfig>): void {
    try {
      const existing = this.loadConfig();
      fs.writeFileSync(this.configPath, JSON.stringify({ ...existing, ...cfg }, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.loadConfig()[key];
  }

  public set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.saveConfig({ [key]: value });
  }
}
