/**
 * Product Renderer Module
 * Handles rendering of products in the store
 */

import { CATEGORY_ICONS } from '../config/constants.js';
import { formatCurrency, truncateText, calculateDiscount } from '../utils/formatters.js';
import { setHTML, setText, createEmptyState, createLoadingSpinner } from '../utils/dom.js';

/**
 * Render products grid
 * @param {Array} products - Array of products
 * @param {Function} onProductClick - Click handler for product
 * @param {Function} onQuickAdd - Quick add handler
 * @param {Function} onWishlist - Wishlist handler
 */
export function renderProducts(products, { onProductClick, onQuickAdd, onWishlist, favoriteIds = [] }) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = createEmptyState(
            'fa-search',
            'Nenhum produto encontrado',
            'Tente ajustar os filtros ou buscar por outro termo'
        );
        setText('products-count', '0 produtos');
        return;
    }

    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    products.forEach(product => {
        const card = createProductCard(product, { onProductClick, onQuickAdd, onWishlist, favoriteIds });
        fragment.appendChild(card);
    });
    grid.appendChild(fragment);

    setText('products-count', `${products.length} produtos`);
}

/**
 * Create product card element
 * @param {Object} product - Product data
 * @param {Object} handlers - Event handlers
 * @returns {HTMLElement} Product card element
 */
function createProductCard(product, { onProductClick, onQuickAdd, onWishlist, favoriteIds }) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => onProductClick(product);

    const priceHTML = createPriceHTML(product);
    const discount = calculateDiscount(product.preco, product.precoPromocional);

    const isFavorite = favoriteIds.includes(product.id);
    card.innerHTML = `
        <div class="product-image">
            ${product.imagem ?
                `<img src="${product.imagem}" alt="${product.nome}" loading="lazy"
                    onerror="this.src='https://via.placeholder.com/300x300?text=Sem+Imagem'">` :
                '<div class="placeholder-image"><i class="fas fa-image"></i></div>'}
            ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
            <button class="wishlist-btn${isFavorite ? ' is-active' : ''}" data-product-id="${product.id}" onclick="event.stopPropagation();">
                <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
            </button>
        </div>
        <div class="product-details">
            <span class="product-category">${product.categoria || 'Geral'}</span>
            <h3 class="product-name">${product.nome}</h3>
            <p class="product-description">${truncateText(product.descricao, 60)}</p>
            ${product.caracteristicas ? `<p class="product-detail-info"><i class="fas fa-list-ul"></i> ${truncateText(product.caracteristicas, 50)}</p>` : ''}
            ${product.curiosidades ? `<p class="product-detail-info"><i class="fas fa-lightbulb"></i> ${truncateText(product.curiosidades, 50)}</p>` : ''}
            ${product.harmonizacao ? `<p class="product-detail-info"><i class="fas fa-utensils"></i> ${truncateText(product.harmonizacao, 50)}</p>` : ''}
            <div class="product-price">${priceHTML}</div>
            <div class="product-footer">
                ${createStockHTML(product.estoque)}
                <button class="quick-add-btn" onclick="event.stopPropagation();">
                    <i class="fas fa-cart-plus"></i>
                </button>
            </div>
        </div>
    `;

    // Add event listeners
    const wishlistBtn = card.querySelector('.wishlist-btn');
    wishlistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onWishlist(product.id, wishlistBtn);
    });

    const quickAddBtn = card.querySelector('.quick-add-btn');
    quickAddBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onQuickAdd(product.id);
    });

    return card;
}

/**
 * Create price HTML
 * @param {Object} product - Product data
 * @returns {string} Price HTML
 */
function createPriceHTML(product) {
    const price = formatCurrency(product.preco);
    const promoPrice = product.precoPromocional ? formatCurrency(product.precoPromocional) : null;

    if (promoPrice) {
        return `
            <span class="original-price">${price}</span>
            <span class="promo-price">${promoPrice}</span>
        `;
    }

    return `<span class="price">${price}</span>`;
}

/**
 * Create stock status HTML
 * @param {number} stock - Stock quantity
 * @returns {string} Stock HTML
 */
function createStockHTML(stock) {
    if (stock > 0) {
        if (stock <= 5) {
            return `<span class="stock low-stock"><i class="fas fa-fire"></i> Ultimas ${stock} unidades</span>`;
        }
        return `<span class="stock in-stock"><i class="fas fa-check-circle"></i> Em estoque</span>`;
    }
    return `<span class="stock out-of-stock"><i class="fas fa-times-circle"></i> Indisponivel</span>`;
}

/**
 * Render categories bar
 * @param {Set} categories - Set of category names
 * @param {Function} onCategoryClick - Click handler
 */
export function renderCategories(categories, onCategoryClick) {
    const container = document.getElementById('categories-list');
    if (!container) return;

    let html = `
        <button class="category-chip active" data-category="">
            <i class="fas fa-th-large"></i>
            <span>Todos</span>
        </button>
    `;

    categories.forEach(category => {
        const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
        html += `
            <button class="category-chip" data-category="${category}">
                <i class="fas ${icon}"></i>
                <span>${category}</span>
            </button>
        `;
    });

    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const category = chip.dataset.category;

            // Update active state
            container.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            onCategoryClick(category);
        });
    });
}

/**
 * Update category dropdown
 * @param {Set} categories - Set of category names
 */
export function updateCategoryDropdown(categories) {
    const select = document.getElementById('categoria-filter');
    if (!select) return;

    select.innerHTML = '<option value="">Todas as Categorias</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
}

/**
 * Show products loading state
 */
export function showProductsLoading() {
    setHTML('products-grid', createLoadingSpinner('Carregando produtos...'));
}

/**
 * Update store statistics
 * @param {number} totalProducts - Total products count
 * @param {number} totalCategories - Total categories count
 */
export function updateStoreStats(totalProducts, totalCategories) {
    setText('total-products', totalProducts.toString());
    setText('total-categories', totalCategories.toString());
}
