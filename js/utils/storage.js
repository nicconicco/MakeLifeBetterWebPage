/**
 * Storage Utilities
 * Functions for localStorage operations
 */

/**
 * Get item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Parsed value or default
 */
export function getStorageItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage: ${key}`, error);
        return defaultValue;
    }
}

/**
 * Set item in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage: ${key}`, error);
    }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export function removeStorageItem(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing from localStorage: ${key}`, error);
    }
}

/**
 * Clear all items from localStorage
 */
export function clearStorage() {
    try {
        localStorage.clear();
    } catch (error) {
        console.error('Error clearing localStorage', error);
    }
}

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
export function isStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}
