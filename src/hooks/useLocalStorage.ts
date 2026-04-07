/**
 * useLocalStorage Hook
 * Syncs state with localStorage, supports SSR
 */
import { useState, useCallback, useEffect } from 'react';
import { localStorageGet, localStorageSet } from '../utils/helpers';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => localStorageGet(key, initialValue));

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      localStorageSet(key, newValue);
      return newValue;
    });
  }, [key]);

  const removeValue = useCallback(() => {
    localStorage.removeItem(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try { setStoredValue(JSON.parse(e.newValue) as T); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  return [storedValue, setValue, removeValue];
}
