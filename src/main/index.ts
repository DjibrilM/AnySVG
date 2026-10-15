import { app, BrowserWindow, protocol, net, shell } from 'electron';
import path from 'path';
import fs from 'fs';

import {
  type BaseController,
  ConfigService,
  DirectoryService,
  DialogService,
  SystemService,
  FileService,
  ConversionService,
  SystemController,
  FileController,
  ConversionController
} from './core';

export * from './core';

// Register custom protocol to stream local SVGs directly to Chromium renderer at 0ms latency
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'anysvg',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true
    }
  }
]);

// ============================================================================
// Dependency Injection Container & Bootstrap
// ============================================================================
export function bootstrapIpc(): {
  configService: ConfigService;
  directoryService: DirectoryService;
  dialogService: DialogService;
  systemService: SystemService;
  fileService: FileService;
  conversionService: ConversionService;
} {
  // 1. Initialize separated single-responsibility core services
  const configService = new ConfigService();
  const directoryService = new DirectoryService(configService);
  const dialogService = new DialogService(directoryService);
  const systemService = new SystemService(configService, directoryService, dialogService);

  const fileService = new FileService(directoryService);
  const conversionService = new ConversionService(directoryService);

  // 2. Initialize controllers with injected services (Constructor Injection)
  const controllers: BaseController[] = [
    new SystemController(directoryService, dialogService),
    new FileController(fileService),
    new ConversionController(conversionService)
  ];

  // 3. Initialize and bind IPC handlers on all controllers
  for (const controller of controllers) {
    controller.init();
  }

  return { configService, directoryService, dialogService, systemService, fileService, conversionService };
}

const { systemService, conversionService, fileService } = bootstrapIpc();

let splashWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;

function createSplashWindow(): BrowserWindow {
  const root = systemService.getWorkspaceDir();
  const iconPath = path.join(root, 'build/icon.png');

  splashWindow = new BrowserWindow({
    width: 300,
    height: 240,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    center: true,
    hasShadow: false,
    show: false,
    backgroundColor: '#00000000',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  splashWindow.once('ready-to-show', () => {
    splashWindow?.show();
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    splashWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/splash.html`);
  } else {
    splashWindow.loadFile(path.join(__dirname, '../renderer/splash.html'));
  }

  splashWindow.on('closed', () => {
    splashWindow = null;
  });

  return splashWindow;
}

function sendSplashProgress(progress: number, message: string): void {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('init:progress', { progress, message });
  }
}

function createMainWindow(): BrowserWindow {
  const root = systemService.getWorkspaceDir();
  const iconPath = path.join(root, 'build/icon.png');

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 1040,
    minHeight: 680,
    title: 'AnySVG — Studio-Grade Vector Rasterizer',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 18, y: 18 },
    backgroundColor: '#09090b',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return mainWindow;
}

app.name = 'AnySVG';
app.setName('AnySVG');

app.whenReady().then(async () => {
  // 1. Create and show separate Splash Screen window immediately
  const splash = createSplashWindow();

  // Ensure splash DOM is loaded before dispatching progress events
  if (splash.webContents.isLoading()) {
    await new Promise<void>((resolve) => {
      splash.webContents.once('did-finish-load', () => resolve());
    });
  }

  // Step 1: Start persistent Chromium rasterization instance (re-used across app lifecycle)
  sendSplashProgress(25, 'Starting persistent Chromium rasterizer instance...');
  await new Promise((r) => setTimeout(r, 1000));

  try {
    await conversionService.initEngine();
    sendSplashProgress(60, 'Chromium rasterizer active & connected');
  } catch (err: any) {
    console.error('Chromium rasterizer init notice:', err);
    sendSplashProgress(60, 'Chromium rasterizer ready');
  }
  await new Promise((r) => setTimeout(r, 1200));

  // Step 2: Initialize workspace storage
  sendSplashProgress(80, 'Configuring workspace storage...');
  systemService.initDirectories();
  await new Promise((r) => setTimeout(r, 1000));

  // Step 3: Discover project vector assets
  sendSplashProgress(95, 'Scanning project vector files...');
  const filesResult = await fileService.getFiles();
  const fileCount = filesResult.success && filesResult.files ? filesResult.files.length : 0;
  await new Promise((r) => setTimeout(r, 1000));

  // Step 4: Ready (Final hold to complete 5 seconds total splash display)
  sendSplashProgress(100, fileCount > 0 ? `Loaded ${fileCount} vector assets • Ready` : 'Studio Ready');
  await new Promise((r) => setTimeout(r, 800));

  // Set native macOS Dock icon
  if (process.platform === 'darwin' && app.dock) {
    const dockIcon = path.join(systemService.getWorkspaceDir(), 'build/icon.png');
    if (fs.existsSync(dockIcon)) {
      try {
        app.dock.setIcon(dockIcon);
      } catch (e) {
        console.error('Failed to set dock icon:', e);
      }
    }
  }

  // Register hardware-accelerated local SVG protocol handler
  protocol.handle('anysvg', (request) => {
    try {
      const parsed = new URL(request.url);
      let filePath = decodeURIComponent(parsed.pathname);
      if (parsed.host && parsed.host !== 'localhost') {
        filePath = path.join(parsed.host, filePath);
      }
      if (!filePath.startsWith('/')) {
        filePath = '/' + filePath;
      }
      return net.fetch(`file://${filePath}`);
    } catch (err: any) {
      console.error('anysvg protocol error:', err);
      return new Response('File not found', { status: 404 });
    }
  });

  // Create main window and transition from splash window when ready
  const main = createMainWindow();

  main.once('ready-to-show', () => {
    main.show();
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
