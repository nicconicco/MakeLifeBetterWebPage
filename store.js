// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Configuração do Firebase (mesma do admin)
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

// Armazena todos os produtos
let allProducts = [];
let categorias = new Set();

// Carregar produtos ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadStoreProducts();
});

// Carregar produtos ativos da loja
async function loadStoreProducts() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '<p class="loading">Carregando produtos...</p>';

    try {
        // Buscar todos os produtos e filtrar no cliente (evita necessidade de índice)
        const querySnapshot = await getDocs(collection(db, 'produtos'));

        allProducts = [];
        categorias = new Set();

        querySnapshot.forEach((docSnap) => {
            const produto = { id: docSnap.id, ...docSnap.data() };
            // Filtrar apenas produtos ativos no cliente
            if (produto.ativo !== false) {
                allProducts.push(produto);
                if (produto.categoria) {
                    categorias.add(produto.categoria);
                }
            }
        });

        console.log('Produtos carregados:', allProducts.length);

        // Ordenar por mais recentes
        allProducts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Atualizar dropdown de categorias
        updateCategoriaDropdown();

        // Renderizar produtos
        renderProducts(allProducts);

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        grid.innerHTML = '<p class="error">Erro ao carregar produtos. Tente novamente mais tarde.</p>';

        // Tentar sem filtro de ativo
        try {
            const querySnapshot = await getDocs(collection(db, 'produtos'));
            allProducts = [];

            querySnapshot.forEach((docSnap) => {
                const produto = { id: docSnap.id, ...docSnap.data() };
                if (produto.ativo !== false) {
                    allProducts.push(produto);
                    if (produto.categoria) {
                        categorias.add(produto.categoria);
                    }
                }
            });

            allProducts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            updateCategoriaDropdown();
            renderProducts(allProducts);
        } catch (err) {
            grid.innerHTML = '<p class="error">Erro ao carregar produtos: ' + err.message + '</p>';
        }
    }
}

// Atualizar dropdown de categorias
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

// Renderizar produtos na grid
function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p class="no-products">Nenhum produto encontrado.</p>';
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
                    '<div class="placeholder-image">Sem imagem</div>'}
                ${desconto > 0 ? `<span class="discount-badge">-${desconto}%</span>` : ''}
            </div>
            <div class="product-details">
                <span class="product-category">${produto.categoria || 'Geral'}</span>
                <h3 class="product-name">${produto.nome}</h3>
                <p class="product-description">${truncateText(produto.descricao, 80)}</p>
                <div class="product-price">
                    ${precoPromoFormatado ?
                        `<span class="original-price">${precoFormatado}</span>
                         <span class="promo-price">${precoPromoFormatado}</span>` :
                        `<span class="price">${precoFormatado}</span>`}
                </div>
                ${produto.estoque > 0 ?
                    `<span class="stock in-stock">Em estoque (${produto.estoque})</span>` :
                    '<span class="stock out-of-stock">Indisponível</span>'}
            </div>
        `;

        grid.appendChild(card);
    });
}

// Truncar texto
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Filtrar produtos
window.filterStoreProducts = function() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoria = document.getElementById('categoria-filter').value;
    const ordenar = document.getElementById('ordenar-filter').value;

    let filtered = [...allProducts];

    // Filtrar por busca
    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.nome && p.nome.toLowerCase().includes(searchTerm)) ||
            (p.descricao && p.descricao.toLowerCase().includes(searchTerm)) ||
            (p.categoria && p.categoria.toLowerCase().includes(searchTerm))
        );
    }

    // Filtrar por categoria
    if (categoria) {
        filtered = filtered.filter(p => p.categoria === categoria);
    }

    // Ordenar
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
        case 'recentes':
        default:
            filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            break;
    }

    renderProducts(filtered);
}

// Abrir modal do produto
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
                    `<img src="${produto.imagem}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/400x400?text=Sem+Imagem'">` :
                    '<div class="placeholder-image large">Sem imagem</div>'}
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
                        `<span class="stock-status available">Disponível - ${produto.estoque} unidades em estoque</span>` :
                        '<span class="stock-status unavailable">Produto indisponível no momento</span>'}
                </div>

                <div class="modal-actions">
                    ${produto.estoque > 0 ?
                        `<button class="btn-buy" onclick="alert('Funcionalidade de compra em desenvolvimento!')">
                            Comprar Agora
                        </button>
                        <button class="btn-cart" onclick="alert('Carrinho em desenvolvimento!')">
                            Adicionar ao Carrinho
                        </button>` :
                        '<button class="btn-notify">Avise-me quando disponível</button>'}
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Fechar modal
window.closeProductModal = function() {
    const modal = document.getElementById('product-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('product-modal');
    if (event.target === modal) {
        closeProductModal();
    }
}

// Fechar modal com ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeProductModal();
    }
});
