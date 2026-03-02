/**
 * Admin Pedidos Module
 * Manages order viewing and status updates in admin panel
 */
import { getAllOrders, updateOrderStatus } from '../../services/order.service.js';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../config/constants.js';

let allPedidos = [];

/**
 * Load all orders and render
 */
export async function loadPedidos() {
    const list = document.getElementById('pedidos-list');
    if (!list) return;

    list.innerHTML = '<p class="loading-text">Carregando pedidos...</p>';

    try {
        allPedidos = await getAllOrders();
        updateCounters();
        renderPedidos(allPedidos);
    } catch (error) {
        list.innerHTML = '<p class="error-text">Erro ao carregar pedidos: ' + error.message + '</p>';
    }
}

/**
 * Filter orders by status, payment method and search query
 */
export function filterPedidos() {
    const statusFilter = document.getElementById('pedidos-filter-status')?.value || '';
    const paymentFilter = document.getElementById('pedidos-filter-payment')?.value || '';
    const searchQuery = (document.getElementById('pedidos-search')?.value || '').toLowerCase();

    let filtered = allPedidos;

    if (statusFilter) {
        filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (paymentFilter) {
        filtered = filtered.filter(p => {
            const method = p.payment?.method || '';
            if (paymentFilter === 'stripe') return method === 'stripe';
            return method !== 'stripe';
        });
    }

    if (searchQuery) {
        filtered = filtered.filter(p =>
            (p.id || '').toLowerCase().includes(searchQuery) ||
            (p.userEmail || '').toLowerCase().includes(searchQuery) ||
            (p.userId || '').toLowerCase().includes(searchQuery)
        );
    }

    renderPedidos(filtered);
}

/**
 * Update status counters
 */
function updateCounters() {
    const total = allPedidos.length;
    const pendentes = allPedidos.filter(p => p.status === ORDER_STATUS.PENDING).length;
    const pagos = allPedidos.filter(p => p.status === ORDER_STATUS.PAID).length;
    const enviados = allPedidos.filter(p => p.status === ORDER_STATUS.SHIPPED).length;

    const totalEl = document.getElementById('pedidos-total');
    const pendentesEl = document.getElementById('pedidos-pendentes');
    const pagosEl = document.getElementById('pedidos-pagos');
    const enviadosEl = document.getElementById('pedidos-enviados');

    if (totalEl) totalEl.textContent = `Total: ${total}`;
    if (pendentesEl) pendentesEl.textContent = `Pendentes: ${pendentes}`;
    if (pagosEl) pagosEl.textContent = `Pagos: ${pagos}`;
    if (enviadosEl) enviadosEl.textContent = `Enviados: ${enviados}`;
}

/**
 * Render orders list
 */
function renderPedidos(pedidos) {
    const list = document.getElementById('pedidos-list');
    if (!list) return;

    if (pedidos.length === 0) {
        list.innerHTML = '<p class="empty-text">Nenhum pedido encontrado.</p>';
        return;
    }

    list.innerHTML = pedidos.map(pedido => {
        const statusInfo = ORDER_STATUS_LABELS[pedido.status] || { label: pedido.status, class: '' };
        const paymentMethod = pedido.payment?.method || '';
        const paymentBadge = paymentMethod === 'stripe'
            ? '<span class="payment-badge stripe">Stripe</span>'
            : '<span class="payment-badge manual">Manual</span>';
        const date = formatDate(pedido.createdAt);
        const total = formatCurrency(pedido.totalPrice || pedido.total || 0);
        const itemsCount = getItemsCount(pedido);
        const shortId = (pedido.id || '').substring(0, 12);

        return `
            <div class="pedido-card" data-id="${pedido.id}">
                <div class="pedido-header">
                    <div class="pedido-id-date">
                        <span class="pedido-id">${shortId}</span>
                        <span class="pedido-date">${date}</span>
                    </div>
                    <div class="pedido-badges">
                        ${paymentBadge}
                        <span class="status-badge ${statusInfo.class}">${statusInfo.label}</span>
                    </div>
                </div>
                <div class="pedido-info">
                    <span class="pedido-email">${pedido.userEmail || pedido.userId || '—'}</span>
                    <span class="pedido-items-count">${itemsCount} ${itemsCount === 1 ? 'item' : 'itens'}</span>
                </div>
                <div class="pedido-footer">
                    <span class="pedido-total">${total}</span>
                    <div class="pedido-actions">
                        <select class="status-select" data-id="${pedido.id}" onchange="changeOrderStatus(this)">
                            ${buildStatusOptions(pedido.status)}
                        </select>
                        <button class="detail-btn" data-id="${pedido.id}" onclick="toggleOrderDetail('${pedido.id}')">Detalhes</button>
                    </div>
                </div>
                <div class="pedido-detail" id="detail-${pedido.id}" style="display:none;">
                    ${buildDetailHTML(pedido)}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Build status dropdown options
 */
function buildStatusOptions(currentStatus) {
    const statuses = [
        ORDER_STATUS.PENDING,
        ORDER_STATUS.PAID,
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.CANCELLED
    ];

    return statuses.map(s => {
        const info = ORDER_STATUS_LABELS[s] || { label: s };
        const selected = s === currentStatus ? 'selected' : '';
        return `<option value="${s}" ${selected}>${info.label}</option>`;
    }).join('');
}

/**
 * Build order detail HTML
 */
function buildDetailHTML(pedido) {
    const items = pedido.items || [];
    const address = pedido.address || {};
    const payment = pedido.payment || {};

    let html = '<div class="detail-section">';

    // Customer
    html += '<div class="detail-group"><strong>Cliente:</strong>';
    html += `<span>${pedido.userEmail || '—'}</span>`;
    html += `<span class="detail-uid">UID: ${pedido.userId || '—'}</span>`;
    html += '</div>';

    // Address
    if (address.street) {
        html += '<div class="detail-group"><strong>Endereco:</strong>';
        html += `<span>${address.street}, ${address.number || ''}${address.complement ? ' - ' + address.complement : ''}</span>`;
        html += `<span>${address.neighborhood || ''} - ${address.city || ''}/${address.state || ''}</span>`;
        html += `<span>CEP: ${address.zipCode || '—'}</span>`;
        html += '</div>';
    }

    // Payment
    html += '<div class="detail-group"><strong>Pagamento:</strong>';
    if (payment.method === 'stripe') {
        html += '<span class="payment-badge stripe">Stripe</span>';
        if (payment.paymentIntentId) {
            html += `<span class="detail-uid">PaymentIntent: ${payment.paymentIntentId}</span>`;
        }
    } else if (payment.cardLastDigits) {
        html += `<span>Cartao final ${payment.cardLastDigits} - ${payment.cardHolder || ''}</span>`;
    } else {
        html += `<span>${payment.method || payment || '—'}</span>`;
    }
    html += '</div>';

    // Items
    html += '<div class="detail-group"><strong>Itens:</strong>';
    html += '<div class="detail-items">';
    items.forEach(item => {
        const nome = item.productName || item.nome || item.name || '—';
        const qty = item.quantidade || item.quantity || 1;
        const preco = item.preco || item.price || 0;
        html += `<div class="detail-item"><span>${qty}x ${nome}</span><span>${formatCurrency(preco * qty)}</span></div>`;
    });
    html += '</div></div>';

    // Total
    html += `<div class="detail-group detail-total"><strong>Total:</strong><span>${formatCurrency(pedido.totalPrice || pedido.total || 0)}</span></div>`;

    html += '</div>';
    return html;
}

/**
 * Toggle order detail visibility
 */
export function toggleOrderDetail(orderId) {
    const detail = document.getElementById('detail-' + orderId);
    if (detail) {
        detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Change order status from dropdown
 */
export async function changeOrderStatus(selectEl) {
    const orderId = selectEl.dataset.id;
    const newStatus = selectEl.value;

    try {
        await updateOrderStatus(orderId, newStatus);

        // Update local cache
        const order = allPedidos.find(p => p.id === orderId);
        if (order) order.status = newStatus;

        updateCounters();

        // Update badge in card
        const card = selectEl.closest('.pedido-card');
        if (card) {
            const statusInfo = ORDER_STATUS_LABELS[newStatus] || { label: newStatus, class: '' };
            const badge = card.querySelector('.status-badge');
            if (badge) {
                badge.textContent = statusInfo.label;
                badge.className = 'status-badge ' + statusInfo.class;
            }
        }
    } catch (error) {
        alert('Erro ao atualizar status: ' + error.message);
        // Revert dropdown
        const order = allPedidos.find(p => p.id === orderId);
        if (order) selectEl.value = order.status;
    }
}

/**
 * Get total items count
 */
function getItemsCount(pedido) {
    const items = pedido.items || [];
    return items.reduce((sum, item) => sum + (item.quantidade || item.quantity || 1), 0);
}

/**
 * Format timestamp to DD/MM/YYYY HH:mm
 */
function formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Format number as BRL currency
 */
function formatCurrency(value) {
    return 'R$ ' + Number(value).toFixed(2).replace('.', ',');
}
