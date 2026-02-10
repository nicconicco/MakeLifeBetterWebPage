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
    getAuthErrorMessage,
    toggleFavoriteProduct,
    removeFavoriteProduct
} from '../services/auth.service.js';

import {
    getAllProducts,
    extractCategories,
    filterProducts,
    getEffectivePrice,
    getProductById
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

import { createOrder, buildOrderData, getOrdersByUserId, getOrderById } from '../services/order.service.js';
import { createPagBankCheckout } from '../services/payment.service.js';

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
    goToPaymentStep,
    goToAddressStep,
    selectShipping,
    selectPaymentMethod,
    updateOrderSummary,
    validatePaymentForm,
    getCheckoutFormData,
    displayOrderConfirmation
} from './checkout.js';

import {
    initCommunitySections,
    updateCommunityAuthState
} from './community.js';

// Utils
import {
    showToast,
    openModal,
    closeModal,
    setupModalClickOutside,
    setupEscapeKey,
    setupClickOutside,
    getElement,
    setText,
    debounce
} from '../utils/dom.js';

import {
    formatDate,
    formatCurrency,
    formatCEP,
    formatCardNumber,
    formatCardExpiry
} from '../utils/formatters.js';
import { logError, logWarn } from '../utils/logger.js';

// Constants
import {
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    ORDER_STATUS_LABELS,
    TOAST_TYPES,
    ACTIVE_PAYMENT_PROVIDER,
    PAYMENT_PROVIDERS
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
let heroLoadingTimeout = null;
let pendingReturnOrderId = null;
let isProcessingPayment = false;
let favoriteIds = new Set();
let globalErrorHandlersBound = false;
let lastGlobalErrorAt = 0;

function setHeroLoading(isLoading) {
    const section = document.querySelector('.hero-section');
    const loader = getElement('hero-loading');

    if (section) {
        section.classList.toggle('is-loading', isLoading);
    }

    if (loader) {
        loader.setAttribute('aria-busy', isLoading ? 'true' : 'false');
        loader.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
    }
}

function startHeroLoading() {
    setHeroLoading(true);

    if (heroLoadingTimeout) {
        clearTimeout(heroLoadingTimeout);
    }

    // Fallback para não ficar preso no loading
    heroLoadingTimeout = setTimeout(() => {
        setHeroLoading(false);
    }, 6000);
}

function stopHeroLoading() {
    if (heroLoadingTimeout) {
        clearTimeout(heroLoadingTimeout);
        heroLoadingTimeout = null;
    }

    setHeroLoading(false);
}

function preloadHeroImage(imageUrl) {
    if (!imageUrl) {
        stopHeroLoading();
        return;
    }

    const img = new Image();
    img.onload = () => stopHeroLoading();
    img.onerror = () => stopHeroLoading();
    img.src = imageUrl;
}

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
    initCommunitySections();

    // Setup UI
    setupEventListeners();
    setupGlobalHandlers();
    initThemeToggle();
    updateCheckoutNote();

    pendingReturnOrderId = getPendingOrderIdFromReturn();
}

/**
 * Handle auth state changes
 * @param {Object} user - Firebase user
 * @param {Object} userData - User data from Firestore
 */
function handleAuthStateChange(user, userData) {
    if (user) {
        favoriteIds = new Set(userData?.favorites || []);
        updateUIForLoggedUser(userData);
        updateWishlistUI();
        updateCommunityAuthState(userData);
        if (pendingReturnOrderId) {
            showOrderReturn(pendingReturnOrderId);
        }
    } else {
        favoriteIds = new Set();
        updateUIForGuest();
        updateWishlistUI();
        updateCommunityAuthState(null);
        if (pendingReturnOrderId) {
            showLoginModal();
            showToast('Faca login para visualizar seu pedido.', TOAST_TYPES.INFO);
        }
    }
}

function updateCheckoutNote() {
    const noteText = getElement('checkout-note-text');
    if (!noteText) return;

    if (ACTIVE_PAYMENT_PROVIDER === PAYMENT_PROVIDERS.MOCK) {
        noteText.textContent = 'Pagamento em modo teste. Nenhuma cobranca real sera feita.';
        return;
    }

    noteText.textContent = 'Voce sera redirecionado ao PagBank para concluir o pagamento com seguranca.';
}

