/**
 * Store Main Entry Point
 * Initializes the store application
 */

import { initStoreApp } from './modules/store-app.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initStoreApp();
});
