/**
 * IPC Client wrapper - provides request-response semantics similar to an HTTP client (like axios/fetch)
 */
export class IpcClient {
  public static isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.api?.isElectron;
  }

  public static async invoke<T = any>(
    apiCall: () => Promise<T>,
    fallbackCall?: () => Promise<T>
  ): Promise<T> {
    if (this.isAvailable()) {
      try {
        return await apiCall();
      } catch (err: any) {
        console.error('IPC Invocation Error:', err);
        throw new Error(err.message || 'IPC invocation failed');
      }
    }

    if (fallbackCall) {
      return await fallbackCall();
    }

    throw new Error('Electron IPC is not available in this environment');
  }
}
