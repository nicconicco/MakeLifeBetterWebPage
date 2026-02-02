/**
 * Admin Users Module
 * Handles users UI in admin panel
 */
import {
    createUserDoc,
    getAllUsers,
    deleteUserDoc
} from '../../services/user.service.js';
import { formatDateTime } from '../../utils/formatters.js';

/**
 * Add a new user
 */
export async function addUser() {
    const username = document.getElementById('user-username').value;
    const email = document.getElementById('user-email').value;

    if (!username || !email) {
        alert('Por favor, preencha username e email!');
        return;
    }

    try {
        await createUserDoc({ username, email });
        clearUserForm();
        await loadUsers();
        alert('Usuario adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar usuario: ' + error.message);
    }
}

/**
 * Clear user form
 */
function clearUserForm() {
    document.getElementById('user-username').value = '';
    document.getElementById('user-email').value = '';
}

/**
 * Load and render all users
 */
export async function loadUsers() {
    const list = document.getElementById('users-list');
    if (!list) return;

    try {
        const users = await getAllUsers();

        if (users.length === 0) {
            list.innerHTML = '<p class="no-data">Nenhum usuario encontrado.</p>';
            return;
        }

        list.innerHTML = users.map(user => {
            const date = user.createdAt ? formatDateTime(user.createdAt) : 'N/A';

            return `
                <div class="item">
                    <h3>${user.username || 'Sem username'}</h3>
                    <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                    <p><strong>ID:</strong> ${user.id || user.docId}</p>
                    ${user.role ? `<p><strong>Role:</strong> <span class="badge">${user.role}</span></p>` : ''}
                    <div class="item-meta">
                        Criado em: ${date}
                    </div>
                    <button class="delete-btn" data-type="users" data-id="${user.docId}">Deletar</button>
                </div>
            `;
        }).join('');

        // Bind delete buttons
        bindUserButtons(list);
    } catch (error) {
        alert('Erro ao carregar usuarios: ' + error.message);
    }
}

/**
 * Bind user buttons with event delegation
 * @param {HTMLElement} container
 */
function bindUserButtons(container) {
    container.querySelectorAll('.delete-btn[data-type="users"]').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Tem certeza que deseja deletar este usuario?')) return;

            try {
                await deleteUserDoc(btn.dataset.id);
                await loadUsers();
                alert('Usuario deletado com sucesso!');
            } catch (error) {
                alert('Erro ao deletar usuario: ' + error.message);
            }
        };
    });
}
