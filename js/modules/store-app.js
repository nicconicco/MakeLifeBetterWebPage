/**
 * Store Application Module
 * Main entry point for the store functionality
 */

// Services
import {
    initAuthListener,
    login,
    register,
    logout,
    getCurrentUser,
    getCurrentUserData,
    isCurrentUserAdmin,
    isLoggedIn,
    updateUserProfile,
    updateUserPassword,
    getAuthErrorMessage
} from '../services/auth.service.js';

import {
    getAllProducts,
    extractCategories,
    filterProducts,
    getEffectivePrice
} from '../services/product.service.js';
import { getAllBanners } from '../services/banner.service.js';

import {
    initCart,
    getCartItems,
    getCartCount,
    getCartSubtotal,
    addToCart as addToCartService,
    removeFromCart as removeFromCartService,
    updateQuantity,
    clearCart,
    isCartEmpty
} from '../services/cart.service.js';

import {
    createOrder,
    buildOrderData,
    getOrdersByUserId
} from '../services/order.service.js';

// Modules
import {
    renderProducts,
    renderCategories,
    updateCategoryDropdown,
    showProductsLoading,
    updateStoreStats
} from './product-renderer.js';

import {
    renderCart,
    updateCartCount,
    openCartSidebar,
    closeCartSidebar
} from './cart-renderer.js';

import {
    initCheckout,
    openCheckoutModal,
    closeCheckoutModal,
    showStep,
    goToPaymentStep,
    goToAddressStep,
    selectShipping,
    selectPaymentMethod,
    updateOrderSummary,
    validatePaymentForm,
    getCheckoutFormData,
    displayOrderConfirmation,
    getSelectedShipping
} from './checkout.js';

// Utils
import {
    showToast,
    openModal,
    closeModal,
    setupModalClickOutside,
    setupEscapeKey,
    setupClickOutside,
    getElement,
    setText
} from '../utils/dom.js';

import {
    formatDate,
    formatCEP,
    formatCardNumber,
    formatCardExpiry
} from '../utils/formatters.js';

// Constants
import {
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    ORDER_STATUS_LABELS,
    TOAST_TYPES
} from '../config/constants.js';

/**
 * Application state
 */
let allProducts = [];
let categories = new Set();
let isRegisterMode = false;
let heroCarouselTimer = null;
let heroSlides = [];
let heroIndex = 0;
let heroControlsBound = false;

/**
 * Initialize store application
 */
export function initStoreApp() {
    // Initialize services
    initAuthListener(handleAuthStateChange);
    initCart(handleCartChange);
    initCheckout();

    // Load data
    loadProducts();

    // Setup UI
    setupEventListeners();
    setupGlobalHandlers();
    initThemeToggle();
}

/**
 * Handle auth state changes
 * @param {Object} user - Firebase user
 * @param {Object} userData - User data from Firestore
 */
function handleAuthStateChange(user, userData) {
    if (user) {
        updateUIForLoggedUser(userData);
    } else {
        updateUIForGuest();
    }
}

/**
 * Handle cart changes
 * @param {Array} cartItems - Cart items
 */
function handleCartChange(cartItems) {
    updateCartCount(getCartCount());
}

/**
 * Load products from Firebase
 */
async function loadProducts() {
    showProductsLoading();

    try {
        allProducts = await getAllProducts(true); // Active only
        categories = extractCategories(allProducts);
        let banners = [];
        try {
            banners = await getAllBanners();
        } catch (error) {
            console.warn('Nao foi possivel carregar banners:', error);
        }

        // Update UI
        updateStoreStats(allProducts.length, categories.size);
        updateCategoryDropdown(categories);
        renderCategories(categories, handleCategoryFilter);
        renderProductsWithHandlers(allProducts);
        const bannerItems = banners.filter(banner => banner?.imageUrl);
        const heroItems = bannerItems.length > 0
            ? bannerItems.map(banner => ({
                imageUrl: banner.imageUrl,
                nome: banner.originalName || 'Banner'
            }))
            : allProducts;
        initHeroCarousel(heroItems);

    } catch (error) {
        console.error('Error loading products:', error);
        showToast(ERROR_MESSAGES.ORDER.LOAD_FAILED, TOAST_TYPES.ERROR);
    }
}

