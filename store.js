// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDcHBBJC1BHAIDO8vSGQsNSN3y_e6sTmBM",
    authDomain: "makelifebetter-7f3c9.firebaseapp.com",
    projectId: "makelifebetter-7f3c9",
    storageBucket: "makelifebetter-7f3c9.firebasestorage.app",
    messagingSenderId: "749904577078",
    appId: "1:749904577078:web:3235cbb8e26ffaabba0e97",
    measurementId: "G-ZPNC0MZ1T7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Estado da aplicação
let allProducts = [];
let categorias = new Set();
let currentUser = null;
let currentUserData = null;
let isRegisterMode = false;

// Estado do carrinho
let cart = [];
let selectedShipping = { type: 'normal', price: 15.90, time: '5-8 dias' };
let selectedPaymentMethod = 'credit';

// Lista de emails de admin (você pode mover isso para o Firebase)
const ADMIN_EMAILS = ['admin@makelifebetter.com', 'carlos@makelifebetter.com'];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadStoreProducts();
    setupAuthListener();
    setupClickOutside();
    loadCartFromStorage();
});

// ============================================
// AUTENTICAÇÃO
// ============================================

function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            await loadUserData(user);
            updateUIForLoggedUser();
        } else {
            currentUserData = null;
            updateUIForGuest();
        }
    });
}

async function loadUserData(user) {
    try {
        // Buscar dados do usuário no Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            currentUserData = { id: user.uid, ...userDoc.data() };
        } else {
            // Criar documento do usuário se não existir
            currentUserData = {
                id: user.uid,
                username: user.email.split('@')[0],
                email: user.email,
                createdAt: Date.now(),
                isAdmin: ADMIN_EMAILS.includes(user.email)
            };
            await setDoc(doc(db, 'users', user.uid), currentUserData);
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        currentUserData = {
            id: user.uid,
            username: user.email.split('@')[0],
            email: user.email,
            isAdmin: ADMIN_EMAILS.includes(user.email)
        };
    }
}

function updateUIForLoggedUser() {
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('user-area').style.display = 'flex';

    const displayName = currentUserData?.username || currentUser?.email?.split('@')[0] || 'Usuário';
    document.getElementById('user-display-name').textContent = displayName;

    // Mostrar link de admin se for admin
    const isAdmin = currentUserData?.isAdmin || ADMIN_EMAILS.includes(currentUser?.email);
    document.getElementById('admin-link').style.display = isAdmin ? 'block' : 'none';
}

function updateUIForGuest() {
    document.getElementById('login-btn').style.display = 'flex';
    document.getElementById('user-area').style.display = 'none';
}

// Toggle dropdown do usuário
window.toggleUserDropdown = function() {
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('show');
}

function setupClickOutside() {
    document.addEventListener('click', (e) => {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('user-dropdown');
        if (userMenu && !userMenu.contains(e.target) && dropdown) {
            dropdown.classList.remove('show');
        }
    });
}

// Modal de Login
window.showLoginModal = function() {
    document.getElementById('login-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    isRegisterMode = false;
    updateLoginModalUI();
}

window.closeLoginModal = function() {
    document.getElementById('login-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
}

window.toggleRegisterMode = function() {
    isRegisterMode = !isRegisterMode;
    updateLoginModalUI();
}

function updateLoginModalUI() {
    const title = document.getElementById('login-title');
    const subtitle = document.getElementById('login-subtitle');
    const submitBtn = document.getElementById('login-submit-btn');
    const toggleText = document.getElementById('toggle-register-text');

    if (isRegisterMode) {
        title.textContent = 'Criar Conta';
        subtitle.textContent = 'Preencha os dados para se cadastrar';
        submitBtn.innerHTML = '<span>Cadastrar</span><i class="fas fa-arrow-right"></i>';
        toggleText.textContent = 'Já tenho uma conta';
    } else {
        title.textContent = 'Entrar';
        subtitle.textContent = 'Acesse sua conta para continuar';
        submitBtn.innerHTML = '<span>Entrar</span><i class="fas fa-arrow-right"></i>';
        toggleText.textContent = 'Criar nova conta';
    }
}

// Handler de Login/Registro
window.handleLogin = async function(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
        if (isRegisterMode) {
            // Registro
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Criar documento do usuário
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                username: email.split('@')[0],
                email: email,
                createdAt: Date.now(),
                isAdmin: ADMIN_EMAILS.includes(email)
            });

            showToast('Conta criada com sucesso!', 'success');
        } else {
            // Login
            await signInWithEmailAndPassword(auth, email, password);
            showToast('Login realizado com sucesso!', 'success');
        }

        closeLoginModal();
    } catch (error) {
        console.error('Erro de autenticação:', error);
        let message = 'Erro ao processar. Tente novamente.';

        if (error.code === 'auth/email-already-in-use') {
            message = 'Este email já está em uso.';
        } else if (error.code === 'auth/invalid-email') {
            message = 'Email inválido.';
        } else if (error.code === 'auth/weak-password') {
            message = 'A senha deve ter pelo menos 6 caracteres.';
        } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            message = 'Email ou senha incorretos.';
        } else if (error.code === 'auth/invalid-credential') {
            message = 'Email ou senha incorretos.';
        }

        showToast(message, 'error');
    } finally {
        submitBtn.disabled = false;
        updateLoginModalUI();
    }
}