function setPaymentButtonLoading(isLoading) {
    const btn = getElement('checkout-pay-btn');
    if (!btn) return;

    btn.disabled = isLoading;
    btn.innerHTML = isLoading
        ? '<i class="fas fa-spinner fa-spin"></i><span>Processando...</span>'
        : '<i class="fas fa-lock"></i><span>Confirmar Pagamento</span>';
}

function getPendingOrderIdFromReturn() {
    const params = new URLSearchParams(window.location.search);
    const orderIdFromUrl = params.get('order_id');

    if (orderIdFromUrl) {
        localStorage.setItem('mlb_pending_order_id', orderIdFromUrl);
        params.delete('order_id');
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
        window.history.replaceState({}, document.title, newUrl);
        return orderIdFromUrl;
    }

    return localStorage.getItem('mlb_pending_order_id');
}

async function showOrderReturn(orderId) {
    try {
        const order = await getOrderById(orderId);
        if (order) {
            openCheckoutModal();
            displayOrderConfirmation(order);
        } else {
            showToast('Pedido criado. Aguardando confirmacao do pagamento.', TOAST_TYPES.INFO);
        }
    } catch (error) {
        logError('Erro ao carregar pedido:', error);
        showToast('Nao foi possivel carregar o pedido.', TOAST_TYPES.ERROR);
    } finally {
        pendingReturnOrderId = null;
        localStorage.removeItem('mlb_pending_order_id');
    }
}

/**
 * Handle cart changes
 * @param {Array} cartItems - Cart items
 */
function handleCartChange(cartItems) {
    updateCartCount(getCartCount());
    if (isCartSidebarOpen()) {
        renderCartSidebar();
    }
}

/**
 * Load products from Firebase
 */
async function loadProducts() {
    showProductsLoading();
    startHeroLoading();

    try {
        allProducts = await getAllProducts(true); // Active only
        categories = extractCategories(allProducts);
        let banners = [];
        try {
            banners = await getAllBanners();
        } catch (error) {
            logWarn('Nao foi possivel carregar banners:', error);
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
        logError('Error loading products:', error);
        showToast(ERROR_MESSAGES.ORDER.LOAD_FAILED, TOAST_TYPES.ERROR);
        stopHeroLoading();
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
        onWishlist: handleWishlist,
        favoriteIds: Array.from(favoriteIds)
    });
    updateWishlistUI();
}

/**
 * Initialize hero carousel with product images
 * @param {Array} products - Products array
 */
