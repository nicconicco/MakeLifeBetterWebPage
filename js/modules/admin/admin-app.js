/**
 * Admin App Module
 * Main orchestrator for admin panel
 */
import { auth } from '../../config/firebase.config.js';
import {
    onAuthStateChanged,
    updatePassword
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Import auth module
import {
    register,
    login,
    logout,
    updateAuthUI
} from './admin-auth.js';

import { isAdminEmail } from '../../services/auth.service.js';

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
    deletarTodosProdutos,
    downloadProdutosExcelTemplate,
    importProdutosExcel
} from './admin-produtos.js';
import {
    initBannerForm,
    loadBanners,
    addBanners
} from './admin-banners.js';
import { logInfo } from '../../utils/logger.js';

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
        case 'produtos':
            loadProdutos();
            break;
        case 'banners':
            loadBanners();
            break;
        case 'minha_conta':
            loadAccountInfo();
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
 * Load account info into the Minha Conta tab
 */
function loadAccountInfo() {
    const user = auth.currentUser;
    if (!user) return;

    const admin = isAdminEmail(user.email);

    const emailEl = document.getElementById('account-email');
    const roleEl = document.getElementById('account-role');
    const uidEl = document.getElementById('account-uid');

    if (emailEl) emailEl.textContent = user.email || '—';
    if (roleEl) {
        roleEl.textContent = admin ? 'Administrador' : 'Usuário';
        roleEl.className = 'account-role ' + (admin ? 'role-admin' : 'role-user');
    }
    if (uidEl) uidEl.textContent = user.uid || '—';
}

/**
 * Update account password
 */
async function updateAccountPassword() {
    const newPass = document.getElementById('account-new-password').value;
    const confirmPass = document.getElementById('account-confirm-password').value;

    if (!newPass || newPass.length < 6) {
        alert('A senha deve ter no mínimo 6 caracteres.');
        return;
    }
    if (newPass !== confirmPass) {
        alert('As senhas não coincidem.');
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Nenhum usuário logado.');

        await updatePassword(user, newPass);

        document.getElementById('account-new-password').value = '';
        document.getElementById('account-confirm-password').value = '';
        alert('Senha atualizada com sucesso!');
    } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
            alert('Por segurança, faça logout e login novamente antes de alterar a senha.');
        } else {
            alert('Erro ao atualizar senha: ' + error.message);
        }
    }
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


    // Produtos
    window.addOrUpdateProduto = addOrUpdateProduto;
    window.cancelEditProduto = clearProdutoForm;
    window.filterProdutos = filterProdutos;
    window.editProduto = editProduto;
    window.toggleProdutoStatus = toggleProdutoStatus;
    window.deleteProduto = deleteProduto;
    window.popularProdutosExemplo = popularProdutosExemplo;
    window.deletarTodosProdutos = deletarTodosProdutos;
    window.downloadProdutosExcelTemplate = downloadProdutosExcelTemplate;
    window.importProdutosExcel = importProdutosExcel;

    // Banners
    window.addBanners = addBanners;

    // Minha Conta
    window.updateAccountPassword = updateAccountPassword;

    // Generic delete (for backwards compatibility)
    window.deleteItem = async function(collectionName, itemId) {
        if (!confirm('Tem certeza que deseja deletar este item?')) return;

        // Map collection names to appropriate delete functions and loaders
        const actions = {
            eventos: { delete: () => import('../../services/evento.service.js').then(m => m.deleteEvento(itemId)), load: loadEventos },
            event_location: { delete: () => import('../../services/event-location.service.js').then(m => m.deleteEventLocation(itemId)), load: loadEventLocations },
            duvidas: { delete: () => import('../../services/duvida.service.js').then(m => m.deleteDuvida(itemId)), load: loadDuvidas },
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

    logInfo('Admin App initialized');
}
