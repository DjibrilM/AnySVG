import type {
  ConvertOptions,
  ConvertResult,
  BatchConvertOptions,
  BatchConvertResult,
  BatchProgressData
} from '../../lib/interfaces/conversion';
import { IpcClient } from './ipc.client';

export class ConversionService {
  public async convert(options: ConvertOptions): Promise<ConvertResult> {
    return IpcClient.invoke(
      async () => {
        if (!window.api?.convert) throw new Error('api.convert unavailable');
        return window.api.convert(options);
      },
      async () => {
        const res = await fetch('/api/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(options)
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Conversion failed');
        }
        return data;
      }
    );
  }

  public async convertAll(options?: BatchConvertOptions): Promise<BatchConvertResult> {
    return IpcClient.invoke(async () => {
      if (!window.api?.convertAll) throw new Error('api.convertAll unavailable');
      return window.api.convertAll(options);
    });
  }

  public onConvertAllProgress(callback: (data: BatchProgressData) => void): (() => void) | undefined {
    if (IpcClient.isAvailable() && window.api?.onConvertAllProgress) {
      return window.api.onConvertAllProgress(callback);
    }
    return undefined;
  }
}

export const conversionService = new ConversionService();
