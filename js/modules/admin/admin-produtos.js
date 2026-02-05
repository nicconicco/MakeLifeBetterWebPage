/**
 * Admin Produtos Module
 * Handles produtos UI in admin panel
 */
import {
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from '../../services/product.service.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

// State
let allProdutos = [];
let categoriasSet = new Set();

// Sample products data
const produtosExemplo = [
    {
        nome: "Bera Aurora Lager 355ml",
        descricao: "Lager leve e refrescante, notas de pao e final seco. Ideal para dias quentes.",
        preco: 12.90,
        precoPromocional: 9.90,
        imagem: "https://cdn.awsli.com.br/300x300/2272/2272022/produto/208223082/pilsen1-uexpcw.jpg",
        categoria: "LAGER",
        estoque: 80,
        ativo: true
    },
    {
        nome: "Bera Maracuja Solar IPA 473ml",
        descricao: "IPA aromatica com lupulos citricos e tropicais, amargor medio e final resinoso.",
        preco: 24.90,
        precoPromocional: 21.90,
        imagem: "https://cdn.awsli.com.br/300x300/2272/2272022/produto/208210311/allday-ekjolp.jpg",
        categoria: "IPA",
        estoque: 60,
        ativo: true
    },
    {
        nome: "Bera Noite de Cacau Stout 473ml",
        descricao: "Stout cremosa com notas de cafe, cacau e leve tostado. Corpo medio e espuma persistente.",
        preco: 26.90,
        precoPromocional: null,
        imagem: "https://cdn.awsli.com.br/300x300/2272/2272022/produto/208210333/dry-stout-cnxnjv.jpg",
        categoria: "ESCURAS",
        estoque: 40,
        ativo: true
    },
    {
        nome: "Bera Trigo Dourado Weiss 500ml",
        descricao: "Weiss classica com notas de banana e cravo, corpo macio e final levemente adocicado.",
        preco: 19.90,
        precoPromocional: 16.90,
        imagem: "https://cdn.awsli.com.br/300x300/2272/2272022/produto/208210521/moooo-pcdymv.jpg",
        categoria: "WEISS / WIT",
        estoque: 55,
        ativo: true
    },
    {
        nome: "Bera Frutas Vermelhas Sour 473ml",
        descricao: "Sour com acidez equilibrada, frutas vermelhas e final super refrescante.",
        preco: 27.90,
        precoPromocional: 23.90,
        imagem: "https://cdn.awsli.com.br/300x300/2272/2272022/produto/208210160/swamp1-vmrmwz.jpg",
        categoria: "SOUR / B WEISSE",
        estoque: 35,
        ativo: true
    },
    {
        nome: "Bera Mosteiro Belgian Blond 500ml",
        descricao: "Belgian Blond com esteres frutados, especiarias sutis e calor alcoolico suave.",
        preco: 29.90,
        precoPromocional: null,
        imagem: "https://cdn.awsli.com.br/300x300/2272/2272022/produto/220455274/bock2-ubilzqbc14.png",
        categoria: "BELGAS",
        estoque: 30,
        ativo: true
    }
];

/**
 * Initialize product form listeners
 */
export function initProdutoForm() {
    const imagemInput = document.getElementById('produto-imagem');
    if (imagemInput) {
        imagemInput.addEventListener('input', function() {
            const preview = document.getElementById('produto-imagem-preview');
            const url = this.value;
            if (url) {
                preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<p class=\\'error\\'>Imagem nao encontrada</p>'">`;
            } else {
                preview.innerHTML = '';
            }
        });
    }
}

/**
 * Add or update a product
 */
export async function addOrUpdateProduto() {
    const editId = document.getElementById('produto-edit-id').value;
    const nome = document.getElementById('produto-nome').value;
    const descricao = document.getElementById('produto-descricao').value;
    const preco = document.getElementById('produto-preco').value;
    const precoPromocional = document.getElementById('produto-preco-promocional').value;
    const imagem = document.getElementById('produto-imagem').value;
    const categoria = document.getElementById('produto-categoria').value;
    const estoque = document.getElementById('produto-estoque').value;
    const ativo = document.getElementById('produto-ativo').value === 'true';

    if (!nome || !preco) {
        alert('Por favor, preencha pelo menos o nome e o preco!');
        return;
    }

    const produtoData = {
        nome,
        descricao: descricao || '',
        preco: parseFloat(preco),
        precoPromocional: precoPromocional ? parseFloat(precoPromocional) : null,
        imagem: imagem || '',
        categoria: categoria || 'Geral',
        estoque: estoque ? parseInt(estoque) : 0,
        ativo
    };

    try {
        if (editId) {
            await updateProduct(editId, produtoData);
            alert('Produto atualizado com sucesso!');
        } else {
            await createProduct(produtoData);
            alert('Produto adicionado com sucesso!');
        }

        clearProdutoForm();
        await loadProdutos();
    } catch (error) {
        alert('Erro ao salvar produto: ' + error.message);
    }
}

/**
 * Clear product form
 */
export function clearProdutoForm() {
    document.getElementById('produto-edit-id').value = '';
    document.getElementById('produto-nome').value = '';
    document.getElementById('produto-descricao').value = '';
    document.getElementById('produto-preco').value = '';
    document.getElementById('produto-preco-promocional').value = '';
    document.getElementById('produto-imagem').value = '';
    document.getElementById('produto-categoria').value = '';
    document.getElementById('produto-estoque').value = '';
    document.getElementById('produto-ativo').value = 'true';
    document.getElementById('produto-imagem-preview').innerHTML = '';
    document.getElementById('produto-submit-btn').textContent = 'Adicionar Produto';
    document.getElementById('produto-cancel-btn').style.display = 'none';
}

/**
 * Load and render all products
 */
export async function loadProdutos() {
    const list = document.getElementById('produtos-list');
    if (!list) return;

    try {
        allProdutos = await getAllProducts();
        categoriasSet = new Set();

        if (allProdutos.length === 0) {
            list.innerHTML = '<p class="no-data">Nenhum produto encontrado. Adicione seu primeiro produto!</p>';
            return;
        }

        // Collect categories
        allProdutos.forEach(produto => {
            if (produto.categoria) {
                categoriasSet.add(produto.categoria);
            }
        });

        // Update category filter
        updateCategoriasFilter();

        // Render products
        renderProdutos(allProdutos);
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        alert('Erro ao carregar produtos: ' + error.message);
    }
}

/**
 * Update category filter dropdown
 */
function updateCategoriasFilter() {
    const select = document.getElementById('produtos-filter-categoria');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Todas as categorias</option>';

    categoriasSet.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });

    select.value = currentValue;
}

