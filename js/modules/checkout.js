/**
 * Checkout Module
 * Handles checkout flow and UI
 */

import { SHIPPING_OPTIONS, PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '../config/constants.js';
import { formatCurrency, formatDate, formatCEP, formatCardNumber, formatCardExpiry, generateOrderNumber } from '../utils/formatters.js';
import { getElement, openModal, closeModal, showToast, setText } from '../utils/dom.js';
import { calculateDeliveryDate } from '../services/order.service.js';

/**
 * Checkout state
 */
let currentStep = 1;
let selectedShipping = SHIPPING_OPTIONS.NORMAL;
let selectedPaymentMethod = PAYMENT_METHODS.CREDIT;

/**
 * Initialize checkout
 */
export function initCheckout() {
    setupFormFormatters();
}

/**
 * Setup form input formatters
 */
function setupFormFormatters() {
    const cepInput = getElement('checkout-cep');
    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            e.target.value = formatCEP(e.target.value);
        });
    }

    const cardNumberInput = getElement('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            e.target.value = formatCardNumber(e.target.value);
            updateCardPreview('number', e.target.value);
        });
    }

    const cardHolderInput = getElement('card-holder');
    if (cardHolderInput) {
        cardHolderInput.addEventListener('input', (e) => {
            updateCardPreview('holder', e.target.value.toUpperCase());
        });
    }

    const cardExpiryInput = getElement('card-expiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => {
            e.target.value = formatCardExpiry(e.target.value);
            updateCardPreview('expiry', e.target.value);
        });
    }
}

/**
 * Update card preview
 * @param {string} field - Field name
 * @param {string} value - Field value
 */
function updateCardPreview(field, value) {
    const previewMap = {
        'number': { id: 'preview-card-number', default: '.... .... .... ....' },
        'holder': { id: 'preview-card-holder', default: 'NOME NO CARTAO' },
        'expiry': { id: 'preview-card-expiry', default: 'MM/AA' }
    };

    const preview = previewMap[field];
    if (preview) {
        setText(preview.id, value || preview.default);
    }
}

/**
 * Open checkout modal
 */
export function openCheckoutModal() {
    openModal('checkout-modal');
    showStep(1);
}

/**
 * Close checkout modal
 */
export function closeCheckoutModal() {
    closeModal('checkout-modal');
    currentStep = 1;
}

/**
 * Show checkout step
 * @param {number} stepNumber - Step number (1, 2, or 3)
 */
export function showStep(stepNumber) {
    currentStep = stepNumber;

    // Hide all steps
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active');
    });

    // Update stepper
    document.querySelectorAll('.checkout-stepper .step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < stepNumber) {
            step.classList.add('completed');
        } else if (index + 1 === stepNumber) {
            step.classList.add('active');
        }
    });

    // Show current step
    const currentStepEl = getElement(`checkout-step-${stepNumber}`);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
    }
}

/**
 * Go to payment step (step 2)
 * @returns {boolean} Success status
 */
export function goToPaymentStep() {
    const form = getElement('address-form');
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return false;
    }

    showStep(2);
    return true;
}

/**
 * Go back to address step (step 1)
 */
export function goToAddressStep() {
    showStep(1);
}

/**
 * Select shipping option
 * @param {string} type - Shipping type
 */
export function selectShipping(type) {
    const option = Object.values(SHIPPING_OPTIONS).find(o => o.type === type);
    if (option) {
        selectedShipping = option;

        // Update UI
        document.querySelectorAll('.shipping-option').forEach(opt => {
            const radio = opt.querySelector('input[type="radio"]');
            const isSelected = radio.value === type;
            opt.classList.toggle('selected', isSelected);
            radio.checked = isSelected;
        });
    }
}

/**
 * Select payment method
 * @param {string} method - Payment method
 */