function initHeroCarousel(products) {
    const track = getElement('hero-carousel-track');
    if (!track) {
        stopHeroLoading();
        return;
    }

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
        stopHeroLoading();
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

    const firstImageUrl = slidesData[0]?.imageUrl || slidesData[0]?.imagem;
    preloadHeroImage(firstImageUrl);

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
 * Handle add/remove to wishlist
 * @param {string} productId - Product ID
 * @param {HTMLElement} buttonEl - Wishlist button
 */
async function handleWishlist(productId, buttonEl) {
    if (!isLoggedIn()) {
        showLoginModal();
        return;
    }

    try {
        const added = await toggleFavoriteProduct(productId);
        if (added) {
            favoriteIds.add(productId);
            showToast(SUCCESS_MESSAGES.WISHLIST.ADDED, TOAST_TYPES.SUCCESS);
        } else {
            favoriteIds.delete(productId);
            showToast('Produto removido dos favoritos.', TOAST_TYPES.INFO);
        }
        updateWishlistButton(buttonEl, added);
        renderProfileFavorites();
    } catch (error) {
        logError('Wishlist error:', error);
        showToast('Erro ao atualizar favoritos.', TOAST_TYPES.ERROR);
    }
}

function updateWishlistButton(buttonEl, isFavorite) {
    if (!buttonEl) return;
    buttonEl.classList.toggle('is-active', isFavorite);
    const icon = buttonEl.querySelector('i');
    if (icon) {
        icon.classList.toggle('fas', isFavorite);
        icon.classList.toggle('far', !isFavorite);
    }
}

function updateWishlistUI() {
    const buttons = document.querySelectorAll('.wishlist-btn[data-product-id]');
    buttons.forEach(btn => {
        const productId = btn.dataset.productId;
        updateWishlistButton(btn, favoriteIds.has(productId));
    });
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

    const stockAvailable = product.estoque > 0;
    const stockLow = stockAvailable && product.estoque <= 5;
    const stockClass = stockAvailable ? 'available' : 'unavailable';
    const stockText = stockAvailable
        ? (stockLow ? `Ultimas ${product.estoque} unidades em estoque` : `Disponivel - ${product.estoque} unidades em estoque`)
        : 'Produto indisponivel no momento';

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

                ${product.caracteristicas ? `<div class="modal-details-section">
                    <h3><i class="fas fa-list-ul"></i> Características Principais</h3>
                    <p>${product.caracteristicas}</p>
                </div>` : ''}

                ${product.curiosidades ? `<div class="modal-details-section">
                    <h3><i class="fas fa-lightbulb"></i> Curiosidades</h3>
                    <p>${product.curiosidades}</p>
                </div>` : ''}

                ${product.harmonizacao ? `<div class="modal-details-section">
                    <h3><i class="fas fa-utensils"></i> Harmonização</h3>
                    <p>${product.harmonizacao}</p>
                </div>` : ''}

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
                    <span class="stock-status ${stockClass}${stockLow ? ' low-stock' : ''}">
                        <i class="fas ${stockAvailable ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${stockText}
                    </span>
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
                        <span>Frete calculado no checkout</span>
                    </div>
                    <div class="extra-item">
                        <i class="fas fa-shield-alt"></i>
                        <span>Garantia conforme o produto</span>
                    </div>
                    <div class="extra-item">
                        <i class="fas fa-undo"></i>
                        <span>Trocas e devolucoes com suporte</span>
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

function isCartSidebarOpen() {
    const sidebar = getElement('cart-sidebar');
    return !!(sidebar && sidebar.classList.contains('show'));
}

function handleCartQuantityChange(index, delta) {
    updateQuantity(index, delta);
}

function handleCartRemove(index) {
    const item = removeFromCartService(index);
    if (item) {
        showToast(`${item.nome} ${SUCCESS_MESSAGES.CART.REMOVED}`, TOAST_TYPES.INFO);
    }
}

function renderCartSidebar() {
    renderCart(getCartItems(), {
        onUpdateQuantity: handleCartQuantityChange,
        onRemoveItem: handleCartRemove
    });
}

/**
 * Show cart sidebar
 */
export function showCart() {
    openCartSidebar();
    renderCartSidebar();
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
    if (isProcessingPayment) {
        return;
    }

    if (!validatePaymentForm()) {
        return;
    }

    isProcessingPayment = true;
    setPaymentButtonLoading(true);

    try {
        const user = getCurrentUser();
        if (!user) {
            showLoginModal();
            isProcessingPayment = false;
            setPaymentButtonLoading(false);
            return;
        }

        const formData = getCheckoutFormData();
        const cartItems = getCartItems();
        if (ACTIVE_PAYMENT_PROVIDER === PAYMENT_PROVIDERS.MOCK) {
            showToast('Processando pagamento (modo teste)...', TOAST_TYPES.INFO);

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 1200));

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

            const order = await createOrder(orderData);
            displayOrderConfirmation(order);
            clearCart();
            showToast('Pedido realizado com sucesso!', TOAST_TYPES.SUCCESS);
            isProcessingPayment = false;
            setPaymentButtonLoading(false);
            return;
        }

        showToast('Preparando checkout seguro...', TOAST_TYPES.INFO);

        const idToken = await user.getIdToken();
        const checkoutPayload = {
            items: cartItems.map(item => ({
                id: item.id,
                quantity: item.quantity
            })),
            address: formData.address,
            shippingType: formData.shipping?.type,
            paymentMethod: formData.payment?.method,
            installments: formData.payment?.installments
        };

        const checkout = await createPagBankCheckout(checkoutPayload, idToken);

        if (checkout?.payLink) {
            localStorage.setItem('mlb_pending_order_id', checkout.orderId);
            showToast('Redirecionando para o PagBank...', TOAST_TYPES.INFO);
            isProcessingPayment = false;
            setPaymentButtonLoading(false);
            window.location.href = checkout.payLink;
            return;
        }

        showToast('Nao foi possivel iniciar o pagamento.', TOAST_TYPES.ERROR);
    } catch (error) {
        const errorLabel = ACTIVE_PAYMENT_PROVIDER === PAYMENT_PROVIDERS.MOCK
            ? 'Error creating order:'
            : 'Error creating PagBank checkout:';
        logError(errorLabel, error);
        showToast(error.message || ERROR_MESSAGES.ORDER.CREATE_FAILED, TOAST_TYPES.ERROR);
    } finally {
        if (isProcessingPayment) {
            isProcessingPayment = false;
            setPaymentButtonLoading(false);
        }
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
        logError('Auth error:', error);
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

async function renderProfileFavorites() {
    const list = getElement('profile-favorites-list');
    if (!list) return;

    if (!isLoggedIn()) {
        list.innerHTML = '<p class="no-data">Faça login para ver seus favoritos.</p>';
        return;
    }

    const ids = Array.from(favoriteIds);
    if (ids.length === 0) {
        list.innerHTML = '<p class="no-data">Você ainda não favoritou produtos.</p>';
        return;
    }

    const productMap = new Map(allProducts.map(product => [product.id, product]));
    const missingIds = ids.filter(id => !productMap.has(id));

    if (missingIds.length > 0) {
        const fetched = await Promise.all(
            missingIds.map(id => getProductById(id).catch(() => null))
        );
        fetched.filter(Boolean).forEach(product => productMap.set(product.id, product));
    }

    const escapeHtml = (value = '') => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const favorites = ids.map(id => productMap.get(id)).filter(Boolean);

    list.innerHTML = favorites.map(product => {
        const priceValue = product.precoPromocional ?? product.preco ?? 0;
        const priceText = priceValue ? formatCurrency(priceValue) : 'Preço indisponível';
        return `
            <div class="favorite-card">
                ${product.imagem
                    ? `<img src="${product.imagem}" alt="${escapeHtml(product.nome || 'Produto')}" onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Imagem'">`
                    : '<div class="placeholder-image"><i class="fas fa-image"></i></div>'}
                <div class="favorite-card-body">
                    <span class="favorite-card-name">${escapeHtml(product.nome || 'Produto')}</span>
                    <span class="favorite-card-price">${priceText}</span>
                    <div class="favorite-card-actions">
                        <button class="favorite-remove" data-id="${product.id}">Remover</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    list.querySelectorAll('.favorite-remove').forEach(button => {
        button.addEventListener('click', async (event) => {
            event.stopPropagation();
            const productId = button.dataset.id;
            try {
                await removeFavoriteProduct(productId);
                favoriteIds.delete(productId);
                updateWishlistUI();
                renderProfileFavorites();
                showToast('Produto removido dos favoritos.', TOAST_TYPES.INFO);
            } catch (error) {
                logError('Erro ao remover favorito:', error);
                showToast('Erro ao remover favorito.', TOAST_TYPES.ERROR);
            }
        });
    });
}

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

    renderProfileFavorites();
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
        logError('Profile update error:', error);
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
        logError('Error loading orders:', error);
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
        const items = Array.isArray(order.items) ? order.items : [];
        const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalFormatted = formatCurrency(order.total || 0);

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
                    ${items.slice(0, 3).map(item =>
                        `<span class="order-item-name">${item.quantity}x ${item.nome}</span>`
                    ).join('')}
                    ${items.length > 3 ? `<span class="more-items">+${items.length - 3} itens</span>` : ''}
                </div>
                <div class="order-footer">
                    <span class="order-total">Total: ${totalFormatted}</span>
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
        const debouncedFilter = debounce(filterAndRenderProducts, 250);
        searchInput.addEventListener('input', debouncedFilter);
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

function registerGlobalErrorHandlers() {
    if (globalErrorHandlersBound) return;
    globalErrorHandlersBound = true;

    const shouldNotify = () => {
        const now = Date.now();
        if (now - lastGlobalErrorAt < 4000) return false;
        lastGlobalErrorAt = now;
        return true;
    };

    window.addEventListener('error', (event) => {
        logError('Unhandled runtime error', event?.error || event?.message);
        if (shouldNotify()) {
            showToast('Ocorreu um erro inesperado. Tente novamente.', TOAST_TYPES.ERROR);
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        logError('Unhandled promise rejection', event?.reason);
        if (shouldNotify()) {
            showToast('Ocorreu um erro inesperado. Tente novamente.', TOAST_TYPES.ERROR);
        }
    });
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
    registerGlobalErrorHandlers();
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