/**
 * Render products with event handlers
 * @param {Array} products - Products to render
 */
function renderProductsWithHandlers(products) {
    renderProducts(products, {
        onProductClick: openProductModal,
        onQuickAdd: handleQuickAdd,
        onWishlist: handleWishlist
    });
}

/**
 * Initialize hero carousel with product images
 * @param {Array} products - Products array
 */
function initHeroCarousel(products) {
    const track = getElement('hero-carousel-track');
    if (!track) return;

    bindHeroControls();

    const carousel = track.parentElement;
    const slidesData = (products || [])
        .filter(item => item?.imageUrl || item?.imagem)
        .slice(0, 8);

    if (carousel) {
        carousel.classList.toggle('is-empty', slidesData.length === 0);
    }

    toggleHeroControls(slidesData.length > 1);

    if (slidesData.length === 0) {
        track.innerHTML = '';
        heroSlides = [];
        heroIndex = 0;
        stopHeroCarousel();
        return;
    }

    const escapeHtml = (value = '') => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    track.innerHTML = slidesData.map((item, index) => {
        const imageUrl = item.imageUrl || item.imagem;
        const label = item.nome || item.titulo || item.originalName || 'Banner';
        return `
        <div class="hero-slide${index === 0 ? ' is-active' : ''}"
             role="img"
             aria-label="${escapeHtml(label)}"
             style="background-image: url('${escapeHtml(imageUrl)}');">
        </div>
    `;
    }).join('');

    heroSlides = Array.from(track.querySelectorAll('.hero-slide'));
    heroIndex = 0;

    if (heroSlides.length < 2) {
        toggleHeroControls(false);
        stopHeroCarousel();
        return;
    }

    startHeroCarousel();
}

function bindHeroControls() {
    if (heroControlsBound) return;

    const prevBtn = getElement('hero-carousel-prev');
    const nextBtn = getElement('hero-carousel-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            advanceHeroSlide(-1);
            restartHeroCarousel();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            advanceHeroSlide(1);
            restartHeroCarousel();
        });
    }

    heroControlsBound = true;
}

function toggleHeroControls(show) {
    const prevBtn = getElement('hero-carousel-prev');
    const nextBtn = getElement('hero-carousel-next');
    if (prevBtn) prevBtn.classList.toggle('is-hidden', !show);
    if (nextBtn) nextBtn.classList.toggle('is-hidden', !show);
}

function startHeroCarousel() {
    stopHeroCarousel();

    if (heroSlides.length < 2) return;

    heroCarouselTimer = setInterval(() => {
        advanceHeroSlide(1);
    }, 5000);
}

function stopHeroCarousel() {
    if (heroCarouselTimer) {
        clearInterval(heroCarouselTimer);
        heroCarouselTimer = null;
    }
}

function restartHeroCarousel() {
    startHeroCarousel();
}

function advanceHeroSlide(step) {
    if (heroSlides.length < 2) return;

    const nextIndex = (heroIndex + step + heroSlides.length) % heroSlides.length;
    const current = heroSlides[heroIndex];
    const next = heroSlides[nextIndex];

    if (!current || !next || current === next) return;

    heroSlides.forEach(slide => slide.classList.remove('is-prev', 'is-next'));

    if (step < 0) {
        next.classList.add('is-next');
        void next.offsetWidth;
    }

    current.classList.remove('is-active');

    if (step > 0) {
        current.classList.add('is-prev');
    }

    next.classList.add('is-active');

    const cleanup = () => {
        current.classList.remove('is-prev');
        next.classList.remove('is-next');
        next.removeEventListener('transitionend', cleanup);
        clearTimeout(fallbackTimer);
    };

    const fallbackTimer = setTimeout(() => {
        current.classList.remove('is-prev');
        next.classList.remove('is-next');
    }, 950);

    next.addEventListener('transitionend', cleanup);
    heroIndex = nextIndex;
}

