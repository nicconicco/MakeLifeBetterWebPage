/**
 * Admin Tabs Module
 * Handles tab navigation in admin panel
 */

let currentTab = 'eventos';
let onTabChangeCallback = null;

/**
 * Get current active tab
 * @returns {string} - Current tab name
 */
export function getCurrentTab() {
    return currentTab;
}

/**
 * Set callback for tab changes
 * @param {Function} callback - Function to call when tab changes
 */
export function onTabChange(callback) {
    onTabChangeCallback = callback;
}

/**
 * Show a specific tab
 * @param {string} tabName - The tab to show
 * @param {Event} evt - Optional click event
 */
export function showTab(tabName, evt) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    const tabElement = document.getElementById(tabName + '-tab');
    if (tabElement) {
        tabElement.classList.add('active');
    }

    // Activate corresponding button
    const clickedBtn = evt?.target || document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    currentTab = tabName;

    // Call the callback to load data
    if (onTabChangeCallback) {
        onTabChangeCallback(tabName);
    }
}

/**
 * Initialize tab navigation
 * Binds click events to tab buttons
 */
export function initTabs() {
    // Set initial active tab button
    const firstTabBtn = document.querySelector('.tab-btn');
    if (firstTabBtn) {
        firstTabBtn.classList.add('active');
    }
}
