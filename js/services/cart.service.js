/**
 * Cart Service
 * Handles shopping cart operations with localStorage persistence
 */

import { STORAGE_KEYS } from '../config/constants.js';
import { getStorageItem, setStorageItem } from '../utils/storage.js';

/**
 * Cart state
 */
let cart = [];
let cartChangeCallback = null;

/**
 * Initialize cart from storage
 * @param {Function} onChange - Callback for cart changes
 */
export function initCart(onChange = null) {
    cartChangeCallback = onChange;
    cart = getStorageItem(STORAGE_KEYS.CART, []);
    notifyChange();
}

/**
 * Save cart to storage
 */
function saveCart() {
    setStorageItem(STORAGE_KEYS.CART, cart);
    notifyChange();
}

/**
 * Notify cart change
 */
function notifyChange() {
    if (cartChangeCallback) {
        cartChangeCallback(cart);
    }
}

/**
 * Get cart items
 * @returns {Array} Cart items
 */
export function getCartItems() {
    return [...cart];
}

/**
 * Get cart count
 * @returns {number} Total items count
 */
export function getCartCount() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Get cart subtotal
 * @returns {number} Cart subtotal
 */
export function getCartSubtotal() {
    return cart.reduce((total, item) => {
        const price = item.precoPromocional || item.preco;
        return total + (price * item.quantity);
    }, 0);
}

/**
 * Check if cart is empty
 * @returns {boolean}
 */
export function isCartEmpty() {
    return cart.length === 0;
}

/**
 * Add product to cart
 * @param {Object} product - Product to add
 * @param {number} quantity - Quantity to add
 * @returns {boolean} Success status
 */
export function addToCart(product, quantity = 1) {
    if (!product || !product.id) return false;

    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            nome: product.nome,
            preco: product.preco,
            precoPromocional: product.precoPromocional,
            imagem: product.imagem,
            quantity: quantity
        });
    }

    saveCart();
    return true;
}

/**
 * Remove product from cart
 * @param {number} index - Item index in cart
 * @returns {Object|null} Removed item or null
 */
export function removeFromCart(index) {
    if (index < 0 || index >= cart.length) return null;

    const removedItem = cart.splice(index, 1)[0];
    saveCart();
    return removedItem;
}

/**
 * Update item quantity
 * @param {number} index - Item index in cart
 * @param {number} delta - Quantity change (+1 or -1)
 * @returns {boolean} Success status
 */
export function updateQuantity(index, delta) {
    if (index < 0 || index >= cart.length) return false;

    cart[index].quantity += delta;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    saveCart();
    return true;
}

/**
 * Set item quantity directly
 * @param {number} index - Item index in cart
 * @param {number} quantity - New quantity
 * @returns {boolean} Success status
 */
export function setQuantity(index, quantity) {
    if (index < 0 || index >= cart.length) return false;

    if (quantity <= 0) {
        cart.splice(index, 1);
    } else {
        cart[index].quantity = quantity;
    }

    saveCart();
    return true;
}

/**
 * Clear cart
 */
export function clearCart() {
    cart = [];
    saveCart();
}

/**
 * Get cart item by product ID
 * @param {string} productId - Product ID
 * @returns {Object|null} Cart item or null
 */
export function getCartItem(productId) {
    return cart.find(item => item.id === productId) || null;
}

/**
 * Check if product is in cart
 * @param {string} productId - Product ID
 * @returns {boolean}
 */
export function isInCart(productId) {
    return cart.some(item => item.id === productId);
}

/**
 * Get quantity of product in cart
 * @param {string} productId - Product ID
 * @returns {number} Quantity (0 if not in cart)
 */
export function getProductQuantity(productId) {
    const item = getCartItem(productId);
    return item ? item.quantity : 0;
}
