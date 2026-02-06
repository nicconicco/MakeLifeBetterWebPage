/**
 * Payment Service (PagBank)
 * Handles checkout creation via Cloud Functions
 */

import { FUNCTIONS_BASE_URL } from '../config/firebase.config.js';

/**
 * Create PagBank checkout session
 * @param {Object} payload - Checkout payload
 * @param {string} idToken - Firebase ID token
 * @returns {Promise<Object>} Checkout response
 */
export async function createPagBankCheckout(payload, idToken) {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/createPagBankCheckout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.message || 'Falha ao iniciar o pagamento.');
    }

    return data;
}