/**
 * Handle category filter
 * @param {string} category - Selected category
 */
function handleCategoryFilter(category) {
    const categorySelect = getElement('categoria-filter');
    if (categorySelect) {
        categorySelect.value = category;
    }
    filterAndRenderProducts();
}

/**
 * Filter and render products
 */
function filterAndRenderProducts() {
    const searchTerm = getElement('search-input')?.value || '';
    const category = getElement('categoria-filter')?.value || '';
    const sortBy = getElement('ordenar-filter')?.value || 'recentes';

    const filtered = filterProducts(allProducts, { searchTerm, category, sortBy });
    renderProductsWithHandlers(filtered);
}

/**
 * Handle quick add to cart
 * @param {string} productId - Product ID
 */
function handleQuickAdd(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        addToCartService(product);
        showToast(SUCCESS_MESSAGES.CART.ADDED, TOAST_TYPES.SUCCESS);
    }
}

/**
 * Handle add to wishlist
 * @param {string} productId - Product ID
 */
function handleWishlist(productId) {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
    showToast(SUCCESS_MESSAGES.WISHLIST.ADDED, TOAST_TYPES.SUCCESS);
}

/**
 * Open product modal
 * @param {Object} product - Product data
 */
function openProductModal(product) {
    const modalBody = getElement('modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = createProductModalContent(product);
    openModal('product-modal');

    // Add event listeners for modal buttons
    const buyBtn = modalBody.querySelector('.btn-buy');
    if (buyBtn) {
        buyBtn.addEventListener('click', () => handleBuyNow(product));
    }

    const cartBtn = modalBody.querySelector('.btn-cart');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            handleQuickAdd(product.id);
            closeModal('product-modal');
        });
    }

    const notifyBtn = modalBody.querySelector('.btn-notify');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', () => handleNotifyAvailable(product.id));
    }
}

/**
 * Create product modal content
 * @param {Object} product - Product data
 * @returns {string} HTML content
 */
