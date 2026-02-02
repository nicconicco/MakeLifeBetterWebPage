/**
 * Formatting Utilities
 * Functions for formatting data for display
 */

/**
 * Format price to Brazilian Real currency
 * @param {number} value - The numeric value
 * @returns {string} Formatted price string
 */
export function formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) {
        return 'R$ 0,00';
    }
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/**
 * Format date to Brazilian format (dd/mm/yyyy)
 * @param {number|Date} timestamp - Timestamp or Date object
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString('pt-BR');
}

/**
 * Format datetime to Brazilian format
 * @param {number|Date} timestamp - Timestamp or Date object
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleString('pt-BR');
}

/**
 * Format CEP (Brazilian postal code)
 * @param {string} value - Raw CEP string
 * @returns {string} Formatted CEP (00000-000)
 */
export function formatCEP(value) {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 5) {
        return `${numbers.substring(0, 5)}-${numbers.substring(5, 8)}`;
    }
    return numbers;
}

/**
 * Format phone number
 * @param {string} value - Raw phone string
 * @returns {string} Formatted phone ((00) 00000-0000)
 */
export function formatPhone(value) {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * Format credit card number with spaces
 * @param {string} value - Raw card number
 * @returns {string} Formatted card number (0000 0000 0000 0000)
 */
export function formatCardNumber(value) {
    const numbers = value.replace(/\D/g, '');
    return numbers.match(/.{1,4}/g)?.join(' ') || numbers;
}

/**
 * Format card expiry date
 * @param {string} value - Raw expiry string
 * @returns {string} Formatted expiry (MM/AA)
 */
export function formatCardExpiry(value) {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length > 2) {
        return `${numbers.substring(0, 2)}/${numbers.substring(2, 4)}`;
    }
    return numbers;
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
}

/**
 * Calculate discount percentage
 * @param {number} originalPrice - Original price
 * @param {number} promoPrice - Promotional price
 * @returns {number} Discount percentage
 */
export function calculateDiscount(originalPrice, promoPrice) {
    if (!originalPrice || !promoPrice || promoPrice >= originalPrice) {
        return 0;
    }
    return Math.round((1 - promoPrice / originalPrice) * 100);
}

/**
 * Generate order number from ID
 * @param {string} orderId - Firebase document ID
 * @returns {string} Short order number
 */
export function generateOrderNumber(orderId) {
    return orderId.substring(0, 8).toUpperCase();
}
