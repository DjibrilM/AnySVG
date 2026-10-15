<p align="center">
  <img src="build/icon.png" width="96" height="96" alt="AnySVG Logo" />
</p>

# AnySVG

AnySVG is a desktop application built with Electron, React, and TypeScript designed to convert SVG vector graphics into high-resolution raster images (PNG and JPEG) with post-rasterization compression.

---

## How It Works

### 1. Vector Rasterization (Chromium Engine)
Instead of relying on basic SVG parsers that frequently fail on complex elements (clip paths, embedded fonts, nested filters, or large `foreignObject` tags), AnySVG uses Electron's built-in Chromium instance. 

* **Persistent Offscreen Window**: At startup, the app pre-warms a hidden offscreen `BrowserWindow` (`ChromiumRasterizer`). This instance remains active throughout the application lifecycle, eliminating the cold-start delay of spawning a new browser process on every export.
* **Large File Handling**: Large SVGs (e.g., 10MB–20MB Figma exports) can exceed Chromium's 2MB `data:` URL string limit. To prevent `ERR_INVALID_URL` errors, the rasterizer writes a temporary HTML wrapper to disk and loads it directly via `loadFile()`. The temporary file is cleaned up immediately after frame capture.
* **GPU Dimension Clamping**: If an SVG is exported at high scales (e.g., 4x or custom dimensions) that exceed hardware texture bounds, dimensions are proportionally constrained to 16,384px to prevent GPU compositor crashes while preserving aspect ratio.

### 2. Secondary Compression (Sharp)
Once Chromium captures the rendered SVG into an uncompressed pixel buffer:
* **PNG**: Passed to `Sharp` for level 9 deflate compression with adaptive row filtering, or 8-bit palette quantization (`pngquant`) depending on user settings.
* **JPEG**: Converted using `MozJPEG` with trellis quantization.
* Stats on size reduction and savings percentage are calculated and returned to the UI.

### 3. Queue & Batch Export
* Files can be selected via native dialog, dragged into the window, or discovered in the workspace directory.
* Batch exports process the queue sequentially, stream progress over IPC, and package the output files into a single `.zip` archive using `JSZip`.

### 4. Application Boot & Splash
On launch, Electron creates a lightweight, frameless splash window while:
1. Pre-warming the internal Chromium rasterizer.
2. Initializing workspace and output storage directories.
3. Indexing local SVG files.

Once those tasks report ready via IPC, the main window is displayed and the splash window is closed.

---

## Project Structure

```
├── build/                     # App icons (icon.png, icon.icns, icon.ico)
├── electron-builder.yml       # Packaging and distribution configuration
├── electron.vite.config.mjs   # Vite configuration for main, preload, and renderer
├── src/
│   ├── main/                  # Electron main process
│   │   ├── core/              # Core business logic
│   │   │   ├── controllers/   # IPC route handlers (System, File, Conversion)
│   │   │   ├── services/      # ChromiumRasterizer, ConversionService, FileService
│   │   │   └── convert.ts     # SVG dimension parsing utilities
│   │   └── index.ts           # App lifecycle, window management, and boot sequence
│   ├── preload/               # Electron preload script and context bridge
│   └── renderer/              # Frontend application
│       ├── splash.html        # Lightweight boot splash window
│       └── src/               # React UI (canvas preview, queue, settings panels)
```

---

## Development

### Prerequisites
* **Node.js**: v18 or higher (v20+ recommended)
* **pnpm**: v8 or higher (recommended package manager)

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd anysvg

# Install dependencies
pnpm install
```

### Running Locally
```bash
# Start Vite development server with Electron HMR
pnpm run dev
```

---

## Building and Packaging

The project uses `electron-builder` configured in `electron-builder.yml`. Build artifacts are output to the `dist_electron/` directory.

### Build macOS DMGs
To compile the TypeScript source and package a DMG for both Apple Silicon (`arm64`) and Intel (`x64`):

```bash
pnpm run build:dmg
```

For architecture-specific builds:
```bash
# Build for current machine's architecture
pnpm run build:mac

# Build specifically for Apple Silicon (M1/M2/M3/M4)
npx electron-builder --mac dmg --arm64

# Build specifically for Intel Macs
npx electron-builder --mac dmg --x64
```

### Build Windows Installer
```bash
pnpm run build:win
```

---

## Installing Local DMGs on macOS

When you build a DMG locally without an Apple Developer ID certificate:
1. Open the `.dmg` file in `dist_electron/`.
2. Drag **AnySVG.app** into your `/Applications` folder.
3. If macOS blocks launching with an "unidentified developer" warning:
   * **Option A**: Right-click (or Control-click) `AnySVG.app` in Finder, select **Open**, then click **Open** in the dialog.
   * **Option B**: Remove the quarantine attribute via terminal:
     ```bash
     xattr -cr /Applications/AnySVG.app
     ```

---

## License

MIT
# AnySVG
