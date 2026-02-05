/**
 * Admin App Module
 * Main orchestrator for admin panel
 */
import { auth } from '../../config/firebase.config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Import auth module
import {
    register,
    login,
    logout,
    updateAuthUI
} from './admin-auth.js';

// Import tabs module
import {
    showTab,
    onTabChange,
    initTabs,
    getCurrentTab
} from './admin-tabs.js';

// Import entity modules
import { addEvento, loadEventos } from './admin-eventos.js';
import { addEventLocation, loadEventLocations, showAddContactForm } from './admin-locations.js';
import { addDuvida, loadDuvidas, viewRespostas, showReplyForm, hideReplyForm, submitResposta } from './admin-duvidas.js';
import { addChatMessage, loadChatMessages } from './admin-chat.js';
import { addUser, loadUsers } from './admin-users.js';
import {
    initProdutoForm,
    addOrUpdateProduto,
    clearProdutoForm,
    loadProdutos,
    filterProdutos,
    editProduto,
    toggleProdutoStatus,
    deleteProduto,
    popularProdutosExemplo,
    deletarTodosProdutos
} from './admin-produtos.js';
import {
    initBannerForm,
    loadBanners,
    addBanners
} from './admin-banners.js';

/**
 * Load data for current tab
 * @param {string} tabName - The tab name
 */
function loadCurrentTabData(tabName) {
    switch (tabName) {
        case 'eventos':
            loadEventos();
            break;
        case 'event_location':
            loadEventLocations();
            break;
        case 'duvidas':
            loadDuvidas();
            break;
        case 'lista_geral':
            loadChatMessages();
            break;
        case 'users':
            loadUsers();
            break;
        case 'produtos':
            loadProdutos();
            break;
        case 'banners':
            loadBanners();
            break;
    }
}

/**
 * Setup authentication state listener
 */
function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        const isLoggedIn = !!user;
        updateAuthUI(isLoggedIn);

        if (isLoggedIn) {
            loadCurrentTabData(getCurrentTab());
        }
    });
}

/**
 * Expose functions globally for HTML onclick handlers
 */
function exposeGlobalFunctions() {
    // Auth
    window.register = register;
    window.login = login;
    window.logout = logout;

    // Tabs
    window.showTab = showTab;

    // Eventos
    window.addEvento = addEvento;

    // Event Locations
    window.addEventLocation = addEventLocation;
    window.showAddContactForm = showAddContactForm;

    // Duvidas
    window.addDuvida = addDuvida;
    window.viewRespostas = viewRespostas;
    window.showReplyForm = showReplyForm;
    window.hideReplyForm = hideReplyForm;
    window.addResposta = submitResposta;

    // Chat
    window.addListaGeral = addChatMessage;

    // Users
    window.addUser = addUser;

    // Produtos
    window.addOrUpdateProduto = addOrUpdateProduto;
    window.cancelEditProduto = clearProdutoForm;
    window.filterProdutos = filterProdutos;
    window.editProduto = editProduto;
    window.toggleProdutoStatus = toggleProdutoStatus;
    window.deleteProduto = deleteProduto;
    window.popularProdutosExemplo = popularProdutosExemplo;
    window.deletarTodosProdutos = deletarTodosProdutos;

    // Banners
    window.addBanners = addBanners;

    // Generic delete (for backwards compatibility)
    window.deleteItem = async function(collectionName, itemId) {
        if (!confirm('Tem certeza que deseja deletar este item?')) return;

        // Map collection names to appropriate delete functions and loaders
        const actions = {
            eventos: { delete: () => import('../../services/evento.service.js').then(m => m.deleteEvento(itemId)), load: loadEventos },
            event_location: { delete: () => import('../../services/event-location.service.js').then(m => m.deleteEventLocation(itemId)), load: loadEventLocations },
            duvidas: { delete: () => import('../../services/duvida.service.js').then(m => m.deleteDuvida(itemId)), load: loadDuvidas },
            lista_geral: { delete: () => import('../../services/chat.service.js').then(m => m.deleteMessage(itemId)), load: loadChatMessages },
            users: { delete: () => import('../../services/user.service.js').then(m => m.deleteUserDoc(itemId)), load: loadUsers },
            produtos: { delete: () => import('../../services/product.service.js').then(m => m.deleteProduct(itemId)), load: loadProdutos }
        };

        const action = actions[collectionName];
        if (!action) {
            alert('Colecao desconhecida: ' + collectionName);
            return;
        }

        try {
            await action.delete();
            await action.load();
            alert('Item deletado com sucesso!');
        } catch (error) {
            alert('Erro ao deletar item: ' + error.message);
        }
    };
}

/**
 * Initialize admin application
 */
export function initAdminApp() {
    // Setup tab change callback
    onTabChange(loadCurrentTabData);

    // Initialize tabs
    initTabs();

    // Initialize product form listeners
    initProdutoForm();
    initBannerForm();

    // Expose global functions
    exposeGlobalFunctions();

    // Setup auth listener (will trigger initial data load)
    setupAuthListener();

    console.log('Admin App initialized');
}