// Logout
window.doLogout = async function() {
    try {
        await signOut(auth);
        showToast('Você saiu da sua conta.', 'info');
        document.getElementById('user-dropdown').classList.remove('show');
    } catch (error) {
        showToast('Erro ao sair. Tente novamente.', 'error');
    }
}

// Ir para Admin
window.goToAdmin = function() {
    window.location.href = 'index.html';
}

// ============================================
// PERFIL DO USUÁRIO
// ============================================

window.showProfile = function() {
    if (!currentUser) {
        showLoginModal();
        return;
    }

    document.getElementById('user-dropdown').classList.remove('show');
    document.getElementById('profile-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Preencher dados
    const displayName = currentUserData?.username || currentUser.email.split('@')[0];
    document.getElementById('profile-name').textContent = displayName;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-username').value = currentUserData?.username || '';
    document.getElementById('profile-display-email').value = currentUser.email;

    // Badge de admin
    const isAdmin = currentUserData?.isAdmin || ADMIN_EMAILS.includes(currentUser.email);
    const badge = document.getElementById('profile-badge');
    badge.textContent = isAdmin ? 'Administrador' : 'Usuário';
    badge.className = 'profile-badge ' + (isAdmin ? 'admin' : 'user');

    // Data de criação
    const createdAt = currentUserData?.createdAt;
    if (createdAt) {
        document.getElementById('profile-created-at').textContent = new Date(createdAt).toLocaleDateString('pt-BR');
    }
}

window.closeProfileModal = function() {
    document.getElementById('profile-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('profile-new-password').value = '';
}

window.updateProfile = async function(event) {
    event.preventDefault();

    if (!currentUser) return;

    const newUsername = document.getElementById('profile-username').value.trim();
    const newPassword = document.getElementById('profile-new-password').value;

    try {
        // Atualizar username no Firestore
        if (newUsername && newUsername !== currentUserData?.username) {
            await updateDoc(doc(db, 'users', currentUser.uid), {
                username: newUsername,
                updatedAt: Date.now()
            });
            currentUserData.username = newUsername;
            document.getElementById('user-display-name').textContent = newUsername;
            document.getElementById('profile-name').textContent = newUsername;
        }

        // Atualizar senha
        if (newPassword) {
            if (newPassword.length < 6) {
                showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
                return;
            }
            await updatePassword(currentUser, newPassword);
        }

        showToast('Perfil atualizado com sucesso!', 'success');
        closeProfileModal();
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        if (error.code === 'auth/requires-recent-login') {
            showToast('Por segurança, faça login novamente para alterar a senha.', 'error');
        } else {
            showToast('Erro ao atualizar perfil. Tente novamente.', 'error');
        }
    }
}

window.showOrders = function() {
    document.getElementById('user-dropdown').classList.remove('show');
    openOrdersModal();
}

// ============================================
// CARRINHO
// ============================================

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('mlb_cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

function saveCartToStorage() {
    localStorage.setItem('mlb_cart', JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

window.showCart = function() {
    document.getElementById('cart-overlay').classList.add('show');
    document.getElementById('cart-sidebar').classList.add('show');
    document.body.style.overflow = 'hidden';
    renderCart();
}

window.closeCart = function() {
    document.getElementById('cart-overlay').classList.remove('show');
    document.getElementById('cart-sidebar').classList.remove('show');
    document.body.style.overflow = 'auto';
}

function renderCart() {
    const itemsContainer = document.getElementById('cart-items');
    const emptyContainer = document.getElementById('cart-empty');
    const footerContainer = document.getElementById('cart-footer');

    if (cart.length === 0) {
        itemsContainer.innerHTML = '';
        emptyContainer.style.display = 'flex';
        footerContainer.style.display = 'none';
        return;
    }

    emptyContainer.style.display = 'none';
    footerContainer.style.display = 'block';

    let html = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
        const preco = item.precoPromocional || item.preco;
        const itemTotal = preco * item.quantity;
        subtotal += itemTotal;

        html += `
            <div class="cart-item">
                <div class="cart-item-image">
                    ${item.imagem ?
                        `<img src="${item.imagem}" alt="${item.nome}">` :
                        '<div class="no-image"><i class="fas fa-image"></i></div>'}
                </div>
                <div class="cart-item-details">
                    <h4>${item.nome}</h4>
                    <p class="cart-item-price">R$ ${preco.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button class="qty-btn" onclick="updateCartQuantity(${index}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQuantity(${index}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <div class="cart-item-total">
                    <span>R$ ${itemTotal.toFixed(2)}</span>
                    <button class="remove-item-btn" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    itemsContainer.innerHTML = html;

    // Atualizar totais
    document.getElementById('cart-subtotal-value').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('cart-total-value').textContent = `R$ ${subtotal.toFixed(2)}`;
}

function findProductById(productId) {
    return allProducts.find(p => p.id === productId);
}

window.addToCartById = function(produtoId, quantity = 1) {
    const produto = findProductById(produtoId);
    if (!produto) {
        showToast('Produto não encontrado', 'error');
        return;
    }

    const existingIndex = cart.findIndex(item => item.id === produtoId);

    if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            precoPromocional: produto.precoPromocional,
            imagem: produto.imagem,
            quantity: quantity
        });
    }

    saveCartToStorage();
    updateCartCount();
    showToast('Produto adicionado ao carrinho!', 'success');
}

window.updateCartQuantity = function(index, delta) {
    if (cart[index]) {
        cart[index].quantity += delta;

        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }

        saveCartToStorage();
        updateCartCount();
        renderCart();
    }
}

window.removeFromCart = function(index) {
    if (cart[index]) {
        const itemName = cart[index].nome;
        cart.splice(index, 1);
        saveCartToStorage();
        updateCartCount();
        renderCart();
        showToast(`${itemName} removido do carrinho`, 'info');
    }
}

function clearCart() {
    cart = [];
    saveCartToStorage();
    updateCartCount();
    renderCart();
}

// ============================================
// PRODUTOS
// ============================================

async function loadStoreProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando produtos...</p>
        </div>
    `;

    try {
        const querySnapshot = await getDocs(collection(db, 'produtos'));

        allProducts = [];
        categorias = new Set();

        querySnapshot.forEach((docSnap) => {
            const produto = { id: docSnap.id, ...docSnap.data() };
            if (produto.ativo !== false) {
                allProducts.push(produto);
                if (produto.categoria) {
                    categorias.add(produto.categoria);
                }
            }
        });

        // Ordenar por mais recentes
        allProducts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Atualizar estatísticas
        document.getElementById('total-products').textContent = allProducts.length;
        document.getElementById('total-categories').textContent = categorias.size;
        document.getElementById('products-count').textContent = `${allProducts.length} produtos`;

        // Atualizar categorias
        updateCategoriaDropdown();
        renderCategoriesBar();

        // Renderizar produtos
        renderProducts(allProducts);

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        grid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Erro ao carregar produtos</p>
                <button onclick="location.reload()">Tentar novamente</button>
            </div>
        `;
    }
}

function renderCategoriesBar() {
    const container = document.getElementById('categories-list');
    if (!container) return;

    let html = `
        <button class="category-chip active" onclick="filterByCategory('')">
            <i class="fas fa-th-large"></i>
            <span>Todos</span>
        </button>
    `;

    const icons = {
        'Eletrônicos': 'fa-laptop',
        'Roupas': 'fa-tshirt',
        'Calçados': 'fa-shoe-prints',
        'Acessórios': 'fa-glasses',
        'Móveis': 'fa-couch',
        'Livros': 'fa-book',
        'Beleza': 'fa-spa',
        'Eletrodomésticos': 'fa-blender'
    };

    categorias.forEach(cat => {
        const icon = icons[cat] || 'fa-tag';
        html += `
            <button class="category-chip" onclick="filterByCategory('${cat}')">
                <i class="fas ${icon}"></i>
                <span>${cat}</span>
            </button>
        `;
    });

    container.innerHTML = html;
}

window.filterByCategory = function(categoria) {
    // Atualizar chips ativos
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
        if ((categoria === '' && chip.textContent.includes('Todos')) ||
            chip.textContent.includes(categoria)) {
            chip.classList.add('active');
        }
    });

    // Atualizar select
    document.getElementById('categoria-filter').value = categoria;

    // Filtrar
    filterStoreProducts();
}

function updateCategoriaDropdown() {
    const select = document.getElementById('categoria-filter');
    select.innerHTML = '<option value="">Todas as Categorias</option>';

    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente ajustar os filtros ou buscar por outro termo</p>
            </div>
        `;
        return;
    }

    products.forEach(produto => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openProductModal(produto);

        const precoFormatado = produto.preco ? `R$ ${produto.preco.toFixed(2)}` : '';
        const precoPromoFormatado = produto.precoPromocional ? `R$ ${produto.precoPromocional.toFixed(2)}` : null;
        const desconto = produto.precoPromocional && produto.preco ?
            Math.round((1 - produto.precoPromocional / produto.preco) * 100) : 0;

        card.innerHTML = `
            <div class="product-image">
                ${produto.imagem ?
                    `<img src="${produto.imagem}" alt="${produto.nome}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300?text=Sem+Imagem'">` :
                    '<div class="placeholder-image"><i class="fas fa-image"></i></div>'}
                ${desconto > 0 ? `<span class="discount-badge">-${desconto}%</span>` : ''}
                <button class="wishlist-btn" onclick="event.stopPropagation(); addToWishlist('${produto.id}')">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            <div class="product-details">
                <span class="product-category">${produto.categoria || 'Geral'}</span>
                <h3 class="product-name">${produto.nome}</h3>
                <p class="product-description">${truncateText(produto.descricao, 60)}</p>
                <div class="product-price">
                    ${precoPromoFormatado ?
                        `<span class="original-price">${precoFormatado}</span>
                         <span class="promo-price">${precoPromoFormatado}</span>` :
                        `<span class="price">${precoFormatado}</span>`}
                </div>
                <div class="product-footer">
                    ${produto.estoque > 0 ?
                        `<span class="stock in-stock"><i class="fas fa-check-circle"></i> Em estoque</span>` :
                        '<span class="stock out-of-stock"><i class="fas fa-times-circle"></i> Indisponível</span>'}
                    <button class="quick-add-btn" onclick="event.stopPropagation(); quickAdd('${produto.id}')">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    document.getElementById('products-count').textContent = `${products.length} produtos`;
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

window.filterStoreProducts = function() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoria = document.getElementById('categoria-filter').value;
    const ordenar = document.getElementById('ordenar-filter').value;

    let filtered = [...allProducts];

    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.nome && p.nome.toLowerCase().includes(searchTerm)) ||
            (p.descricao && p.descricao.toLowerCase().includes(searchTerm)) ||
            (p.categoria && p.categoria.toLowerCase().includes(searchTerm))
        );
    }

    if (categoria) {
        filtered = filtered.filter(p => p.categoria === categoria);
    }

    switch (ordenar) {
        case 'preco-menor':
            filtered.sort((a, b) => (a.precoPromocional || a.preco || 0) - (b.precoPromocional || b.preco || 0));
            break;
        case 'preco-maior':
            filtered.sort((a, b) => (b.precoPromocional || b.preco || 0) - (a.precoPromocional || a.preco || 0));
            break;
        case 'nome':
            filtered.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
            break;
        default:
            filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    renderProducts(filtered);
}

// Modal de Produto
function openProductModal(produto) {
    const modal = document.getElementById('product-modal');
    const modalBody = document.getElementById('modal-body');

    const precoFormatado = produto.preco ? `R$ ${produto.preco.toFixed(2)}` : '';
    const precoPromoFormatado = produto.precoPromocional ? `R$ ${produto.precoPromocional.toFixed(2)}` : null;
    const desconto = produto.precoPromocional && produto.preco ?
        Math.round((1 - produto.precoPromocional / produto.preco) * 100) : 0;

    modalBody.innerHTML = `
        <div class="modal-product">
            <div class="modal-image">
                ${produto.imagem ?
                    `<img src="${produto.imagem}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/500x500?text=Sem+Imagem'">` :
                    '<div class="placeholder-image large"><i class="fas fa-image"></i></div>'}
                ${desconto > 0 ? `<span class="discount-badge large">-${desconto}%</span>` : ''}
            </div>
            <div class="modal-info">
                <span class="modal-category">${produto.categoria || 'Geral'}</span>
                <h2 class="modal-title">${produto.nome}</h2>
                <p class="modal-description">${produto.descricao || 'Sem descrição disponível.'}</p>

                <div class="modal-price-section">
                    ${precoPromoFormatado ?
                        `<div class="modal-prices">
                            <span class="modal-original-price">${precoFormatado}</span>
                            <span class="modal-promo-price">${precoPromoFormatado}</span>
                            <span class="modal-discount">Economia de ${desconto}%</span>
                        </div>` :
                        `<span class="modal-price">${precoFormatado}</span>`}
                </div>

                <div class="modal-stock">
                    ${produto.estoque > 0 ?
                        `<span class="stock-status available"><i class="fas fa-check-circle"></i> Disponível - ${produto.estoque} unidades em estoque</span>` :
                        '<span class="stock-status unavailable"><i class="fas fa-times-circle"></i> Produto indisponível no momento</span>'}
                </div>

                <div class="modal-actions">
                    ${produto.estoque > 0 ?
                        `<button class="btn-buy" onclick="buyNow('${produto.id}')">
                            <i class="fas fa-bolt"></i>
                            <span>Comprar Agora</span>
                        </button>
                        <button class="btn-cart" onclick="addToCart('${produto.id}')">
                            <i class="fas fa-cart-plus"></i>
                            <span>Adicionar ao Carrinho</span>
                        </button>` :
                        `<button class="btn-notify" onclick="notifyWhenAvailable('${produto.id}')">
                            <i class="fas fa-bell"></i>
                            <span>Avise-me quando disponível</span>
                        </button>`}
                </div>

                <div class="modal-extras">
                    <div class="extra-item">
                        <i class="fas fa-truck"></i>
                        <span>Frete grátis acima de R$ 199</span>
                    </div>
                    <div class="extra-item">
                        <i class="fas fa-shield-alt"></i>
                        <span>Garantia de 30 dias</span>
                    </div>
                    <div class="extra-item">
                        <i class="fas fa-undo"></i>
                        <span>Devolução fácil</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

window.closeProductModal = function() {
    document.getElementById('product-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Ações de produto (placeholder)
window.addToWishlist = function(produtoId) {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    showToast('Produto adicionado aos favoritos!', 'success');
}

window.quickAdd = function(produtoId) {
    addToCartById(produtoId, 1);
}

window.addToCart = function(produtoId) {
    addToCartById(produtoId, 1);
    closeProductModal();
}

window.buyNow = function(produtoId) {
    if (!currentUser) {
        showLoginModal();
        showToast('Faça login para continuar a compra', 'info');
        return;
    }
    addToCartById(produtoId, 1);
    closeProductModal();
    goToCheckout();
}

window.notifyWhenAvailable = function(produtoId) {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    showToast('Você será notificado quando o produto estiver disponível!', 'success');
    closeProductModal();
}


// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };

    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// CHECKOUT
// ============================================

window.goToCheckout = function() {
    if (!currentUser) {
        showLoginModal();
        showToast('Faça login para finalizar a compra', 'info');
        return;
    }

    if (cart.length === 0) {
        showToast('Seu carrinho está vazio', 'warning');
        return;
    }

    closeCart();
    openCheckoutModal();
    showCheckoutStep(1);
    updateOrderSummary();
}

function openCheckoutModal() {
    document.getElementById('checkout-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

window.closeCheckoutModal = function() {
    document.getElementById('checkout-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showCheckoutStep(stepNumber) {
    // Esconder todos os steps
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active');
    });

    // Atualizar stepper
    document.querySelectorAll('.checkout-stepper .step').forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < stepNumber) {
            step.classList.add('completed');
        } else if (index + 1 === stepNumber) {
            step.classList.add('active');
        }
    });

    // Mostrar step atual
    document.getElementById(`checkout-step-${stepNumber}`).classList.add('active');
}

window.goToPaymentStep = function() {
    // Validar formulário de endereço
    const form = document.getElementById('address-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    showCheckoutStep(2);
    updateOrderSummary();
}

window.goToAddressStep = function() {
    showCheckoutStep(1);
}

function updateOrderSummary() {
    const summaryContainer = document.getElementById('checkout-items-summary');
    let subtotal = 0;

    let html = '';
    cart.forEach(item => {
        const preco = item.precoPromocional || item.preco;
        const itemTotal = preco * item.quantity;
        subtotal += itemTotal;

        html += `
            <div class="summary-item">
                <span>${item.quantity}x ${item.nome}</span>
                <span>R$ ${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });

    summaryContainer.innerHTML = html;

    const total = subtotal + selectedShipping.price;
    document.getElementById('summary-subtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById('summary-shipping').textContent = `R$ ${selectedShipping.price.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `R$ ${total.toFixed(2)}`;
}

window.selectShipping = function(type, price, time) {
    selectedShipping = { type, price, time };

    document.querySelectorAll('.shipping-option').forEach(opt => {
        opt.classList.remove('selected');
        const radio = opt.querySelector('input[type="radio"]');
        if (radio.value === type) {
            opt.classList.add('selected');
            radio.checked = true;
        }
    });

    updateOrderSummary();
}

window.selectPaymentMethod = function(method) {
    selectedPaymentMethod = method;

    document.querySelectorAll('.payment-method').forEach(opt => {
        opt.classList.remove('selected');
        const radio = opt.querySelector('input[type="radio"]');
        if (radio.value === method) {
            opt.classList.add('selected');
            radio.checked = true;
        }
    });

    // Mostrar/esconder formulários específicos
    document.getElementById('card-form').style.display = (method === 'credit' || method === 'debit') ? 'block' : 'none';
    document.getElementById('pix-info').style.display = method === 'pix' ? 'block' : 'none';
    document.getElementById('boleto-info').style.display = method === 'boleto' ? 'block' : 'none';
}

window.formatCEP = function(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 5) {
        value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }
    input.value = value;
}

window.formatCardNumber = function(input) {
    let value = input.value.replace(/\D/g, '');
    value = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = value;
    document.getElementById('preview-card-number').textContent = value || '•••• •••• •••• ••••';
}

window.formatExpiry = function(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
    document.getElementById('preview-card-expiry').textContent = value || 'MM/AA';
}

window.updateCardPreview = function() {
    const holder = document.getElementById('card-holder').value;
    document.getElementById('preview-card-holder').textContent = holder.toUpperCase() || 'NOME NO CARTÃO';
}

window.calculateShipping = function() {
    // Simulação - poderia ser integrado com API de frete
    const cep = document.getElementById('checkout-cep').value;
    if (cep.length === 9) {
        showToast('Frete calculado!', 'success');
    }
}

window.processPayment = async function() {
    // Validar pagamento com cartão
    if (selectedPaymentMethod === 'credit' || selectedPaymentMethod === 'debit') {
        const cardNumber = document.getElementById('card-number').value;
        const cardHolder = document.getElementById('card-holder').value;
        const cardExpiry = document.getElementById('card-expiry').value;
        const cardCvv = document.getElementById('card-cvv').value;

        if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
            showToast('Preencha todos os dados do cartão', 'error');
            return;
        }
    }

    // Mostrar loading
    showToast('Processando pagamento...', 'info');

    // Simular processamento (mockado)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Criar pedido
    const order = await createOrder();

    if (order) {
        // Mostrar confirmação
        showCheckoutStep(3);
        displayOrderConfirmation(order);

        // Limpar carrinho
        clearCart();
    }
}

async function createOrder() {
    const subtotal = cart.reduce((total, item) => {
        const preco = item.precoPromocional || item.preco;
        return total + (preco * item.quantity);
    }, 0);

    const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        items: cart.map(item => ({
            productId: item.id,
            nome: item.nome,
            preco: item.precoPromocional || item.preco,
            quantity: item.quantity
        })),
        address: {
            name: document.getElementById('checkout-name').value,
            phone: document.getElementById('checkout-phone').value,
            cep: document.getElementById('checkout-cep').value,
            street: document.getElementById('checkout-street').value,
            number: document.getElementById('checkout-number').value,
            complement: document.getElementById('checkout-complement').value,
            neighborhood: document.getElementById('checkout-neighborhood').value,
            city: document.getElementById('checkout-city').value,
            state: document.getElementById('checkout-state').value
        },
        shipping: selectedShipping,
        payment: {
            method: selectedPaymentMethod,
            installments: selectedPaymentMethod === 'credit' ? parseInt(document.getElementById('card-installments').value) : 1
        },
        subtotal: subtotal,
        shippingCost: selectedShipping.price,
        total: subtotal + selectedShipping.price,
        status: 'pending',
        createdAt: Date.now()
    };

    try {
        const docRef = await addDoc(collection(db, 'pedidos'), orderData);
        return { id: docRef.id, ...orderData };
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        showToast('Erro ao criar pedido. Tente novamente.', 'error');
        return null;
    }
}

function displayOrderConfirmation(order) {
    const orderNumber = order.id.substring(0, 8).toUpperCase();
    document.getElementById('order-number').textContent = `#${orderNumber}`;

    // Método de pagamento
    const paymentMethods = {
        'credit': 'Cartão de Crédito',
        'debit': 'Cartão de Débito',
        'pix': 'PIX',
        'boleto': 'Boleto Bancário'
    };
    document.getElementById('confirm-payment-method').textContent = paymentMethods[order.payment.method];

    // Data de entrega estimada
    const deliveryDate = new Date();
    const daysToAdd = order.shipping.type === 'sameday' ? 0 :
                      order.shipping.type === 'express' ? 3 : 8;
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
    document.getElementById('confirm-delivery-date').textContent = deliveryDate.toLocaleDateString('pt-BR');

    // Endereço
    const addr = order.address;
    document.getElementById('confirm-address').textContent = `${addr.street}, ${addr.number} - ${addr.neighborhood}, ${addr.city}/${addr.state}`;

    // Total
    document.getElementById('confirm-total').textContent = `R$ ${order.total.toFixed(2)}`;
}

window.viewMyOrders = function() {
    closeCheckoutModal();
    openOrdersModal();
}

window.continueShopping = function() {
    closeCheckoutModal();
}

// ============================================
// PEDIDOS
// ============================================

async function openOrdersModal() {
    document.getElementById('orders-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    await loadUserOrders();
}

window.closeOrdersModal = function() {
    document.getElementById('orders-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function loadUserOrders() {
    const listContainer = document.getElementById('orders-list');
    const emptyContainer = document.getElementById('orders-empty');

    listContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando pedidos...</p>
        </div>
    `;
    emptyContainer.style.display = 'none';

    if (!currentUser) {
        listContainer.innerHTML = '';
        emptyContainer.style.display = 'flex';
        return;
    }

    try {
        const q = query(
            collection(db, 'pedidos'),
            where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        const orders = [];
        querySnapshot.forEach(docSnap => {
            orders.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Ordenar por data (mais recente primeiro)
        orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        if (orders.length === 0) {
            listContainer.innerHTML = '';
            emptyContainer.style.display = 'flex';
            return;
        }

        emptyContainer.style.display = 'none';
        renderOrders(orders);

    } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        listContainer.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Erro ao carregar pedidos</p>
            </div>
        `;
    }
}

function renderOrders(orders) {
    const listContainer = document.getElementById('orders-list');

    const statusLabels = {
        'pending': { label: 'Aguardando Pagamento', class: 'pending' },
        'paid': { label: 'Pago', class: 'paid' },
        'shipped': { label: 'Enviado', class: 'shipped' },
        'delivered': { label: 'Entregue', class: 'delivered' },
        'cancelled': { label: 'Cancelado', class: 'cancelled' }
    };

    let html = '';

    orders.forEach(order => {
        const orderNumber = order.id.substring(0, 8).toUpperCase();
        const date = new Date(order.createdAt).toLocaleDateString('pt-BR');
        const status = statusLabels[order.status] || statusLabels['pending'];
        const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

        html += `
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
    });

    listContainer.innerHTML = html;
}

// Adicionar modais à lista de fechamento por click fora
window.onclick = function(event) {
    const modals = ['product-modal', 'login-modal', 'profile-modal', 'checkout-modal', 'orders-modal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCart();
        ['product-modal', 'login-modal', 'profile-modal', 'checkout-modal', 'orders-modal'].forEach(id => {
            const modal = document.getElementById(id);
            if (modal) modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
});
