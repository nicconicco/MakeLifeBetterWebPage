/**
 * Admin Main Entry Point
 * Initializes the admin application
 */
import { initAdminApp } from './modules/admin/admin-app.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initAdminApp();
});
