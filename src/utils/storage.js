/**
 * Storage utility wrapper
 * Mimics the window.storage API using localStorage.
 * Supports shared/personal scope distinction.
 * All values are stored as JSON strings.
 */

const STORAGE_PREFIX = 'ptt:';
const PERSONAL_PREFIX = 'ptt-personal:';

function getPrefix(shared = true) {
  return shared ? STORAGE_PREFIX : PERSONAL_PREFIX;
}

function withRetry(fn, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return fn();
    } catch (err) {
      if (i === retries) throw err;
    }
  }
}

const storage = {
  /**
   * Get a value from storage
   * @param {string} key
   * @param {boolean} shared - true for shared data, false for personal
   * @returns {any} parsed JSON value, or null if not found
   */
  get(key, { shared = true } = {}) {
    return withRetry(() => {
      const raw = localStorage.getItem(getPrefix(shared) + key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    });
  },

  /**
   * Set a value in storage
   * @param {string} key
   * @param {any} value - will be JSON.stringify'd
   * @param {boolean} shared
   */
  set(key, value, { shared = true } = {}) {
    withRetry(() => {
      localStorage.setItem(getPrefix(shared) + key, JSON.stringify(value));
    });
  },

  /**
   * Delete a value from storage
   * @param {string} key
   * @param {boolean} shared
   */
  delete(key, { shared = true } = {}) {
    withRetry(() => {
      localStorage.removeItem(getPrefix(shared) + key);
    });
  },

  /**
   * List all keys matching a prefix
   * @param {string} prefix - key prefix to filter by
   * @param {boolean} shared
   * @returns {string[]} matching keys (without the internal prefix)
   */
  list(prefix = '', { shared = true } = {}) {
    const storagePrefix = getPrefix(shared);
    const fullPrefix = storagePrefix + prefix;
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(fullPrefix)) {
        keys.push(k.slice(storagePrefix.length));
      }
    }
    return keys;
  },

  /**
   * Clear all app data (both shared and personal)
   */
  clearAll() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(STORAGE_PREFIX) || k.startsWith(PERSONAL_PREFIX))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  },
};

export default storage;
