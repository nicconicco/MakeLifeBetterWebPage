/**
 * Store Main Entry Point
 * Initializes the store application.
 * Uses dynamic import to catch Firebase config loading failures.
 */

function showStoreError() {
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao conectar</h3>
                <p>Não foi possível carregar a loja. Verifique sua conexão e tente novamente.</p>
                <button onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { initStoreApp } = await import('./modules/store-app.js');
        initStoreApp();
    } catch (error) {
        console.error('Falha ao inicializar a loja:', error);
        showStoreError();
    }
});
