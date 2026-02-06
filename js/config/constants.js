/**
 * Application Constants
 * Centralized constants to avoid magic strings and numbers
 */

// Firebase Collections
export const COLLECTIONS = {
    USERS: 'users',
    PRODUCTS: 'produtos',
    ORDERS: 'pedidos',
    EVENTS: 'eventos',
    EVENT_LOCATIONS: 'event_location',
    QUESTIONS: 'duvidas',
    CHAT: 'lista_geral',
    BANNERS: 'banners'
};

// Admin Emails
export const ADMIN_EMAILS = [
    'admin@makelifebetter.com',
    'carlos@makelifebetter.com'
];

// Storage Keys
export const STORAGE_KEYS = {
    CART: 'mlb_cart',
    USER_PREFERENCES: 'mlb_user_prefs'
};

// Order Status
export const ORDER_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

// Order Status Labels (PT-BR)
export const ORDER_STATUS_LABELS = {
    [ORDER_STATUS.PENDING]: { label: 'Aguardando Pagamento', class: 'pending' },
    [ORDER_STATUS.PAID]: { label: 'Pago', class: 'paid' },
    [ORDER_STATUS.SHIPPED]: { label: 'Enviado', class: 'shipped' },
    [ORDER_STATUS.DELIVERED]: { label: 'Entregue', class: 'delivered' },
    [ORDER_STATUS.CANCELLED]: { label: 'Cancelado', class: 'cancelled' }
};

// Payment Methods
export const PAYMENT_METHODS = {
    CREDIT: 'credit',
    DEBIT: 'debit',
    PIX: 'pix',
    BOLETO: 'boleto'
};

// Payment Method Labels (PT-BR)
export const PAYMENT_METHOD_LABELS = {
    [PAYMENT_METHODS.CREDIT]: 'Cartao de Credito',
    [PAYMENT_METHODS.DEBIT]: 'Cartao de Debito',
    [PAYMENT_METHODS.PIX]: 'PIX',
    [PAYMENT_METHODS.BOLETO]: 'Boleto Bancario'
};

// Payment Provider (mock or pagbank)
export const PAYMENT_PROVIDERS = {
    MOCK: 'mock',
    PAGBANK: 'pagbank'
};

// Default provider (use mock until PagBank is configured)
export const ACTIVE_PAYMENT_PROVIDER = PAYMENT_PROVIDERS.MOCK;

// Shipping Options
export const SHIPPING_OPTIONS = {
    NORMAL: { type: 'normal', price: 15.90, time: '5-8 dias', label: 'Normal' },
    EXPRESS: { type: 'express', price: 29.90, time: '2-3 dias', label: 'Expresso' },
    SAME_DAY: { type: 'sameday', price: 49.90, time: 'Hoje', label: 'Same Day' }
};

// Category Icons (Font Awesome)
export const CATEGORY_ICONS = {
    'Eletronicos': 'fa-laptop',
    'Roupas': 'fa-tshirt',
    'Calcados': 'fa-shoe-prints',
    'Acessorios': 'fa-glasses',
    'Moveis': 'fa-couch',
    'Livros': 'fa-book',
    'Beleza': 'fa-spa',
    'Eletrodomesticos': 'fa-blender',
    'default': 'fa-tag'
};

// Toast Types
export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning'
};

// Toast Icons
export const TOAST_ICONS = {
    [TOAST_TYPES.SUCCESS]: 'fa-check-circle',
    [TOAST_TYPES.ERROR]: 'fa-exclamation-circle',
    [TOAST_TYPES.INFO]: 'fa-info-circle',
    [TOAST_TYPES.WARNING]: 'fa-exclamation-triangle'
};

// UI Configuration
export const UI_CONFIG = {
    TOAST_DURATION: 3000,
    TOAST_ANIMATION_DELAY: 300,
    MODAL_ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300
};

// Validation
export const VALIDATION = {
    MIN_PASSWORD_LENGTH: 6,
    CEP_LENGTH: 9,
    CARD_NUMBER_LENGTH: 19,
    CVV_MIN_LENGTH: 3,
    CVV_MAX_LENGTH: 4
};

// Error Messages (PT-BR)
export const ERROR_MESSAGES = {
    AUTH: {
        EMAIL_IN_USE: 'Este email ja esta em uso.',
        INVALID_EMAIL: 'Email invalido.',
        WEAK_PASSWORD: 'A senha deve ter pelo menos 6 caracteres.',
        WRONG_CREDENTIALS: 'Email ou senha incorretos.',
        REQUIRES_RECENT_LOGIN: 'Por seguranca, faca login novamente para alterar a senha.',
        GENERIC: 'Erro ao processar. Tente novamente.'
    },
    CART: {
        EMPTY: 'Seu carrinho esta vazio',
        PRODUCT_NOT_FOUND: 'Produto nao encontrado'
    },
    ORDER: {
        CREATE_FAILED: 'Erro ao criar pedido. Tente novamente.',
        LOAD_FAILED: 'Erro ao carregar pedidos'
    },
    PROFILE: {
        UPDATE_FAILED: 'Erro ao atualizar perfil. Tente novamente.'
    }
};

// Success Messages (PT-BR)
export const SUCCESS_MESSAGES = {
    AUTH: {
        LOGIN: 'Login realizado com sucesso!',
        REGISTER: 'Conta criada com sucesso!',
        LOGOUT: 'Voce saiu da sua conta.'
    },
    CART: {
        ADDED: 'Produto adicionado ao carrinho!',
        REMOVED: 'removido do carrinho'
    },
    PROFILE: {
        UPDATED: 'Perfil atualizado com sucesso!'
    },
    WISHLIST: {
        ADDED: 'Produto adicionado aos favoritos!'
    }
};
