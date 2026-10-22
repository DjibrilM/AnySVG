import React from 'react';
import { Sliders } from 'lucide-react';
import type { SvgFile } from '../../lib/interfaces/svg';
import type { ConvertResult, CompressionMode, ResolutionPreset } from '../../lib/interfaces/conversion';
import { formatMegapixels } from '../../lib/utilities/formatters';

import { ScaleSelector } from './ScaleSelector';
import { DimensionInputs } from './DimensionInputs';
import { CompressionSelector } from './CompressionSelector';
import { FormatSelector } from './FormatSelector';
import { BackgroundColorPicker } from './BackgroundColorPicker';
import { ExportSummary } from './ExportSummary';
import { DestinationFolder } from './DestinationFolder';
import { ConversionResultBanner } from './ConversionResultBanner';
import { ExportActions } from './ExportActions';

export interface SettingsPanelProps {
  files?: SvgFile[];
  activeFile?: SvgFile | null;
  scale?: number;
  onScaleChange: (scale: number) => void;
  preset?: ResolutionPreset;
  onPresetChange: (preset: ResolutionPreset) => void;
  customWidth?: number | null;
  customHeight?: number | null;
  onDimensionsChange: (w: number, h: number) => void;
  aspectLocked?: boolean;
  onToggleAspectLock: () => void;
  bgColor?: string;
  onBgColorChange: (color: string) => void;
  format?: 'png' | 'jpeg';
  onFormatChange: (fmt: 'png' | 'jpeg') => void;
  compression?: CompressionMode;
  onCompressionChange: (comp: CompressionMode) => void;
  isConverting: boolean;
  onConvertSingle: () => void;
  isConvertingAll?: boolean;
  onConvertAll?: () => void;
  convertAllProgress?: {
    current: number;
    total: number;
    currentFile?: string;
    status?: string;
  };
  lastZipUrl?: string | null;
  outputDir?: string;
  onChangeOutputDir?: () => void;
  onOpenFolder?: (path?: string) => void;
  lastResult?: ConvertResult | null;
}

export function SettingsPanel({
  files = [],
  activeFile,
  scale = 4,
  onScaleChange,
  preset = 'native',
  onPresetChange,
  customWidth,
  customHeight,
  onDimensionsChange,
  aspectLocked = true,
  onToggleAspectLock,
  bgColor = 'transparent',
  onBgColorChange,
  format = 'png',
  onFormatChange,
  compression = 'none',
  onCompressionChange,
  isConverting,
  onConvertSingle,
  isConvertingAll = false,
  onConvertAll,
  convertAllProgress,
  lastZipUrl,
  outputDir,
  onChangeOutputDir,
  onOpenFolder,
  lastResult
}: SettingsPanelProps): React.JSX.Element {
  const origW = activeFile?.width || 800;
  const origH = activeFile?.height || 600;

  const currentW = customWidth || Math.round(origW * scale);
  const currentH = customHeight || Math.round(origH * scale);
  const megaPixels = formatMegapixels(currentW, currentH, 1);

  return (
    <aside className="settings-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-header-title">
          <Sliders size={14} className="text-muted-foreground" />
          <span className="panel-title">Export Settings</span>
        </div>
        <span className="badge font-mono">{megaPixels} MP</span>
      </div>

      {/* Settings Body */}
      <div className="settings-body">
        {/* Scale Multipliers & Resolution Presets */}
        <ScaleSelector
          scale={scale}
          onScaleChange={onScaleChange}
          preset={preset}
          onPresetChange={onPresetChange}
        />

        {/* Custom Width & Height Inputs with Aspect Ratio Lock */}
        <DimensionInputs
          scale={scale}
          onScaleChange={onScaleChange}
          origW={origW}
          origH={origH}
          currentW={currentW}
          currentH={currentH}
          aspectLocked={aspectLocked}
          onToggleAspectLock={onToggleAspectLock}
          onDimensionsChange={onDimensionsChange}
        />

        {/* Compression Engine Selector */}
        <CompressionSelector
          compression={compression}
          onCompressionChange={onCompressionChange}
        />

        {/* Output Format */}
        <FormatSelector format={format} onFormatChange={onFormatChange} />

        {/* Background Color */}
        <BackgroundColorPicker bgColor={bgColor} onBgColorChange={onBgColorChange} />

        {/* Summary Card */}
        <ExportSummary
          currentW={currentW}
          currentH={currentH}
          scale={scale}
          megaPixels={megaPixels}
          compression={compression}
          preset={preset}
        />

        {/* Destination Folder */}
        <DestinationFolder
          outputDir={outputDir}
          onChangeOutputDir={onChangeOutputDir}
          onOpenFolder={onOpenFolder}
        />

        {/* Last Converted Result Banner with Reveal in Finder */}
        <ConversionResultBanner lastResult={lastResult} onOpenFolder={onOpenFolder} />
      </div>

      {/* Settings Footer: Unified Primary & Batch Action Buttons */}
      <ExportActions
        files={files}
        activeFile={activeFile}
        format={format}
        scale={scale}
        compression={compression}
        preset={preset}
        customWidth={customWidth}
        customHeight={customHeight}
        isConverting={isConverting}
        onConvertSingle={onConvertSingle}
        isConvertingAll={isConvertingAll}
        onConvertAll={onConvertAll}
        convertAllProgress={convertAllProgress}
        lastZipUrl={lastZipUrl}
        onOpenFolder={onOpenFolder}
      />
    </aside>
  );
}

export default SettingsPanel;
