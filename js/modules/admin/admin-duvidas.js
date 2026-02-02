/**
 * Admin Duvidas Module
 * Handles duvidas (questions) UI in admin panel
 */
import {
    createDuvida,
    getAllDuvidas,
    deleteDuvida,
    addResposta,
    getRespostas
} from '../../services/duvida.service.js';
import { formatDateTime } from '../../utils/formatters.js';

/**
 * Add a new duvida
 */
export async function addDuvida() {
    const title = document.getElementById('duvida-title').value;
    const description = document.getElementById('duvida-description').value;

    if (!title || !description) {
        alert('Por favor, preencha o titulo e a descricao!');
        return;
    }

    try {
        await createDuvida({ title, description });
        clearDuvidaForm();
        await loadDuvidas();
        alert('Duvida adicionada com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar duvida: ' + error.message);
    }
}

/**
 * Clear duvida form
 */
function clearDuvidaForm() {
    document.getElementById('duvida-title').value = '';
    document.getElementById('duvida-description').value = '';
}

/**
 * Load and render all duvidas
 */
export async function loadDuvidas() {
    const list = document.getElementById('duvidas-list');
    if (!list) return;

    try {
        const duvidas = await getAllDuvidas();

        if (duvidas.length === 0) {
            list.innerHTML = '<p class="no-data">Nenhuma duvida encontrada.</p>';
            return;
        }

        list.innerHTML = duvidas.map(duvida => {
            const date = duvida.timestamp ? formatDateTime(duvida.timestamp) : 'N/A';
            const safeTitle = (duvida.title || '').replace(/'/g, "\\'");

            return `
                <div class="item duvida-item">
                    <h3>${duvida.title || 'Sem titulo'}</h3>
                    <p class="description">${duvida.description || 'Sem descricao'}</p>
                    <div class="item-meta">
                        <span><strong>Autor:</strong> ${duvida.author || 'Anonimo'}</span>
                        <span><strong>Respostas:</strong> ${duvida.replies || 0}</span>
                        <span><strong>Data:</strong> ${date}</span>
                    </div>
                    <div class="item-actions">
                        <button class="view-btn" data-id="${duvida.id}" data-title="${safeTitle}">Ver Respostas</button>
                        <button class="reply-btn" data-id="${duvida.id}">Responder</button>
                        <button class="delete-btn" data-type="duvidas" data-id="${duvida.id}">Deletar</button>
                    </div>
                    <div id="respostas-${duvida.id}" class="respostas-container" style="display:none;"></div>
                    <div id="reply-form-${duvida.id}" class="reply-form" style="display:none;">
                        <textarea id="reply-content-${duvida.id}" placeholder="Escreva sua resposta..."></textarea>
                        <button class="submit-reply-btn" data-id="${duvida.id}">Enviar Resposta</button>
                        <button class="cancel-reply-btn" data-id="${duvida.id}">Cancelar</button>
                    </div>
                </div>
            `;
        }).join('');

        // Bind buttons
        bindDuvidaButtons(list);
    } catch (error) {
        alert('Erro ao carregar duvidas: ' + error.message);
    }
}

/**
 * Bind duvida buttons with event delegation
 * @param {HTMLElement} container
 */
function bindDuvidaButtons(container) {
    // Delete buttons
    container.querySelectorAll('.delete-btn[data-type="duvidas"]').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Tem certeza que deseja deletar esta duvida?')) return;

            try {
                await deleteDuvida(btn.dataset.id);
                await loadDuvidas();
                alert('Duvida deletada com sucesso!');
            } catch (error) {
                alert('Erro ao deletar duvida: ' + error.message);
            }
        };
    });

    // View respostas buttons
    container.querySelectorAll('.view-btn').forEach(btn => {
        btn.onclick = () => viewRespostas(btn.dataset.id, btn.dataset.title);
    });

    // Reply buttons
    container.querySelectorAll('.reply-btn').forEach(btn => {
        btn.onclick = () => showReplyForm(btn.dataset.id);
    });

    // Submit reply buttons
    container.querySelectorAll('.submit-reply-btn').forEach(btn => {
        btn.onclick = () => submitResposta(btn.dataset.id);
    });

    // Cancel reply buttons
    container.querySelectorAll('.cancel-reply-btn').forEach(btn => {
        btn.onclick = () => hideReplyForm(btn.dataset.id);
    });
}

/**
 * View respostas for a duvida
 * @param {string} duvidaId - The duvida ID
 * @param {string} title - The duvida title
 */
export async function viewRespostas(duvidaId, title) {
    const container = document.getElementById(`respostas-${duvidaId}`);
    if (!container) return;

    // Toggle visibility
    if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = '<p>Carregando respostas...</p>';
    container.style.display = 'block';

    try {
        const respostas = await getRespostas(duvidaId);

        if (respostas.length === 0) {
            container.innerHTML = '<p class="no-data">Nenhuma resposta ainda. Seja o primeiro a responder!</p>';
            return;
        }

        container.innerHTML = `
            <h4>Respostas para: "${title}"</h4>
            ${respostas.map(resposta => {
                const date = resposta.timestamp ? formatDateTime(resposta.timestamp) : 'N/A';
                return `
                    <div class="resposta-item">
                        <p class="resposta-content">${resposta.content || 'Sem conteudo'}</p>
                        <div class="resposta-meta">
                            <span><strong>Por:</strong> ${resposta.author || 'Anonimo'}</span>
                            <span><strong>Em:</strong> ${date}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    } catch (error) {
        container.innerHTML = '<p class="error">Erro ao carregar respostas: ' + error.message + '</p>';
    }
}

/**
 * Show reply form
 * @param {string} duvidaId - The duvida ID
 */
export function showReplyForm(duvidaId) {
    const form = document.getElementById(`reply-form-${duvidaId}`);
    if (form) {
        form.style.display = 'block';
    }
}

/**
 * Hide reply form
 * @param {string} duvidaId - The duvida ID
 */
export function hideReplyForm(duvidaId) {
    const form = document.getElementById(`reply-form-${duvidaId}`);
    const textarea = document.getElementById(`reply-content-${duvidaId}`);

    if (form) form.style.display = 'none';
    if (textarea) textarea.value = '';
}

/**
 * Submit a resposta
 * @param {string} duvidaId - The duvida ID
 */
export async function submitResposta(duvidaId) {
    const content = document.getElementById(`reply-content-${duvidaId}`).value;

    if (!content.trim()) {
        alert('Por favor, escreva uma resposta!');
        return;
    }

    try {
        await addResposta(duvidaId, content);
        hideReplyForm(duvidaId);
        await loadDuvidas();
        alert('Resposta adicionada com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar resposta: ' + error.message);
    }
}
