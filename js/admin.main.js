/**
 * Admin Main Entry Point
 * Initializes the admin application.
 * Uses dynamic import to catch Firebase config loading failures.
 */

function showError(message) {
    const loadingSection = document.getElementById('loading-section');
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');

    if (loadingSection) loadingSection.style.display = 'none';
    if (errorSection) errorSection.style.display = '';
    if (errorMessage && message) errorMessage.textContent = message;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { initAdminApp } = await import('./modules/admin/admin-app.js');
        initAdminApp();
    } catch (error) {
        console.error('Falha ao inicializar aplicação:', error);
        showError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
    }
});
