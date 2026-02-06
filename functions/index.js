const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const cors = require('cors');

admin.initializeApp();

const db = admin.firestore();
const REGION = process.env.FUNCTIONS_REGION || 'us-central1';
const runtimeConfig = typeof functions.config === 'function' ? functions.config() : {};
const PAGBANK_ENV = process.env.PAGBANK_ENV || runtimeConfig.pagbank?.env || 'sandbox';
const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN || runtimeConfig.pagbank?.token;
const STORE_BASE_URL = process.env.STORE_BASE_URL || runtimeConfig.app?.store_base_url;
const ALLOWED_ORIGINS_ENV = process.env.ALLOWED_ORIGINS || runtimeConfig.app?.allowed_origins;

const PAGBANK_BASE_URL = PAGBANK_ENV === 'production'
    ? 'https://api.pagseguro.com'
    : 'https://sandbox.api.pagseguro.com';

const SHIPPING_OPTIONS = {
    normal: { type: 'normal', price: 15.90, time: '5-8 dias', label: 'Normal' },
    express: { type: 'express', price: 29.90, time: '2-3 dias', label: 'Expresso' },
    sameday: { type: 'sameday', price: 49.90, time: 'Hoje', label: 'Same Day' }
};

function getAllowedOrigins() {
    const rawOrigins = ALLOWED_ORIGINS_ENV || STORE_BASE_URL || '';
    return rawOrigins
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();
const corsHandler = cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('Origin not allowed'));
    }
});

function getFunctionsBaseUrl() {
    if (process.env.FUNCTIONS_BASE_URL) {
        return process.env.FUNCTIONS_BASE_URL;
    }

    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    if (!projectId) return null;

    return `https://${REGION}-${projectId}.cloudfunctions.net`;
}

function getShippingOption(type) {
    if (!type) return SHIPPING_OPTIONS.normal;
    const normalized = String(type).toLowerCase();
    return SHIPPING_OPTIONS[normalized] || SHIPPING_OPTIONS.normal;
}

function toCents(value) {
    return Math.round(Number(value || 0) * 100);
}

async function verifyFirebaseIdToken(req) {
    const authHeader = req.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
        throw new Error('Auth token ausente.');
    }

    const idToken = authHeader.replace('Bearer ', '').trim();
    if (!idToken) {
        throw new Error('Auth token ausente.');
    }

    return admin.auth().verifyIdToken(idToken);
}

async function buildCheckoutItems(cartItems = []) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        throw new Error('Carrinho vazio.');
    }

    const productsSnap = await Promise.all(
        cartItems.map(item => {
            const productId = item.id || item.productId;
            if (!productId) {
                throw new Error('Produto invalido.');
            }
            return db.collection('produtos').doc(productId).get();
        })
    );

    const orderItems = [];
    const checkoutItems = [];
    let subtotalCents = 0;

    cartItems.forEach((item, index) => {
        const snap = productsSnap[index];
        if (!snap.exists) {
            throw new Error('Produto nao encontrado.');
        }

        const product = snap.data();
        if (product.ativo === false) {
            throw new Error('Produto indisponivel.');
        }

        const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
        const price = product.precoPromocional || product.preco || 0;
        const unitAmount = toCents(price);

        if (unitAmount <= 0) {
            throw new Error('Preco invalido.');
        }

        subtotalCents += unitAmount * quantity;

        orderItems.push({
            productId: snap.id,
            nome: product.nome || 'Produto',
            preco: price,
            quantity
        });

        checkoutItems.push({
            reference_id: snap.id,
            name: product.nome || 'Produto',
            quantity,
            unit_amount: unitAmount
        });
    });

    return { orderItems, checkoutItems, subtotalCents };
}

function resolvePayLink(links = []) {
    if (!Array.isArray(links)) return null;
    const pay = links.find(link => String(link.rel || '').toLowerCase() === 'pay');
    return pay?.href || null;
}

