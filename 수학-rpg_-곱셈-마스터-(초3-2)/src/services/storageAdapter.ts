// Storage Adapter encapsulates LocalStorage access
// In Step 2, this can be swapped or extended for Google Apps Script + Google Spreadsheet backend.

const CURRENT_SCHEMA_VERSION = 1;

export class StorageAdapter {
  private static prefix = 'math_rpg_';

  public static getItem<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`[StorageAdapter] Failed to parse key: ${key}`, e);
      return defaultValue;
    }
  }

  public static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) {
      console.error(`[StorageAdapter] Failed to save key: ${key}`, e);
    }
  }

  public static removeItem(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (e) {
      console.error(`[StorageAdapter] Failed to remove key: ${key}`, e);
    }
  }

  public static clearWithPrefix(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error('[StorageAdapter] Failed to clear items', e);
    }
  }

  public static getSchemaVersion(): number {
    return CURRENT_SCHEMA_VERSION;
  }
}