export function selectPaymentMethod(method) {
    selectedPaymentMethod = method;

    // Update UI
    document.querySelectorAll('.payment-method').forEach(opt => {
        const radio = opt.querySelector('input[type="radio"]');
        const isSelected = radio.value === method;
        opt.classList.toggle('selected', isSelected);
        radio.checked = isSelected;
    });

    // Show/hide payment forms
    const showCard = method === PAYMENT_METHODS.CREDIT || method === PAYMENT_METHODS.DEBIT;
    toggleElement('card-form', showCard);
    toggleElement('pix-info', method === PAYMENT_METHODS.PIX);
    toggleElement('boleto-info', method === PAYMENT_METHODS.BOLETO);
}

/**
 * Toggle element visibility
 * @param {string} id - Element ID
 * @param {boolean} show - Show or hide
 */
function toggleElement(id, show) {
    const element = getElement(id);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

/**
 * Update order summary
 * @param {Array} cartItems - Cart items
 */
export function updateOrderSummary(cartItems) {
    const container = getElement('checkout-items-summary');
    if (!container) return;

    let subtotal = 0;

    const html = cartItems.map(item => {
        const price = item.precoPromocional || item.preco;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        return `
            <div class="summary-item">
                <span>${item.quantity}x ${item.nome}</span>
                <span>${formatCurrency(itemTotal)}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = html;

    const total = subtotal + selectedShipping.price;
    setText('summary-subtotal', formatCurrency(subtotal));
    setText('summary-shipping', formatCurrency(selectedShipping.price));
    setText('summary-total', formatCurrency(total));
}

/**
 * Validate payment form
 * @returns {boolean} Is valid
 */
export function validatePaymentForm() {
    if (selectedPaymentMethod === PAYMENT_METHODS.CREDIT ||
        selectedPaymentMethod === PAYMENT_METHODS.DEBIT) {
        const cardNumber = getElement('card-number')?.value;
        const cardHolder = getElement('card-holder')?.value;
        const cardExpiry = getElement('card-expiry')?.value;
        const cardCvv = getElement('card-cvv')?.value;

        if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
            showToast('Preencha todos os dados do cartao', 'error');
            return false;
        }
    }

    return true;
}

/**
 * Get checkout form data
 * @returns {Object} Form data
 */
export function getCheckoutFormData() {
    return {
        address: {
            name: getElement('checkout-name')?.value || '',
            phone: getElement('checkout-phone')?.value || '',
            cep: getElement('checkout-cep')?.value || '',
            street: getElement('checkout-street')?.value || '',
            number: getElement('checkout-number')?.value || '',
            complement: getElement('checkout-complement')?.value || '',
            neighborhood: getElement('checkout-neighborhood')?.value || '',
            city: getElement('checkout-city')?.value || '',
            state: getElement('checkout-state')?.value || ''
        },
        shipping: selectedShipping,
        payment: {
            method: selectedPaymentMethod,
            installments: selectedPaymentMethod === PAYMENT_METHODS.CREDIT
                ? parseInt(getElement('card-installments')?.value || '1')
                : 1
        }
    };
}

/**
 * Display order confirmation
 * @param {Object} order - Order data
 */
export function displayOrderConfirmation(order) {
    showStep(3);

    const orderNumber = generateOrderNumber(order.id);
    setText('order-number', `#${orderNumber}`);

    setText('confirm-payment-method', PAYMENT_METHOD_LABELS[order.payment.method]);

    const deliveryDate = calculateDeliveryDate(order.shipping.type);
    setText('confirm-delivery-date', formatDate(deliveryDate));

    const addr = order.address;
    setText('confirm-address', `${addr.street}, ${addr.number} - ${addr.neighborhood}, ${addr.city}/${addr.state}`);

    setText('confirm-total', formatCurrency(order.total));
}

/**
 * Get selected shipping
 * @returns {Object} Selected shipping option
 */
export function getSelectedShipping() {
    return selectedShipping;
}

/**
 * Get selected payment method
 * @returns {string} Selected payment method
 */
export function getSelectedPaymentMethod() {
    return selectedPaymentMethod;
}
