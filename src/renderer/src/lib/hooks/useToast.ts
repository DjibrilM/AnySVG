import { useState, useCallback, useRef, useEffect } from 'react';

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string, duration = 4000): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setToast(msg);
    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { toast, showToast };
}
