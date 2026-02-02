/**
 * Product Service
 * Handles all product-related Firebase operations
 */

import { db } from '../config/firebase.config.js';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { COLLECTIONS } from '../config/constants.js';

/**
 * Get all products
 * @param {boolean} activeOnly - Filter only active products
 * @returns {Promise<Array>} Array of products
 */
export async function getAllProducts(activeOnly = false) {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));

    const products = [];
    querySnapshot.forEach((docSnap) => {
        const product = { id: docSnap.id, ...docSnap.data() };
        if (!activeOnly || product.ativo !== false) {
            products.push(product);
        }
    });

    // Sort by creation date (newest first)
    products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return products;
}

/**
 * Get product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object|null>} Product data or null
 */
export async function getProductById(productId) {
    const docSnap = await getDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
}

/**
 * Create new product
 * @param {Object} productData - Product data
 * @returns {Promise<string>} New product ID
 */
export async function createProduct(productData) {
    const dataWithTimestamp = {
        ...productData,
        createdAt: Date.now(),
        ativo: productData.ativo !== false
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTS), dataWithTimestamp);
    return docRef.id;
}

/**
 * Update product
 * @param {string} productId - Product ID
 * @param {Object} productData - Data to update
 */
export async function updateProduct(productId, productData) {
    await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), {
        ...productData,
        updatedAt: Date.now()
    });
}

/**
 * Delete product
 * @param {string} productId - Product ID
 */
export async function deleteProduct(productId) {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
}

/**
 * Toggle product active status
 * @param {string} productId - Product ID
 * @param {boolean} isActive - New active status
 */
export async function toggleProductStatus(productId, isActive) {
    await updateDoc(doc(db, COLLECTIONS.PRODUCTS, productId), {
        ativo: isActive,
        updatedAt: Date.now()
    });
}

/**
 * Get unique categories from products
 * @param {Array} products - Array of products
 * @returns {Set} Set of category names
 */
export function extractCategories(products) {
    const categories = new Set();
    products.forEach(product => {
        if (product.categoria) {
            categories.add(product.categoria);
        }
    });
    return categories;
}

/**
 * Filter products by criteria
 * @param {Array} products - Array of products
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered products
 */
export function filterProducts(products, { searchTerm = '', category = '', sortBy = 'recentes' }) {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p =>
            (p.nome && p.nome.toLowerCase().includes(term)) ||
            (p.descricao && p.descricao.toLowerCase().includes(term)) ||
            (p.categoria && p.categoria.toLowerCase().includes(term))
        );
    }

    // Category filter
    if (category) {
        filtered = filtered.filter(p => p.categoria === category);
    }

    // Sort
    switch (sortBy) {
        case 'preco-menor':
            filtered.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
            break;
        case 'preco-maior':
            filtered.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
            break;
        case 'nome':
            filtered.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
            break;
        default: // recentes
            filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return filtered;
}

/**
 * Get effective price (promotional or regular)
 * @param {Object} product - Product object
 * @returns {number} Effective price
 */
export function getEffectivePrice(product) {
    return product.precoPromocional || product.preco || 0;
}

/**
 * Create example products for demo
 * @returns {Array} Array of example products
 */
export function getExampleProducts() {
    return [
        {
            nome: 'Smartphone Galaxy Pro',
            descricao: 'Smartphone de ultima geracao com camera de 108MP e tela AMOLED de 6.7 polegadas.',
            preco: 2999.90,
            precoPromocional: 2499.90,
            categoria: 'Eletronicos',
            estoque: 50,
            imagem: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
            ativo: true
        },
        {
            nome: 'Notebook Ultra Slim',
            descricao: 'Notebook leve e potente com processador Intel i7, 16GB RAM e SSD 512GB.',
            preco: 4599.90,
            precoPromocional: null,
            categoria: 'Eletronicos',
            estoque: 25,
            imagem: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
            ativo: true
        },
        {
            nome: 'Fones Bluetooth Premium',
            descricao: 'Fones de ouvido sem fio com cancelamento de ruido ativo e 30h de bateria.',
            preco: 899.90,
            precoPromocional: 699.90,
            categoria: 'Eletronicos',
            estoque: 100,
            imagem: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
            ativo: true
        },
        {
            nome: 'Camiseta Algodao Premium',
            descricao: 'Camiseta 100% algodao organico, confortavel e sustentavel.',
            preco: 89.90,
            precoPromocional: null,
            categoria: 'Roupas',
            estoque: 200,
            imagem: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
            ativo: true
        },
        {
            nome: 'Tenis Running Sport',
            descricao: 'Tenis para corrida com tecnologia de amortecimento e respirabilidade.',
            preco: 459.90,
            precoPromocional: 359.90,
            categoria: 'Calcados',
            estoque: 75,
            imagem: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
            ativo: true
        },
        {
            nome: 'Relogio Smartwatch',
            descricao: 'Smartwatch com monitor cardiaco, GPS e resistencia a agua.',
            preco: 1299.90,
            precoPromocional: 999.90,
            categoria: 'Acessorios',
            estoque: 40,
            imagem: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
            ativo: true
        }
    ];
}
