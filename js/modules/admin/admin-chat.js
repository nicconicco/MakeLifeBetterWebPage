/**
 * Admin Chat Module
 * Handles chat (lista_geral) UI in admin panel
 */
import {
    sendMessage,
    getAllMessages,
    deleteMessage
} from '../../services/chat.service.js';
import { formatDateTime } from '../../utils/formatters.js';

/**
 * Add a new chat message
 */
export async function addChatMessage() {
    const messageInput = document.getElementById('chat-message');
    const message = messageInput?.value;

    if (!message?.trim()) {
        alert('Por favor, escreva uma mensagem!');
        return;
    }

    try {
        await sendMessage(message);
        messageInput.value = '';
        await loadChatMessages();
    } catch (error) {
        alert('Erro ao enviar mensagem: ' + error.message);
    }
}

/**
 * Load and render all chat messages
 */
export async function loadChatMessages() {
    const list = document.getElementById('lista_geral-list');
    if (!list) return;

    try {
        const messages = await getAllMessages();

        if (messages.length === 0) {
            list.innerHTML = '<p class="no-data">Nenhuma mensagem ainda. Comece a conversa!</p>';
            return;
        }

        list.innerHTML = messages.map(msg => {
            const date = msg.timestamp ? formatDateTime(msg.timestamp) : '';

            return `
                <div class="chat-message">
                    <div class="chat-header">
                        <strong>${msg.author || 'Anonimo'}</strong>
                        <span class="chat-time">${date}</span>
                    </div>
                    <p class="chat-content">${msg.message || ''}</p>
                    <button class="delete-btn small" data-type="chat" data-id="${msg.id}">x</button>
                </div>
            `;
        }).join('');

        // Bind delete buttons
        bindChatButtons(list);

        // Scroll to bottom
        list.scrollTop = list.scrollHeight;
    } catch (error) {
        alert('Erro ao carregar mensagens: ' + error.message);
    }
}

/**
 * Bind chat buttons with event delegation
 * @param {HTMLElement} container
 */
function bindChatButtons(container) {
    container.querySelectorAll('.delete-btn[data-type="chat"]').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Tem certeza que deseja deletar esta mensagem?')) return;

            try {
                await deleteMessage(btn.dataset.id);
                await loadChatMessages();
            } catch (error) {
                alert('Erro ao deletar mensagem: ' + error.message);
            }
        };
    });
}
