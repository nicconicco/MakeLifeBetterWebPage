# Cloud Functions (PagBank)

Este diretorio contem as funcoes HTTP para integrar o checkout PagBank.

## Funcoes
- `createPagBankCheckout`: cria um pedido no Firestore e inicia o checkout no PagBank.
- `pagbankWebhook`: recebe notificacoes e atualiza o status do pedido.

## Variaveis de ambiente
- `PAGBANK_TOKEN`: token privado da conta PagBank.
- `PAGBANK_ENV`: `sandbox` ou `production` (padrao: `sandbox`).
- `STORE_BASE_URL`: base do site (ex: `https://seu-dominio.com`).
- `ALLOWED_ORIGINS`: lista de origens liberadas (opcional).
- `FUNCTIONS_BASE_URL`: base das funcoes (opcional).

## Observacoes
- Use `sandbox` ate validar todo o fluxo.
- O webhook valida a autenticidade via `x-authenticity-token`.
