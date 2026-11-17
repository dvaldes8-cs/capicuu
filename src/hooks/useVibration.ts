import { useCallback } from 'react';
import { useAppStore } from './useAppStore';

/** Optional light haptic feedback — never required. */
export function useVibration() {
  const { data } = useAppStore();

  return useCallback(() => {
    if (!data.preferences.vibrationEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    } catch {
      /* ignore unsupported platforms */
    }
  }, [data.preferences.vibrationEnabled]);
}
