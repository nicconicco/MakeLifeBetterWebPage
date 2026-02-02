// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
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

// Lista de emails de admin (você pode mover isso para o Firebase)
const ADMIN_EMAILS = ['admin@makelifebetter.com', 'carlos@makelifebetter.com'];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadStoreProducts();
    setupAuthListener();
    setupClickOutside();
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
    showToast('Funcionalidade de pedidos em desenvolvimento!', 'info');
}

window.showCart = function() {
    showToast('Carrinho em desenvolvimento!', 'info');
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
    showToast('Produto adicionado ao carrinho!', 'success');
    const count = document.getElementById('cart-count');
    count.textContent = parseInt(count.textContent) + 1;
}

window.addToCart = function(produtoId) {
    showToast('Produto adicionado ao carrinho!', 'success');
    const count = document.getElementById('cart-count');
    count.textContent = parseInt(count.textContent) + 1;
    closeProductModal();
}

window.buyNow = function(produtoId) {
    if (!currentUser) {
        showLoginModal();
        showToast('Faça login para continuar a compra', 'info');
        return;
    }
    showToast('Redirecionando para o checkout...', 'info');
}

window.notifyWhenAvailable = function(produtoId) {
    if (!currentUser) {
        showLoginModal();
        return;
    }
    showToast('Você será notificado quando o produto estiver disponível!', 'success');
    closeProductModal();
}

// Fechar modais
window.onclick = function(event) {
    const modals = ['product-modal', 'login-modal', 'profile-modal'];
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
        ['product-modal', 'login-modal', 'profile-modal'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    }
});

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
