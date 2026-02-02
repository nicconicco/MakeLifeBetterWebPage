/**
 * Admin Locations Module
 * Handles event locations UI in admin panel
 */
import {
    createEventLocation,
    getAllLocationsWithContacts,
    deleteEventLocation,
    addLocationContact
} from '../../services/event-location.service.js';

/**
 * Add a new event location
 */
export async function addEventLocation() {
    const name = document.getElementById('location-name').value;
    const address = document.getElementById('location-address').value;
    const city = document.getElementById('location-city').value;
    const latitude = document.getElementById('location-latitude').value;
    const longitude = document.getElementById('location-longitude').value;

    if (!name || !address || !city) {
        alert('Por favor, preencha pelo menos nome, endereco e cidade!');
        return;
    }

    try {
        await createEventLocation({
            name,
            address,
            city,
            latitude,
            longitude
        });

        clearLocationForm();
        await loadEventLocations();
        alert('Local adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar local: ' + error.message);
    }
}

/**
 * Clear location form
 */
function clearLocationForm() {
    document.getElementById('location-name').value = '';
    document.getElementById('location-address').value = '';
    document.getElementById('location-city').value = '';
    document.getElementById('location-latitude').value = '';
    document.getElementById('location-longitude').value = '';
}

/**
 * Load and render all event locations
 */
export async function loadEventLocations() {
    const list = document.getElementById('event_location-list');
    if (!list) return;

    try {
        const locations = await getAllLocationsWithContacts();

        if (locations.length === 0) {
            list.innerHTML = '<p class="no-data">Nenhum local encontrado.</p>';
            return;
        }

        list.innerHTML = locations.map(location => {
            const contactsHtml = renderContacts(location.contacts);

            return `
                <div class="item">
                    <h3>${location.name || 'Sem nome'}</h3>
                    <p><strong>Endereco:</strong> ${location.address || 'N/A'}</p>
                    <p><strong>Cidade:</strong> ${location.city || 'N/A'}</p>
                    ${location.latitude && location.longitude ?
                        `<p><strong>Coordenadas:</strong> ${location.latitude}, ${location.longitude}</p>` : ''}
                    ${contactsHtml}
                    <button class="add-contact-btn" data-location-id="${location.id}">Adicionar Contato</button>
                    <button class="delete-btn" data-type="locations" data-id="${location.id}">Deletar</button>
                </div>
            `;
        }).join('');

        // Bind buttons
        bindLocationButtons(list);
    } catch (error) {
        alert('Erro ao carregar locais: ' + error.message);
    }
}

/**
 * Render contacts HTML
 * @param {Array} contacts - Array of contacts
 * @returns {string} - HTML string
 */
function renderContacts(contacts) {
    if (!contacts || contacts.length === 0) return '';

    return `
        <div class="contacts-section">
            <h4>Contatos:</h4>
            <ul>
                ${contacts.map(contact =>
                    `<li><strong>${contact.name || 'N/A'}:</strong> ${contact.phone || 'N/A'}</li>`
                ).join('')}
            </ul>
        </div>
    `;
}

/**
 * Bind location buttons with event delegation
 * @param {HTMLElement} container
 */
function bindLocationButtons(container) {
    // Delete buttons
    container.querySelectorAll('.delete-btn[data-type="locations"]').forEach(btn => {
        btn.onclick = async () => {
            if (!confirm('Tem certeza que deseja deletar este local?')) return;

            try {
                await deleteEventLocation(btn.dataset.id);
                await loadEventLocations();
                alert('Local deletado com sucesso!');
            } catch (error) {
                alert('Erro ao deletar local: ' + error.message);
            }
        };
    });

    // Add contact buttons
    container.querySelectorAll('.add-contact-btn').forEach(btn => {
        btn.onclick = () => showAddContactForm(btn.dataset.locationId);
    });
}

/**
 * Show add contact form (using prompt for simplicity)
 * @param {string} locationId - The location ID
 */
export async function showAddContactForm(locationId) {
    const contactName = prompt('Nome do contato:');
    if (!contactName) return;

    const contactPhone = prompt('Telefone do contato:');
    if (!contactPhone) return;

    try {
        await addLocationContact(locationId, {
            name: contactName,
            phone: contactPhone
        });
        await loadEventLocations();
        alert('Contato adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar contato: ' + error.message);
    }
}
