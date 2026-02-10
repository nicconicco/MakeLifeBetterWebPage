/**
 * Community Sections Module
 * Handles events and public messages on the store page
 */

import { getAllEventos } from '../services/evento.service.js';
import { sendMessage, subscribeToMessages } from '../services/chat.service.js';
import { getCurrentUser, getCurrentUserData, isLoggedIn } from '../services/auth.service.js';
import {
    getElement,
    createLoadingSpinner,
    createEmptyState,
    createErrorState,
    showToast
} from '../utils/dom.js';
import { formatDate, formatDateTime } from '../utils/formatters.js';
import { TOAST_TYPES } from '../config/constants.js';
import { logError } from '../utils/logger.js';

const CATEGORY_LABELS = {
    agora: 'Agora',
    programado: 'Programado',
    novidade: 'Novidade',
    contato: 'Contato',
    cupom: 'Cupom',
    cerimonia: 'Cerimonia',
    intervalo: 'Intervalo',
    palestra: 'Palestra',
    refeicao: 'Refeicao',
    workshop: 'Workshop'
};

let messageFormBound = false;
let isSendingMessage = false;
let messagesUnsubscribe = null;

export function initCommunitySections() {
    loadEventos();
    loadMessages();
    bindMessageForm();
    updateMessageHint();
}

export function updateCommunityAuthState(userData) {
    updateMessageHint(userData);
}

async function loadEventos() {
    const list = getElement('events-list');
    if (!list) return;

    list.innerHTML = createLoadingSpinner('Carregando eventos...');

    try {
        const eventos = await getAllEventos();
        const ordered = [...eventos].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        updateEventsCount(ordered.length);

        if (!ordered.length) {
            list.innerHTML = createEmptyState('fa-calendar', 'Nenhum evento por aqui', 'Assim que houver novidades, elas aparecerao aqui.');
            return;
        }

        list.innerHTML = ordered.map(renderEventoCard).join('');
    } catch (error) {
        logError('Erro ao carregar eventos', error);
        list.innerHTML = createErrorState('Nao foi possivel carregar os eventos. Tente novamente.');
    }
}

function renderEventoCard(evento) {
    const title = evento.titulo || 'Evento sem titulo';
    const subtitle = evento.subtitulo || '';
    const description = evento.descricao || '';
    const categoryKey = (evento.categoria || '').toLowerCase();
    const badgeClass = categoryKey ? `event-badge event-badge--${categoryKey}` : 'event-badge';
    const badgeLabel = CATEGORY_LABELS[categoryKey] || 'Evento';

    const metaItems = [];
    if (evento.hora) {
        metaItems.push(`<span><i class="fas fa-clock"></i>${evento.hora}</span>`);
    }
    if (evento.lugar) {
        metaItems.push(`<span><i class="fas fa-map-marker-alt"></i>${evento.lugar}</span>`);
    }
    if (evento.createdAt) {
        metaItems.push(`<span><i class="fas fa-calendar"></i>${formatDate(evento.createdAt)}</span>`);
    }

    return `
        <article class="event-card">
            <div class="event-card-header">
                <span class="${badgeClass}">${badgeLabel}</span>
            </div>
            <h4 class="event-title">${title}</h4>
            ${subtitle ? `<p class="event-subtitle">${subtitle}</p>` : ''}
            ${description ? `<p class="event-description">${description}</p>` : ''}
            ${metaItems.length ? `<div class="event-meta">${metaItems.join('')}</div>` : ''}
        </article>
    `;
}

async function loadMessages() {
    const list = getElement('messages-list');
    if (!list) return;

    list.innerHTML = createLoadingSpinner('Carregando mensagens...');

    if (messagesUnsubscribe) {
        messagesUnsubscribe();
        messagesUnsubscribe = null;
    }

    const handleUpdate = (messages) => {
        const ordered = [...messages].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        updateMessagesCount(ordered.length);

        if (!ordered.length) {
            list.innerHTML = createEmptyState('fa-comments', 'Nenhuma mensagem ainda', 'Seja a primeira pessoa a publicar no mural.');
            return;
        }

        list.innerHTML = ordered.map(renderMessageItem).join('');
        list.scrollTop = list.scrollHeight;
    };

    const handleError = (error) => {
        logError('Erro ao carregar mensagens', error);
        list.innerHTML = createErrorState('Nao foi possivel carregar as mensagens. Tente novamente.');
    };

    messagesUnsubscribe = subscribeToMessages(handleUpdate, handleError);
}

function renderMessageItem(message) {
    const author = message.author || 'Anonimo';
    const time = message.timestamp ? formatDateTime(message.timestamp) : '-';
    const content = message.message || '';

    return `
        <div class="message-item">
            <div class="message-header">
                <span class="message-author">${author}</span>
                <span class="message-time">${time}</span>
            </div>
            <p class="message-content">${content}</p>
        </div>
    `;
}

function bindMessageForm() {
    const form = getElement('messages-form');
    if (!form || messageFormBound) return;

    messageFormBound = true;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (isSendingMessage) return;

        const input = getElement('message-input');
        const message = input?.value?.trim();

        if (!message) {
            showToast('Digite uma mensagem para publicar.', TOAST_TYPES.WARNING);
            return;
        }

        isSendingMessage = true;
        setMessageButtonState(true);

        try {
            await sendMessage(message);
            if (input) input.value = '';
            showToast('Mensagem publicada com sucesso!', TOAST_TYPES.SUCCESS);
        } catch (error) {
            logError('Erro ao publicar mensagem', error);
            showToast('Nao foi possivel publicar. Tente novamente.', TOAST_TYPES.ERROR);
        } finally {
            isSendingMessage = false;
            setMessageButtonState(false);
        }
    });
}

function setMessageButtonState(isSending) {
    const button = getElement('message-submit');
    if (!button) return;

    button.disabled = isSending;
    button.setAttribute('aria-busy', isSending ? 'true' : 'false');
}

function updateMessageHint(userData) {
    const hint = getElement('messages-hint');
    if (!hint) return;

    if (!isLoggedIn()) {
        hint.textContent = 'Voce esta publicando como anonimo. Faca login para usar seu nome.';
        return;
    }

    const currentUserData = userData || getCurrentUserData();
    const currentUser = getCurrentUser();
    const displayName = currentUserData?.username
        || currentUserData?.displayName
        || currentUser?.displayName
        || currentUser?.email?.split('@')[0]
        || 'Usuario';

    hint.textContent = `Publicando como ${displayName}.`;
}

function updateEventsCount(total) {
    const counter = getElement('events-count');
    if (!counter) return;
    counter.textContent = `${total} ${total === 1 ? 'evento' : 'eventos'}`;
}

function updateMessagesCount(total) {
    const counter = getElement('messages-count');
    if (!counter) return;
    counter.textContent = `${total} ${total === 1 ? 'mensagem' : 'mensagens'}`;
}