/**
 * Render products grid
 * @param {Array} produtos - Products to render
 */
function renderProdutos(produtos) {
    const list = document.getElementById('produtos-list');

    if (produtos.length === 0) {
        list.innerHTML = '<p class="no-data">Nenhum produto encontrado com os filtros aplicados.</p>';
        return;
    }

    list.innerHTML = produtos.map(produto => {
        const precoFormatado = formatCurrency(produto.preco);
        const precoPromoFormatado = produto.precoPromocional ? formatCurrency(produto.precoPromocional) : null;
        const date = produto.createdAt ? formatDate(produto.createdAt) : 'N/A';

        return `
            <div class="produto-card ${!produto.ativo ? 'inativo' : ''}">
                <div class="produto-image">
                    ${produto.imagem ?
                        `<img src="${produto.imagem}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/200x200?text=Sem+Imagem'">` :
                        '<div class="no-image">Sem imagem</div>'}
                    ${!produto.ativo ? '<span class="status-badge inativo">Inativo</span>' : ''}
                    ${produto.precoPromocional ? '<span class="status-badge promo">Promocao</span>' : ''}
                </div>
                <div class="produto-info">
                    <h3>${produto.nome || 'Sem nome'}</h3>
                    <p class="produto-categoria">${produto.categoria || 'Sem categoria'}</p>
                    <p class="produto-descricao">${produto.descricao || ''}</p>
                    <div class="produto-preco">
                        ${precoPromoFormatado ?
                            `<span class="preco-original">${precoFormatado}</span><span class="preco-promo">${precoPromoFormatado}</span>` :
                            `<span class="preco">${precoFormatado}</span>`}
                    </div>
                    <p class="produto-estoque">Estoque: ${produto.estoque || 0} unidades</p>
                    <p class="produto-data">Criado em: ${date}</p>
                </div>
                <div class="produto-actions">
                    <button class="edit-btn" data-id="${produto.id}">Editar</button>
                    <button class="toggle-btn ${produto.ativo ? 'desativar' : 'ativar'}" data-id="${produto.id}" data-status="${!produto.ativo}">
                        ${produto.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button class="delete-btn" data-type="produtos" data-id="${produto.id}">Excluir</button>
                </div>
            </div>
        `;
    }).join('');

    // Bind buttons
    bindProdutoButtons(list);
}

/**
 * Bind product buttons
 * @param {HTMLElement} container
 */
function bindProdutoButtons(container) {
    // Edit buttons
    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = () => editProduto(btn.dataset.id);
    });

    // Toggle buttons
    container.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.onclick = () => toggleProdutoStatus(btn.dataset.id, btn.dataset.status === 'true');
    });

    // Delete buttons
    container.querySelectorAll('.delete-btn[data-type="produtos"]').forEach(btn => {
        btn.onclick = () => deleteProduto(btn.dataset.id);
    });
}

