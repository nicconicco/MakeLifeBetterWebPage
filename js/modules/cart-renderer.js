/**
 * Cart Renderer Module
 * Handles rendering of shopping cart UI
 */

import { formatCurrency } from '../utils/formatters.js';
import { getElement, addClass, removeClass, setText } from '../utils/dom.js';

/**
 * Render cart items in sidebar
 * @param {Array} cartItems - Cart items
 * @param {Object} handlers - Event handlers
 */
export function renderCart(cartItems, { onUpdateQuantity, onRemoveItem }) {
    const itemsContainer = getElement('cart-items');
    const emptyContainer = getElement('cart-empty');
    const footerContainer = getElement('cart-footer');

    if (!itemsContainer) return;

    if (cartItems.length === 0) {
        itemsContainer.innerHTML = '';
        if (emptyContainer) emptyContainer.style.display = 'flex';
        if (footerContainer) footerContainer.style.display = 'none';
        return;
    }

    if (emptyContainer) emptyContainer.style.display = 'none';
    if (footerContainer) footerContainer.style.display = 'block';

    let subtotal = 0;

    const html = cartItems.map((item, index) => {
        const price = item.precoPromocional || item.preco;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        return createCartItemHTML(item, index, price, itemTotal);
    }).join('');

    itemsContainer.innerHTML = html;

    // Add event listeners
    itemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            const delta = parseInt(btn.dataset.delta);
            onUpdateQuantity(index, delta);
        });
    });

    itemsContainer.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            onRemoveItem(index);
        });
    });

    // Update totals
    updateCartTotals(subtotal);
}

/**
 * Create cart item HTML
 * @param {Object} item - Cart item
 * @param {number} index - Item index
 * @param {number} price - Unit price
 * @param {number} itemTotal - Item total
 * @returns {string} HTML string
 */
function createCartItemHTML(item, index, price, itemTotal) {
    return `
        <div class="cart-item">
            <div class="cart-item-image">
                ${item.imagem ?
                    `<img src="${item.imagem}" alt="${item.nome}">` :
                    '<div class="no-image"><i class="fas fa-image"></i></div>'}
            </div>
            <div class="cart-item-details">
                <h4>${item.nome}</h4>
                <p class="cart-item-price">${formatCurrency(price)}</p>
                <div class="cart-item-quantity">
                    <button class="qty-btn" data-index="${index}" data-delta="-1">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" data-index="${index}" data-delta="1">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <div class="cart-item-total">
                <span>${formatCurrency(itemTotal)}</span>
                <button class="remove-item-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Update cart totals display
 * @param {number} subtotal - Cart subtotal
 * @param {number} shipping - Shipping cost (optional)
 */
export function updateCartTotals(subtotal, shipping = 0) {
    setText('cart-subtotal-value', formatCurrency(subtotal));
    setText('cart-total-value', formatCurrency(subtotal + shipping));
}

/**
 * Update cart count badge
 * @param {number} count - Items count
 */
export function updateCartCount(count) {
    setText('cart-count', count.toString());
}

/**
 * Open cart sidebar
 */
export function openCartSidebar() {
    addClass('cart-overlay', 'show');
    addClass('cart-sidebar', 'show');
    document.body.style.overflow = 'hidden';
}

/**
 * Close cart sidebar
 */
export function closeCartSidebar() {
    removeClass('cart-overlay', 'show');
    removeClass('cart-sidebar', 'show');
    document.body.style.overflow = 'auto';
}