exports.createPagBankCheckout = functions
    .region(REGION)
    .https
    .onRequest((req, res) => {
        corsHandler(req, res, async () => {
            if (req.method !== 'POST') {
                res.set('Allow', 'POST');
                return res.status(405).json({ message: 'Metodo nao permitido.' });
            }

            try {
                if (!PAGBANK_TOKEN) {
                    return res.status(500).json({ message: 'PAGBANK_TOKEN nao configurado.' });
                }

                if (!STORE_BASE_URL) {
                    return res.status(500).json({ message: 'STORE_BASE_URL nao configurado.' });
                }

                const decoded = await verifyFirebaseIdToken(req);
                const { items, address, shippingType, paymentMethod, installments } = req.body || {};

                const { orderItems, checkoutItems, subtotalCents } = await buildCheckoutItems(items);
                const shippingOption = getShippingOption(shippingType);
                const shippingCostCents = toCents(shippingOption.price);
                const totalCents = subtotalCents + shippingCostCents;

                const orderData = {
                    userId: decoded.uid,
                    userEmail: decoded.email || '',
                    items: orderItems,
                    address: address || {},
                    shipping: shippingOption,
                    payment: {
                        method: paymentMethod || 'credit',
                        installments: Math.max(1, parseInt(installments, 10) || 1),
                        provider: 'pagbank'
                    },
                    subtotal: subtotalCents / 100,
                    shippingCost: shippingCostCents / 100,
                    total: totalCents / 100,
                    status: 'pending',
                    createdAt: Date.now()
                };

                const orderRef = await db.collection('pedidos').add(orderData);
                const orderId = orderRef.id;

                const functionsBaseUrl = getFunctionsBaseUrl();
                const webhookUrl = functionsBaseUrl ? `${functionsBaseUrl}/pagbankWebhook` : null;

                const redirectUrl = `${STORE_BASE_URL}/store.html?order_id=${orderId}`;
                const returnUrl = `${STORE_BASE_URL}/store.html?order_id=${orderId}`;

                if (shippingCostCents > 0) {
                    checkoutItems.push({
                        reference_id: 'shipping',
                        name: `Frete (${shippingOption.label})`,
                        quantity: 1,
                        unit_amount: shippingCostCents
                    });
                }

                const checkoutPayload = {
                    reference_id: orderId,
                    items: checkoutItems,
                    redirect_url: redirectUrl,
                    return_url: returnUrl
                };

                const customer = {};
                if (address?.name) {
                    customer.name = address.name;
                }
                if (decoded.email) {
                    customer.email = decoded.email;
                }
                if (Object.keys(customer).length > 0) {
                    checkoutPayload.customer = customer;
                }

                if (webhookUrl) {
                    checkoutPayload.notification_urls = [webhookUrl];
                    checkoutPayload.payment_notification_urls = [webhookUrl];
                }

                const response = await fetch(`${PAGBANK_BASE_URL}/checkouts`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${PAGBANK_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(checkoutPayload)
                });

                const responseBody = await response.json().catch(() => ({}));

                if (!response.ok) {
                    await orderRef.update({
                        status: 'cancelled',
                        updatedAt: Date.now(),
                        pagbank: {
                            error: responseBody,
                            status: response.status
                        }
                    });

                    return res.status(502).json({
                        message: 'Falha ao iniciar o checkout.'
                    });
                }

                const payLink = resolvePayLink(responseBody.links);

                await orderRef.update({
                    updatedAt: Date.now(),
                    pagbank: {
                        checkoutId: responseBody.id || null,
                        links: responseBody.links || [],
                        status: responseBody.status || null
                    }
                });

                return res.json({
                    orderId,
                    checkoutId: responseBody.id || null,
                    payLink
                });
            } catch (error) {
                console.error('createPagBankCheckout error:', error);
                return res.status(400).json({
                    message: error.message || 'Erro ao iniciar pagamento.'
                });
            }
        });
    });

exports.pagbankWebhook = functions
    .region(REGION)
    .https
    .onRequest(async (req, res) => {
        try {
            if (!PAGBANK_TOKEN) {
                return res.status(500).send('Missing token');
            }

            const authenticityToken = req.get('x-authenticity-token');
            const rawBody = (req.rawBody || '').toString('utf8');
            const expectedToken = crypto
                .createHash('sha256')
                .update(`${PAGBANK_TOKEN}-${rawBody}`)
                .digest('hex');

            if (!authenticityToken || authenticityToken !== expectedToken) {
                return res.status(401).send('Unauthorized');
            }

            const payload = req.body || {};
            const referenceId = payload.reference_id || payload.data?.reference_id;
            const status = payload.status || payload.data?.status;
            const eventType = payload.type || payload.data?.type;
            const pagbankId = payload.id || payload.data?.id || null;

            if (!referenceId) {
                return res.status(200).send('ok');
            }

            let orderStatus = 'pending';
            const normalizedStatus = String(status || '').toUpperCase();

            if (normalizedStatus === 'PAID') {
                orderStatus = 'paid';
            } else if (['DECLINED', 'CANCELED', 'CANCELLED', 'EXPIRED', 'INACTIVE'].includes(normalizedStatus)) {
                orderStatus = 'cancelled';
            }

            await db.collection('pedidos').doc(referenceId).set({
                status: orderStatus,
                updatedAt: Date.now(),
                payment: {
                    provider: 'pagbank',
                    status: normalizedStatus
                },
                pagbank: {
                    lastEvent: {
                        type: eventType || null,
                        status: normalizedStatus || null,
                        id: pagbankId,
                        receivedAt: Date.now()
                    }
                }
            }, { merge: true });

            return res.status(200).send('ok');
        } catch (error) {
            console.error('pagbankWebhook error:', error);
            return res.status(500).send('error');
        }
    });
