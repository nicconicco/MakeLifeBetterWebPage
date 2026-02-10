/**
 * Logger Utility
 * Centralized logging with optional debug toggle
 */

const DEBUG_KEY = 'mlb_debug';

function readDebugFlag() {
    if (typeof window !== 'undefined' && window.__MLB_DEBUG__ === true) {
        return true;
    }

    try {
        return localStorage.getItem(DEBUG_KEY) === 'true';
    } catch (error) {
        return false;
    }
}

export function isDebugEnabled() {
    return readDebugFlag();
}

export function setDebugEnabled(enabled) {
    try {
        localStorage.setItem(DEBUG_KEY, enabled ? 'true' : 'false');
    } catch (error) {
        // Swallow storage errors to avoid breaking runtime
    }
}

export function logInfo(message, ...meta) {
    if (!isDebugEnabled()) return;
    console.info(message, ...meta);
}

export function logWarn(message, ...meta) {
    console.warn(message, ...meta);
}

export function logError(message, ...meta) {
    console.error(message, ...meta);
}
