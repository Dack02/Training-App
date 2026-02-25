import { useState, useEffect, useCallback } from 'react';
import storage from '../utils/storage';

/**
 * React hook for reading/writing a storage key with loading and error states.
 * @param {string} key - storage key
 * @param {any} defaultValue - default if key not found
 * @param {object} options - { shared: boolean }
 */
export function useStorage(key, defaultValue = null, { shared = true } = {}) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const stored = storage.get(key, { shared });
      setValue(stored !== null ? stored : defaultValue);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [key, shared]);

  const save = useCallback(
    (newValue) => {
      try {
        const val = typeof newValue === 'function' ? newValue(value) : newValue;
        storage.set(key, val, { shared });
        setValue(val);
        setError(null);
        return true;
      } catch (err) {
        setError(err.message || 'Failed to save data');
        return false;
      }
    },
    [key, shared, value]
  );

  const remove = useCallback(() => {
    try {
      storage.delete(key, { shared });
      setValue(defaultValue);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to delete data');
    }
  }, [key, shared, defaultValue]);

  return { value, save, remove, loading, error };
}