function createProductModalContent(product) {
    const price = product.preco ? `R$ ${product.preco.toFixed(2)}` : '';
    const promoPrice = product.precoPromocional ? `R$ ${product.precoPromocional.toFixed(2)}` : null;
    const discount = product.precoPromocional && product.preco ?
        Math.round((1 - product.precoPromocional / product.preco) * 100) : 0;

    return `
        <div class="modal-product">
            <div class="modal-image">
                ${product.imagem ?
                    `<img src="${product.imagem}" alt="${product.nome}"
                        onerror="this.src='https://via.placeholder.com/500x500?text=Sem+Imagem'">` :
                    '<div class="placeholder-image large"><i class="fas fa-image"></i></div>'}
                ${discount > 0 ? `<span class="discount-badge large">-${discount}%</span>` : ''}
            </div>
            <div class="modal-info">
                <span class="modal-category">${product.categoria || 'Geral'}</span>
                <h2 class="modal-title">${product.nome}</h2>
                <p class="modal-description">${product.descricao || 'Sem descricao disponivel.'}</p>

                <div class="modal-price-section">
                    ${promoPrice ?
                        `<div class="modal-prices">
                            <span class="modal-original-price">${price}</span>
                            <span class="modal-promo-price">${promoPrice}</span>
                            <span class="modal-discount">Economia de ${discount}%</span>
                        </div>` :
                        `<span class="modal-price">${price}</span>`}
                </div>

                <div class="modal-stock">
                    ${product.estoque > 0 ?
                        `<span class="stock-status available"><i class="fas fa-check-circle"></i> Disponivel - ${product.estoque} unidades em estoque</span>` :
                        '<span class="stock-status unavailable"><i class="fas fa-times-circle"></i> Produto indisponivel no momento</span>'}
                </div>

                <div class="modal-actions">
                    ${product.estoque > 0 ?
                        `<button class="btn-buy">
                            <i class="fas fa-bolt"></i>
                            <span>Comprar Agora</span>
                        </button>
                        <button class="btn-cart">
                            <i class="fas fa-cart-plus"></i>
                            <span>Adicionar ao Carrinho</span>
                        </button>` :
                        `<button class="btn-notify">
                            <i class="fas fa-bell"></i>
                            <span>Avise-me quando disponivel</span>
                        </button>`}
                </div>

                <div class="modal-extras">
                    <div class="extra-item">
                        <i class="fas fa-truck"></i>
                        <span>Frete gratis acima de R$ 199</span>
                    </div>
                    <div class="extra-item">
                        <i class="fas fa-shield-alt"></i>
                        <span>Garantia de 30 dias</span>
                    </div>
                    <div class="extra-item">
                        <i class="fas fa-undo"></i>
                        <span>Devolucao facil</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Handle buy now
 * @param {Object} product - Product data
 */
function handleBuyNow(product) {
    if (!isLoggedIn()) {
        showLoginModal();
        showToast('Faca login para continuar a compra', TOAST_TYPES.INFO);
        return;
    }

    addToCartService(product);
    closeModal('product-modal');
    goToCheckout();
}

/**
 * Handle notify when available
 * @param {string} productId - Product ID
 */
function handleNotifyAvailable(productId) {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }
    showToast('Voce sera notificado quando o produto estiver disponivel!', TOAST_TYPES.SUCCESS);
    closeModal('product-modal');
}

// ============================================
// CART HANDLERS
// ============================================

/**
 * Show cart sidebar
 */
export function showCart() {
    openCartSidebar();
    renderCart(getCartItems(), {
        onUpdateQuantity: (index, delta) => {
            updateQuantity(index, delta);
            renderCart(getCartItems(), {
                onUpdateQuantity: arguments.callee.caller.arguments[0].onUpdateQuantity,
                onRemoveItem: arguments.callee.caller.arguments[0].onRemoveItem
            });
        },
        onRemoveItem: (index) => {
            const item = removeFromCartService(index);
            if (item) {
                showToast(`${item.nome} ${SUCCESS_MESSAGES.CART.REMOVED}`, TOAST_TYPES.INFO);
            }
            renderCart(getCartItems(), {
                onUpdateQuantity: arguments.callee.caller.arguments[0].onUpdateQuantity,
                onRemoveItem: arguments.callee.caller.arguments[0].onRemoveItem
            });
        }
    });
}

/**
 * Close cart
 */
export function closeCart() {
    closeCartSidebar();
}

// ============================================
// CHECKOUT HANDLERS
// ============================================

/**
 * Go to checkout
 */
export function goToCheckout() {
    if (!isLoggedIn()) {
        showLoginModal();
        showToast('Faca login para finalizar a compra', TOAST_TYPES.INFO);
        return;
    }

    if (isCartEmpty()) {
        showToast(ERROR_MESSAGES.CART.EMPTY, TOAST_TYPES.WARNING);
        return;
    }

    closeCartSidebar();
    openCheckoutModal();
    updateOrderSummary(getCartItems());
}

/**
 * Process payment
 */
export async function processPayment() {
    if (!validatePaymentForm()) {
        return;
    }

    showToast('Processando pagamento...', TOAST_TYPES.INFO);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create order
    const user = getCurrentUser();
    const formData = getCheckoutFormData();
    const cartItems = getCartItems();
    const subtotal = getCartSubtotal();

    const orderData = buildOrderData({
        userId: user.uid,
        userEmail: user.email,
        cartItems,
        address: formData.address,
        shipping: formData.shipping,
        payment: formData.payment,
        subtotal,
        shippingCost: formData.shipping.price
    });

    try {
        const order = await createOrder(orderData);
        displayOrderConfirmation(order);
        clearCart();
        showToast('Pedido realizado com sucesso!', TOAST_TYPES.SUCCESS);
    } catch (error) {
        console.error('Error creating order:', error);
        showToast(ERROR_MESSAGES.ORDER.CREATE_FAILED, TOAST_TYPES.ERROR);
    }
}

// ============================================
// AUTH HANDLERS
// ============================================

/**
 * Show login modal
 */
export function showLoginModal() {
    isRegisterMode = false;
    updateLoginModalUI();
    openModal('login-modal');
}

/**
 * Close login modal
 */
export function closeLoginModal() {
    closeModal('login-modal');
    getElement('login-email').value = '';
    getElement('login-password').value = '';
}

/**
 * Toggle register mode
 */
export function toggleRegisterMode() {
    isRegisterMode = !isRegisterMode;
    updateLoginModalUI();
}

/**
 * Update login modal UI
 */
function updateLoginModalUI() {
    setText('login-title', isRegisterMode ? 'Criar Conta' : 'Entrar');
    setText('login-subtitle', isRegisterMode
        ? 'Preencha os dados para se cadastrar'
        : 'Acesse sua conta para continuar');

    const submitBtn = getElement('login-submit-btn');
    if (submitBtn) {
        submitBtn.innerHTML = isRegisterMode
            ? '<span>Cadastrar</span><i class="fas fa-arrow-right"></i>'
            : '<span>Entrar</span><i class="fas fa-arrow-right"></i>';
    }

    setText('toggle-register-text', isRegisterMode ? 'Ja tenho uma conta' : 'Criar nova conta');
}

/**
 * Handle login form submission
 * @param {Event} event - Form event
 */
export async function handleLogin(event) {
    event.preventDefault();

    const email = getElement('login-email')?.value;
    const password = getElement('login-password')?.value;
    const submitBtn = getElement('login-submit-btn');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    try {
        if (isRegisterMode) {
            await register(email, password);
            showToast(SUCCESS_MESSAGES.AUTH.REGISTER, TOAST_TYPES.SUCCESS);
        } else {
            await login(email, password);
            showToast(SUCCESS_MESSAGES.AUTH.LOGIN, TOAST_TYPES.SUCCESS);
        }
        closeLoginModal();
    } catch (error) {
        console.error('Auth error:', error);
        showToast(getAuthErrorMessage(error), TOAST_TYPES.ERROR);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            updateLoginModalUI();
        }
    }
}

/**
 * Handle logout
 */
export async function handleLogout() {
    try {
        await logout();
        showToast(SUCCESS_MESSAGES.AUTH.LOGOUT, TOAST_TYPES.INFO);
        getElement('user-dropdown')?.classList.remove('show');
    } catch (error) {
        showToast('Erro ao sair. Tente novamente.', TOAST_TYPES.ERROR);
    }
}

/**
 * Update UI for logged user
 * @param {Object} userData - User data
 */
function updateUIForLoggedUser(userData) {
    const loginBtn = getElement('login-btn');
    const userArea = getElement('user-area');

    if (loginBtn) loginBtn.style.display = 'none';
    if (userArea) userArea.style.display = 'flex';

    const displayName = userData?.username || getCurrentUser()?.email?.split('@')[0] || 'Usuario';
    setText('user-display-name', displayName);

    const isAdmin = isCurrentUserAdmin();
    const adminLink = getElement('admin-link');
    if (adminLink) {
        adminLink.style.display = isAdmin ? 'block' : 'none';
    }
}

/**
 * Update UI for guest
 */
function updateUIForGuest() {
    const loginBtn = getElement('login-btn');
    const userArea = getElement('user-area');

    if (loginBtn) loginBtn.style.display = 'flex';
    if (userArea) userArea.style.display = 'none';
}

// ============================================
// PROFILE HANDLERS
// ============================================

/**
 * Show profile modal
 */
export function showProfile() {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }

    getElement('user-dropdown')?.classList.remove('show');
    openModal('profile-modal');

    const user = getCurrentUser();
    const userData = getCurrentUserData();

    const displayName = userData?.username || user.email.split('@')[0];
    setText('profile-name', displayName);
    setText('profile-email', user.email);

    const usernameInput = getElement('profile-username');
    if (usernameInput) usernameInput.value = userData?.username || '';

    const emailInput = getElement('profile-display-email');
    if (emailInput) emailInput.value = user.email;

    const isAdmin = isCurrentUserAdmin();
    const badge = getElement('profile-badge');
    if (badge) {
        badge.textContent = isAdmin ? 'Administrador' : 'Usuario';
        badge.className = 'profile-badge ' + (isAdmin ? 'admin' : 'user');
    }

    if (userData?.createdAt) {
        setText('profile-created-at', formatDate(userData.createdAt));
    }
}

/**
 * Close profile modal
 */
export function closeProfileModal() {
    closeModal('profile-modal');
    const passwordInput = getElement('profile-new-password');
    if (passwordInput) passwordInput.value = '';
}

/**
 * Handle profile update
 * @param {Event} event - Form event
 */
export async function handleUpdateProfile(event) {
    event.preventDefault();

    if (!isLoggedIn()) return;

    const newUsername = getElement('profile-username')?.value.trim();
    const newPassword = getElement('profile-new-password')?.value;
    const userData = getCurrentUserData();

    try {
        if (newUsername && newUsername !== userData?.username) {
            await updateUserProfile({ username: newUsername });
            setText('user-display-name', newUsername);
            setText('profile-name', newUsername);
        }

        if (newPassword) {
            if (newPassword.length < 6) {
                showToast('A senha deve ter pelo menos 6 caracteres.', TOAST_TYPES.ERROR);
                return;
            }
            await updateUserPassword(newPassword);
        }

        showToast(SUCCESS_MESSAGES.PROFILE.UPDATED, TOAST_TYPES.SUCCESS);
        closeProfileModal();
    } catch (error) {
        console.error('Profile update error:', error);
        showToast(getAuthErrorMessage(error), TOAST_TYPES.ERROR);
    }
}

// ============================================
// ORDERS HANDLERS
// ============================================

/**
 * Show orders modal
 */
export async function showOrders() {
    getElement('user-dropdown')?.classList.remove('show');
    openModal('orders-modal');
    await loadUserOrders();
}

/**
 * Close orders modal
 */
export function closeOrdersModal() {
    closeModal('orders-modal');
}

/**
 * Load user orders
 */
async function loadUserOrders() {
    const listContainer = getElement('orders-list');
    const emptyContainer = getElement('orders-empty');

    if (!listContainer) return;

    listContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando pedidos...</p>
        </div>
    `;

    if (emptyContainer) emptyContainer.style.display = 'none';

    if (!isLoggedIn()) {
        listContainer.innerHTML = '';
        if (emptyContainer) emptyContainer.style.display = 'flex';
        return;
    }

    try {
        const user = getCurrentUser();
        const orders = await getOrdersByUserId(user.uid);

        if (orders.length === 0) {
            listContainer.innerHTML = '';
            if (emptyContainer) emptyContainer.style.display = 'flex';
            return;
        }

        if (emptyContainer) emptyContainer.style.display = 'none';
        renderOrders(orders, listContainer);

    } catch (error) {
        console.error('Error loading orders:', error);
        listContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${ERROR_MESSAGES.ORDER.LOAD_FAILED}</p>
            </div>
        `;
    }
}

/**
 * Render orders list
 * @param {Array} orders - Orders array
 * @param {HTMLElement} container - Container element
 */
function renderOrders(orders, container) {
    const html = orders.map(order => {
        const orderNumber = order.id.substring(0, 8).toUpperCase();
        const date = formatDate(order.createdAt);
        const status = ORDER_STATUS_LABELS[order.status] || ORDER_STATUS_LABELS.pending;
        const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

        return `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-number-date">
                        <span class="order-number">#${orderNumber}</span>
                        <span class="order-date">${date}</span>
                    </div>
                    <span class="status-badge ${status.class}">${status.label}</span>
                </div>
                <div class="order-items-preview">
                    ${order.items.slice(0, 3).map(item =>
                        `<span class="order-item-name">${item.quantity}x ${item.nome}</span>`
                    ).join('')}
                    ${order.items.length > 3 ? `<span class="more-items">+${order.items.length - 3} itens</span>` : ''}
                </div>
                <div class="order-footer">
                    <span class="order-total">Total: R$ ${order.total.toFixed(2)}</span>
                    <span class="order-items-count">${itemsCount} ${itemsCount === 1 ? 'item' : 'itens'}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search and filters
    const searchInput = getElement('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', filterAndRenderProducts);
    }

    const categoryFilter = getElement('categoria-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterAndRenderProducts);
    }

    const sortFilter = getElement('ordenar-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', filterAndRenderProducts);
    }
}

