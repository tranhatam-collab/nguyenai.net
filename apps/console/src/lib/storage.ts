/**
 * storage.ts — Safe localStorage helpers with JSON parse/serialize.
 * All helpers are SSR-safe (no-op when window is undefined).
 */

export function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[storage] getItem failed for "${key}":`, err);
    return fallback;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] setItem failed for "${key}":`, err);
  }
}

export function removeItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[storage] removeItem failed for "${key}":`, err);
  }
}
