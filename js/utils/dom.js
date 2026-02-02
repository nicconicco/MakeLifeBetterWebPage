/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

import { TOAST_ICONS, TOAST_TYPES, UI_CONFIG } from '../config/constants.js';

/**
 * Get element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
export function getElement(id) {
    return document.getElementById(id);
}

/**
 * Get multiple elements by selector
 * @param {string} selector - CSS selector
 * @returns {NodeList}
 */
export function getElements(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Set element text content
 * @param {string} id - Element ID
 * @param {string} text - Text content
 */
export function setText(id, text) {
    const element = getElement(id);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Set element HTML content
 * @param {string} id - Element ID
 * @param {string} html - HTML content
 */
export function setHTML(id, html) {
    const element = getElement(id);
    if (element) {
        element.innerHTML = html;
    }
}

/**
 * Show element
 * @param {string} id - Element ID
 * @param {string} display - Display value (default: 'block')
 */
export function showElement(id, display = 'block') {
    const element = getElement(id);
    if (element) {
        element.style.display = display;
    }
}

/**
 * Hide element
 * @param {string} id - Element ID
 */
export function hideElement(id) {
    const element = getElement(id);
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * Toggle element visibility
 * @param {string} id - Element ID
 * @param {boolean} show - Show or hide
 * @param {string} display - Display value when showing
 */
export function toggleElement(id, show, display = 'block') {
    if (show) {
        showElement(id, display);
    } else {
        hideElement(id);
    }
}

/**
 * Add class to element
 * @param {string} id - Element ID
 * @param {string} className - Class name
 */
export function addClass(id, className) {
    const element = getElement(id);
    if (element) {
        element.classList.add(className);
    }
}

/**
 * Remove class from element
 * @param {string} id - Element ID
 * @param {string} className - Class name
 */
export function removeClass(id, className) {
    const element = getElement(id);
    if (element) {
        element.classList.remove(className);
    }
}

/**
 * Toggle class on element
 * @param {string} id - Element ID
 * @param {string} className - Class name
 */
export function toggleClass(id, className) {
    const element = getElement(id);
    if (element) {
        element.classList.toggle(className);
    }
}

/**
 * Open modal
 * @param {string} modalId - Modal element ID
 */
export function openModal(modalId) {
    const modal = getElement(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close modal
 * @param {string} modalId - Modal element ID
 */
export function closeModal(modalId) {
    const modal = getElement(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Close all modals
 * @param {string[]} modalIds - Array of modal IDs
 */
export function closeAllModals(modalIds) {
    modalIds.forEach(id => closeModal(id));
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, info, warning)
 */
export function showToast(message, type = TOAST_TYPES.INFO) {
    const container = getElement('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = TOAST_ICONS[type] || TOAST_ICONS[TOAST_TYPES.INFO];

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), UI_CONFIG.TOAST_ANIMATION_DELAY);
    }, UI_CONFIG.TOAST_DURATION);
}

/**
 * Create loading spinner HTML
 * @param {string} message - Loading message
 * @returns {string} HTML string
 */
export function createLoadingSpinner(message = 'Carregando...') {
    return `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Create empty state HTML
 * @param {string} icon - Font Awesome icon class
 * @param {string} title - Title text
 * @param {string} message - Message text
 * @returns {string} HTML string
 */
export function createEmptyState(icon, title, message) {
    return `
        <div class="empty-state">
            <i class="fas ${icon}"></i>
            <h3>${title}</h3>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Create error state HTML
 * @param {string} message - Error message
 * @returns {string} HTML string
 */
export function createErrorState(message) {
    return `
        <div class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <p>${message}</p>
            <button onclick="location.reload()">Tentar novamente</button>
        </div>
    `;
}

/**
 * Setup click outside listener for dropdown
 * @param {string} containerId - Container element ID
 * @param {string} dropdownId - Dropdown element ID
 */
export function setupClickOutside(containerId, dropdownId) {
    document.addEventListener('click', (e) => {
        const container = getElement(containerId);
        const dropdown = getElement(dropdownId);
        if (container && dropdown && !container.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

/**
 * Setup escape key listener for modals
 * @param {Function} closeCallback - Callback function to close modals
 */
export function setupEscapeKey(closeCallback) {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeCallback();
        }
    });
}

/**
 * Setup modal click outside to close
 * @param {string[]} modalIds - Array of modal IDs
 */
export function setupModalClickOutside(modalIds) {
    window.addEventListener('click', (event) => {
        modalIds.forEach(modalId => {
            const modal = getElement(modalId);
            if (event.target === modal) {
                closeModal(modalId);
            }
        });
    });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = UI_CONFIG.DEBOUNCE_DELAY) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
