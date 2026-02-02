/**
 * Order Service
 * Handles all order-related Firebase operations
 */

import { db } from '../config/firebase.config.js';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { COLLECTIONS, ORDER_STATUS } from '../config/constants.js';

/**
 * Create new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Created order with ID
 */
export async function createOrder(orderData) {
    const dataWithTimestamp = {
        ...orderData,
        status: ORDER_STATUS.PENDING,
        createdAt: Date.now()
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), dataWithTimestamp);
    return { id: docRef.id, ...dataWithTimestamp };
}

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object|null>} Order data or null
 */
export async function getOrderById(orderId) {
    const docSnap = await getDoc(doc(db, COLLECTIONS.ORDERS, orderId));
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
}

/**
 * Get orders by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of orders
 */
export async function getOrdersByUserId(userId) {
    const q = query(
        collection(db, COLLECTIONS.ORDERS),
        where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const orders = [];

    querySnapshot.forEach(docSnap => {
        orders.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort by creation date (newest first)
    orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return orders;
}

/**
 * Get all orders (admin)
 * @returns {Promise<Array>} Array of all orders
 */
export async function getAllOrders() {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
    const orders = [];

    querySnapshot.forEach(docSnap => {
        orders.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Sort by creation date (newest first)
    orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return orders;
}

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 */
export async function updateOrderStatus(orderId, status) {
    await updateDoc(doc(db, COLLECTIONS.ORDERS, orderId), {
        status,
        updatedAt: Date.now()
    });
}

/**
 * Build order data object
 * @param {Object} params - Order parameters
 * @returns {Object} Order data object
 */
export function buildOrderData({
    userId,
    userEmail,
    cartItems,
    address,
    shipping,
    payment,
    subtotal,
    shippingCost
}) {
    return {
        userId,
        userEmail,
        items: cartItems.map(item => ({
            productId: item.id,
            nome: item.nome,
            preco: item.precoPromocional || item.preco,
            quantity: item.quantity
        })),
        address,
        shipping,
        payment,
        subtotal,
        shippingCost,
        total: subtotal + shippingCost
    };
}

/**
 * Calculate estimated delivery date
 * @param {string} shippingType - Shipping type
 * @returns {Date} Estimated delivery date
 */
export function calculateDeliveryDate(shippingType) {
    const date = new Date();
    const daysToAdd = {
        'sameday': 0,
        'express': 3,
        'normal': 8
    };

    date.setDate(date.getDate() + (daysToAdd[shippingType] || 8));
    return date;
}

/**
 * Calculate order totals
 * @param {Array} cartItems - Cart items
 * @param {number} shippingCost - Shipping cost
 * @returns {Object} Totals object
 */
export function calculateOrderTotals(cartItems, shippingCost = 0) {
    const subtotal = cartItems.reduce((total, item) => {
        const price = item.precoPromocional || item.preco;
        return total + (price * item.quantity);
    }, 0);

    return {
        subtotal,
        shippingCost,
        total: subtotal + shippingCost
    };
}

/**
 * Get order items count
 * @param {Array} items - Order items
 * @returns {number} Total items count
 */
export function getOrderItemsCount(items) {
    return items.reduce((sum, item) => sum + item.quantity, 0);
}