/**
 * Filter products
 */
export function filterProdutos() {
    const searchTerm = document.getElementById('produtos-search').value.toLowerCase();
    const categoriaFilter = document.getElementById('produtos-filter-categoria').value;
    const statusFilter = document.getElementById('produtos-filter-status').value;

    let filtered = allProdutos;

    // Filter by text
    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.nome && p.nome.toLowerCase().includes(searchTerm)) ||
            (p.descricao && p.descricao.toLowerCase().includes(searchTerm))
        );
    }

    // Filter by category
    if (categoriaFilter) {
        filtered = filtered.filter(p => p.categoria === categoriaFilter);
    }

    // Filter by status
    if (statusFilter !== '') {
        const isAtivo = statusFilter === 'true';
        filtered = filtered.filter(p => p.ativo === isAtivo);
    }

    renderProdutos(filtered);
}

/**
 * Edit a product
 * @param {string} produtoId - Product ID
 */
export function editProduto(produtoId) {
    const produto = allProdutos.find(p => p.id === produtoId);
    if (!produto) {
        alert('Produto nao encontrado!');
        return;
    }

    document.getElementById('produto-edit-id').value = produtoId;
    document.getElementById('produto-nome').value = produto.nome || '';
    document.getElementById('produto-descricao').value = produto.descricao || '';
    document.getElementById('produto-preco').value = produto.preco || '';
    document.getElementById('produto-preco-promocional').value = produto.precoPromocional || '';
    document.getElementById('produto-imagem').value = produto.imagem || '';
    document.getElementById('produto-categoria').value = produto.categoria || '';
    document.getElementById('produto-estoque').value = produto.estoque || '';
    document.getElementById('produto-ativo').value = produto.ativo ? 'true' : 'false';

    // Image preview
    const preview = document.getElementById('produto-imagem-preview');
    if (produto.imagem) {
        preview.innerHTML = `<img src="${produto.imagem}" alt="Preview">`;
    }

    document.getElementById('produto-submit-btn').textContent = 'Atualizar Produto';
    document.getElementById('produto-cancel-btn').style.display = 'inline-block';

    // Scroll to form
    document.querySelector('.produto-form').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Toggle product status
 * @param {string} produtoId - Product ID
 * @param {boolean} novoStatus - New status
 */
export async function toggleProdutoStatus(produtoId, novoStatus) {
    try {
        await updateProduct(produtoId, { ativo: novoStatus });
        await loadProdutos();
    } catch (error) {
        alert('Erro ao alterar status: ' + error.message);
    }
}

/**
 * Delete a product
 * @param {string} produtoId - Product ID
 */
export async function deleteProduto(produtoId) {
    if (!confirm('Tem certeza que deseja excluir este produto? Esta acao nao pode ser desfeita.')) {
        return;
    }

    try {
        await deleteProduct(produtoId);
        await loadProdutos();
        alert('Produto excluido com sucesso!');
    } catch (error) {
        alert('Erro ao excluir produto: ' + error.message);
    }
}

/**
 * Populate with sample products
 */
export async function popularProdutosExemplo() {
    if (!confirm('Isso ira adicionar produtos de exemplo. Deseja continuar?')) {
        return;
    }

    const list = document.getElementById('produtos-list');
    list.innerHTML = '<p class="loading">Adicionando produtos de exemplo...</p>';

    try {
        let count = 0;
        for (const produto of produtosExemplo) {
            await createProduct({
                ...produto,
                createdAt: Date.now() - (count * 60000)
            });
            count++;
        }

        await loadProdutos();
        alert(`${count} produtos de exemplo adicionados com sucesso!`);
    } catch (error) {
        alert('Erro ao adicionar produtos: ' + error.message);
        await loadProdutos();
    }
}

/**
 * Delete all products
 */
export async function deletarTodosProdutos() {
    if (!confirm('ATENCAO: Isso ira excluir TODOS os produtos! Esta acao nao pode ser desfeita. Deseja continuar?')) {
        return;
    }

    if (!confirm('Tem CERTEZA ABSOLUTA? Todos os produtos serao perdidos permanentemente!')) {
        return;
    }

    const list = document.getElementById('produtos-list');
    list.innerHTML = '<p class="loading">Excluindo todos os produtos...</p>';

    try {
        let count = 0;
        for (const produto of allProdutos) {
            await deleteProduct(produto.id);
            count++;
        }

        await loadProdutos();
        alert(`${count} produtos excluidos com sucesso!`);
    } catch (error) {
        alert('Erro ao excluir produtos: ' + error.message);
        await loadProdutos();
    }
}
