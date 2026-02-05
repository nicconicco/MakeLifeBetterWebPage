/**
 * Admin Banners Module
 * Handles banner upload and management
 */

import {
    getAllBanners,
    uploadBanner,
    deleteBanner
} from '../../services/banner.service.js';

let bannerPreviewUrls = [];

/**
 * Initialize banner form listeners
 */
export function initBannerForm() {
    const input = document.getElementById('banner-files');
    if (!input) return;

    input.addEventListener('change', () => {
        renderBannerPreview(Array.from(input.files || []));
    });
}

/**
 * Load and render all banners
 */
export async function loadBanners() {
    const list = document.getElementById('banners-list');
    if (!list) return;

    try {
        const banners = await getAllBanners();
        if (banners.length === 0) {
            list.innerHTML = '<p class="no-data">Nenhum banner encontrado. Adicione o primeiro banner!</p>';
            return;
        }

        const escapeHtml = (value = '') => String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        list.innerHTML = banners.map(banner => `
            <div class="banner-card">
                <img src="${banner.imageUrl}" alt="Banner" onerror="this.src='https://via.placeholder.com/400x180?text=Sem+Imagem'">
                <div class="banner-actions">
                    <span class="banner-name">${escapeHtml(banner.originalName || 'Banner')}</span>
                    <button class="delete-btn" data-id="${banner.id}" data-path="${banner.storagePath || ''}">Excluir</button>
                </div>
            </div>
        `).join('');

        bindBannerButtons(list);
    } catch (error) {
        console.error('Erro ao carregar banners:', error);
        list.innerHTML = '<p class="error">Erro ao carregar banners.</p>';
    }
}

/**
 * Add banners from file input
 */
export async function addBanners() {
    const input = document.getElementById('banner-files');
    const files = Array.from(input?.files || []);

    if (files.length === 0) {
        alert('Selecione pelo menos uma imagem para o banner.');
        return;
    }

    const list = document.getElementById('banners-list');
    if (list) {
        list.innerHTML = '<p class="loading">Enviando banners...</p>';
    }

    try {
        let count = 0;
        for (const file of files) {
            await uploadBanner(file);
            count++;
        }

        input.value = '';
        clearBannerPreview();
        await loadBanners();
        alert(`${count} banner${count > 1 ? 's' : ''} adicionado${count > 1 ? 's' : ''} com sucesso!`);
    } catch (error) {
        console.error('Erro ao adicionar banners:', error);
        alert('Erro ao adicionar banners: ' + error.message);
        await loadBanners();
    }
}

/**
 * Delete a banner
 * @param {string} bannerId
 * @param {string} storagePath
 */
async function handleDeleteBanner(bannerId, storagePath) {
    if (!confirm('Tem certeza que deseja excluir este banner?')) {
        return;
    }

    try {
        await deleteBanner(bannerId, storagePath);
        await loadBanners();
        alert('Banner excluido com sucesso!');
    } catch (error) {
        alert('Erro ao excluir banner: ' + error.message);
    }
}

function bindBannerButtons(container) {
    container.querySelectorAll('.delete-btn[data-id]').forEach(btn => {
        btn.onclick = () => handleDeleteBanner(btn.dataset.id, btn.dataset.path);
    });
}

function renderBannerPreview(files) {
    const preview = document.getElementById('banner-preview');
    if (!preview) return;

    clearBannerPreview();

    if (files.length === 0) {
        preview.innerHTML = '';
        return;
    }

    files.forEach(file => {
        const url = URL.createObjectURL(file);
        bannerPreviewUrls.push(url);

        const item = document.createElement('div');
        item.className = 'banner-preview-item';
        item.innerHTML = `
            <img src="${url}" alt="Preview">
            <span>${file.name}</span>
        `;
        preview.appendChild(item);
    });
}

function clearBannerPreview() {
    bannerPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    bannerPreviewUrls = [];
    const preview = document.getElementById('banner-preview');
    if (preview) {
        preview.innerHTML = '';
    }
}
