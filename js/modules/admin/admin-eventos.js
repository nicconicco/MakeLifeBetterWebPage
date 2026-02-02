/**
 * Admin Eventos Module
 * Handles eventos UI in admin panel
 */
import {
    createEvento,
    getAllEventos,
    deleteEvento
} from '../../services/evento.service.js';

/**
 * Add a new evento
 */
export async function addEvento() {
    const titulo = document.getElementById('evento-titulo').value;
    const subtitulo = document.getElementById('evento-subtitulo').value;
    const descricao = document.getElementById('evento-descricao').value;
    const hora = document.getElementById('evento-hora').value;
    const lugar = document.getElementById('evento-lugar').value;
    const categoria = document.getElementById('evento-categoria').value;

    if (!titulo || !hora || !lugar) {
        alert('Por favor, preencha pelo menos titulo, hora e lugar!');
        return;
    }

    try {
        await createEvento({
            titulo,
            subtitulo,
            descricao,
            hora,
            lugar,
            categoria
        });

        clearEventoForm();
        await loadEventos();
        alert('Evento adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar evento: ' + error.message);
    }
}

/**
 * Clear evento form
 */
function clearEventoForm() {
    document.getElementById('evento-titulo').value = '';
    document.getElementById('evento-subtitulo').value = '';
    document.getElementById('evento-descricao').value = '';
    document.getElementById('evento-hora').value = '';
    document.getElementById('evento-lugar').value = '';
    document.getElementById('evento-categoria').value = '';
}

/**
 * Load and render all eventos
 */
export async function loadEventos() {
    const list = document.getElementById('eventos-list');
    if (!list) return;

    try {
        const eventos = await getAllEventos();

        if (eventos.length === 0) {
            list.innerHTML = '<p class="no-data">Nenhum evento encontrado.</p>';
            return;
        }

        list.innerHTML = eventos.map(evento => `
            <div class="item">
                <h3>${evento.titulo || 'Sem titulo'}</h3>
                ${evento.subtitulo ? `<p class="subtitle">${evento.subtitulo}</p>` : ''}
                ${evento.descricao ? `<p><strong>Descricao:</strong> ${evento.descricao}</p>` : ''}
                <p><strong>Hora:</strong> ${evento.hora || 'N/A'}</p>
                <p><strong>Lugar:</strong> ${evento.lugar || 'N/A'}</p>
                ${evento.categoria ? `<p><strong>Categoria:</strong> <span class="badge">${evento.categoria}</span></p>` : ''}
                <button class="delete-btn" data-type="eventos" data-id="${evento.id}">Deletar</button>
            </div>
        `).join('');

        // Bind delete buttons
        bindDeleteButtons(list);
    } catch (error) {
        alert('Erro ao carregar eventos: ' + error.message);
    }
}

/**
 * Bind delete buttons with event delegation
 * @param {HTMLElement} container
 */
function bindDeleteButtons(container) {
    container.querySelectorAll('.delete-btn[data-type="eventos"]').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Tem certeza que deseja deletar este item?')) return;

            try {
                await deleteEvento(btn.dataset.id);
                await loadEventos();
                alert('Item deletado com sucesso!');
            } catch (error) {
                alert('Erro ao deletar item: ' + error.message);
            }
        };
    });
}
