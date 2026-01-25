import { db } from './index';

/**
 * Get a setting value from the database
 * @param key The setting key
 * @param defaultValue The default value if the key is not found
 */
export const getSetting = async <T>(key: string, defaultValue?: T): Promise<T | undefined> => {
  try {
    const entry = await db.settings.get(key);
    return entry ? entry.value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Save a setting value to the database
 * @param key The setting key
 * @param value The value to save
 */
export const setSetting = async (key: string, value: any): Promise<void> => {
  try {
    await db.settings.put({ key, value });
  } catch (error) {
    console.error(`Error setting setting ${key}:`, error);
  }
};

/**
 * Delete a setting from the database
 * @param key The setting key
 */
export const deleteSetting = async (key: string): Promise<void> => {
  try {
    await db.settings.delete(key);
  } catch (error) {
    console.error(`Error deleting setting ${key}:`, error);
  }
};

/**
 * Get multiple settings at once
 * @param keys Array of keys to fetch
 */
export const getSettings = async (keys: string[]): Promise<Record<string, any>> => {
  try {
    const result: Record<string, any> = {};
    // Use Promise.all for parallel fetching since Dexie handles it well
    // Alternatively we could use bulkGet if we had IDs, but these are string keys
    await Promise.all(keys.map(async (key) => {
        const entry = await db.settings.get(key);
        if (entry) {
            result[key] = entry.value;
        }
    }));
    return result;
  } catch (error) {
    console.error('Error getting settings:', error);
    return {};
  }
};
