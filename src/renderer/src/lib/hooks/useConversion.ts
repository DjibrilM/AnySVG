import { useReducer, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import type { SvgFile } from '../interfaces/svg';
import type {
  ConvertResult,
  BatchProgressData,
  ConversionState,
  CompressionMode
} from '../interfaces/conversion';
import { triggerDownload } from '../utilities/download';
import { conversionService } from '../../core/services/conversion.service';

interface UseConversionOptions {
  isElectron: boolean;
  showToast: (msg: string) => void;
}

export const initialConversionState: ConversionState = {
  scale: 4,
  customWidth: null,
  customHeight: null,
  aspectLocked: true,
  bgColor: 'transparent',
  format: 'png',
  compression: 'none', // Default to uncompressed full-resolution fidelity
  isConverting: false,
  isConvertingAll: false,
  convertAllProgress: { current: 0, total: 0 },
  lastResult: null,
  lastZipUrl: null,
  conversionResults: {}
};

export type ConversionAction =
  | Partial<ConversionState>
  | ((prev: ConversionState) => Partial<ConversionState>);

export function useConversion({ isElectron, showToast }: UseConversionOptions) {
  const [state, setState] = useReducer(
    (prev: ConversionState, next: ConversionAction): ConversionState => ({
      ...prev,
      ...(typeof next === 'function' ? next(prev) : next)
    }),
    initialConversionState
  );

  // Setters
  const setAspectLocked = useCallback(
    (aspectLocked: boolean | ((prev: boolean) => boolean)): void => {
      setState(prev => ({
        aspectLocked: typeof aspectLocked === 'function' ? aspectLocked(prev.aspectLocked) : aspectLocked
      }));
    },
    []
  );

  const setBgColor = useCallback((bgColor: string): void => {
    setState({ bgColor });
  }, []);

  const setFormat = useCallback((format: 'png' | 'jpeg'): void => {
    setState({ format });
  }, []);

  const setCompression = useCallback((compression: CompressionMode): void => {
    setState({ compression });
  }, []);

  // Reset dimensions
  const handleDimensionsReset = useCallback((): void => {
    setState({ customWidth: null, customHeight: null });
  }, []);

  // Scale change handler
  const handleScaleChange = useCallback((newScale: number): void => {
    setState({
      scale: newScale,
      customWidth: null,
      customHeight: null
    });
  }, []);

  // Custom dimensions handler
  const handleDimensionsChange = useCallback((w: number, h: number): void => {
    setState({
      customWidth: w,
      customHeight: h
    });
  }, []);

  // Clear results
  const clearConversionResults = useCallback((): void => {
    setState({
      conversionResults: {},
      lastResult: null,
      lastZipUrl: null
    });
  }, []);

  // Remove single file result
  const removeFileResult = useCallback((filename: string): void => {
    setState(prev => {
      const nextResults = { ...prev.conversionResults };
      delete nextResults[filename];
      return { conversionResults: nextResults };
    });
  }, []);

  // Listen for real-time batch conversion progress from Electron main process
  useEffect(() => {
    const cleanup = conversionService.onConvertAllProgress((data: BatchProgressData) => {
      setState(prev => {
        const nextResults = { ...prev.conversionResults };
        if (data.currentFile && data.result) {
          nextResults[data.currentFile] = data.result;
        }
        if (data.results) {
          Object.assign(nextResults, data.results);
        }

        return {
          convertAllProgress: {
            current: data.current,
            total: data.total,
            currentFile: data.currentFile,
            status: data.status
          },
          conversionResults: nextResults
        };
      });
    });

    return cleanup;
  }, []);

  // Convert currently selected active SVG
  const handleConvertSingle = useCallback(async (activeFile: SvgFile | null): Promise<void> => {
    if (!activeFile || state.isConverting) return;

    setState({ isConverting: true });
    try {
      const payload = {
        filename: activeFile.name,
        scale: state.scale,
        width: state.customWidth,
        height: state.customHeight,
        bg: state.bgColor,
        format: state.format,
        compression: state.compression
      };

      const res = await conversionService.convert(payload);
      if (!res.success) throw new Error(res.error || 'Conversion failed');

      setState(prev => ({
        lastResult: res,
        conversionResults: {
          ...prev.conversionResults,
          [activeFile.name]: res
        }
      }));

      if (!isElectron && res.outputPath && res.outputFile) {
        triggerDownload(res.outputPath, res.outputFile);
      }

      if (res.savings && res.savings > 0) {
        showToast(`Exported ${res.outputFile} (-${res.savings}% size)`);
      } else {
        showToast(`Exported ${res.outputFile} (Full Resolution • Uncompressed)`);
      }
    } catch (err: any) {
      console.error('Convert error:', err);
      showToast(`Error: ${err.message}`);
    } finally {
      setState({ isConverting: false });
    }
  }, [state, isElectron, showToast]);

  // Convert all files in batch
  const handleConvertAll = useCallback(async (files: SvgFile[]): Promise<void> => {
    if (files.length === 0 || state.isConvertingAll) return;

    setState({
      isConvertingAll: true,
      convertAllProgress: {
        current: 0,
        total: files.length,
        currentFile: files[0]?.name,
        status: 'starting'
      }
    });

    try {
      const payload = {
        files: files.map(f => f.name),
        scale: state.scale,
        width: state.customWidth,
        height: state.customHeight,
        bg: state.bgColor,
        format: state.format,
        compression: state.compression
      };

      if (isElectron) {
        const res = await conversionService.convertAll(payload);
        if (!res.success) throw new Error(res.error || 'Batch conversion failed');

        setState(prev => ({
          lastZipUrl: res.zipPath || null,
          conversionResults: res.results
            ? { ...prev.conversionResults, ...res.results }
            : prev.conversionResults,
          convertAllProgress: {
            current: files.length,
            total: files.length,
            status: 'done'
          }
        }));
        showToast(`Batch completed: ${res.count} SVGs converted to ZIP!`);

        setTimeout(() => {
          setState({ isConvertingAll: false });
        }, 1800);
      } else {
        // Web fallback: convert file-by-file with live progress
        const zip = new JSZip();

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setState({
            convertAllProgress: {
              current: i,
              total: files.length,
              currentFile: file.name,
              status: 'converting'
            }
          });

          const singlePayload = {
            filename: file.name,
            scale: state.scale,
            width: state.customWidth,
            height: state.customHeight,
            bg: state.bgColor,
            format: state.format,
            compression: state.compression
          };

          const res = await fetch('/api/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(singlePayload)
          });
          const data = await res.json();
          if (data.success) {
            setState(prev => ({
              conversionResults: { ...prev.conversionResults, [file.name]: data }
            }));
            if (data.outputPath) {
              try {
                const imgRes = await fetch(data.outputPath);
                const blob = await imgRes.blob();
                zip.file(data.outputFile || `${file.name}.png`, blob);
              } catch (e) {
                console.warn('Failed to fetch blob for zip', e);
              }
            }
          }

          setState({
            convertAllProgress: {
              current: i + 1,
              total: files.length,
              currentFile: file.name,
              status: 'completed'
            }
          });
        }

        setState({
          convertAllProgress: {
            current: files.length,
            total: files.length,
            status: 'zipping'
          }
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        setState({
          lastZipUrl: zipUrl,
          convertAllProgress: {
            current: files.length,
            total: files.length,
            status: 'done'
          }
        });
        triggerDownload(zipUrl, `anysvg_exports_${state.scale}x.zip`);

        showToast(`Batch completed: ${files.length} SVGs converted to ZIP!`);

        setTimeout(() => {
          setState({ isConvertingAll: false });
        }, 1800);
      }
    } catch (err: any) {
      console.error('Batch error:', err);
      showToast(`Batch failed: ${err.message}`);
      setState({ isConvertingAll: false });
    }
  }, [state, isElectron, showToast]);

  return {
    // Individual state fields for direct access
    scale: state.scale,
    customWidth: state.customWidth,
    customHeight: state.customHeight,
    aspectLocked: state.aspectLocked,
    bgColor: state.bgColor,
    format: state.format,
    compression: state.compression,
    isConverting: state.isConverting,
    isConvertingAll: state.isConvertingAll,
    convertAllProgress: state.convertAllProgress,
    lastResult: state.lastResult,
    lastZipUrl: state.lastZipUrl,
    conversionResults: state.conversionResults,

    // Setters & handlers
    setAspectLocked,
    setBgColor,
    setFormat,
    setCompression,
    handleScaleChange,
    handleDimensionsChange,
    handleDimensionsReset,

    // Actions
    handleConvertSingle,
    handleConvertAll,
    clearConversionResults,
    removeFileResult
  };
}