/**
 * Setup global handlers
 */
function setupGlobalHandlers() {
    const modalIds = ['product-modal', 'login-modal', 'profile-modal', 'checkout-modal', 'orders-modal'];

    setupModalClickOutside(modalIds);

    setupEscapeKey(() => {
        closeCartSidebar();
        modalIds.forEach(id => closeModal(id));
    });

    setupClickOutside('user-menu', 'user-dropdown');
}

function initThemeToggle() {
    const toggle = getElement('theme-toggle');
    if (!toggle) return;

    const storedTheme = localStorage.getItem('mlb_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');

    applyTheme(initialTheme, false);

    toggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || initialTheme;
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme, true);
    });
}

function applyTheme(theme, persist) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) {
        localStorage.setItem('mlb_theme', theme);
    }
    updateThemeToggle(theme);
}

function updateThemeToggle(theme) {
    const toggle = getElement('theme-toggle');
    if (!toggle) return;

    const icon = toggle.querySelector('i');
    const label = toggle.querySelector('.theme-toggle-text');
    const isDark = theme === 'dark';

    if (icon) {
        icon.classList.toggle('fa-moon', !isDark);
        icon.classList.toggle('fa-sun', isDark);
    }

    if (label) {
        label.textContent = isDark ? 'Claro' : 'Escuro';
    }

    toggle.setAttribute('aria-label', isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro');
}

// ============================================
// GLOBAL EXPORTS (for HTML onclick handlers)
// ============================================

// Make functions available globally
window.showCart = showCart;
window.closeCart = closeCart;
window.goToCheckout = goToCheckout;
window.processPayment = processPayment;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.toggleRegisterMode = toggleRegisterMode;
window.handleLogin = handleLogin;
window.doLogout = handleLogout;
window.showProfile = showProfile;
window.closeProfileModal = closeProfileModal;
window.updateProfile = handleUpdateProfile;
window.showOrders = showOrders;
window.closeOrdersModal = closeOrdersModal;
window.closeProductModal = () => closeModal('product-modal');
window.closeCheckoutModal = closeCheckoutModal;
window.goToPaymentStep = goToPaymentStep;
window.goToAddressStep = goToAddressStep;
window.selectShipping = selectShipping;
window.selectPaymentMethod = selectPaymentMethod;
window.toggleUserDropdown = () => getElement('user-dropdown')?.classList.toggle('show');
window.goToAdmin = () => window.location.href = 'index.html';
window.filterStoreProducts = filterAndRenderProducts;
window.viewMyOrders = () => { closeCheckoutModal(); showOrders(); };
window.continueShopping = closeCheckoutModal;
window.formatCEP = (input) => { input.value = formatCEP(input.value); };
window.formatCardNumber = (input) => { input.value = formatCardNumber(input.value); };
window.formatExpiry = (input) => { input.value = formatCardExpiry(input.value); };
window.updateCardPreview = () => {};
window.calculateShipping = () => {};
