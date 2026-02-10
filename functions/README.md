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

## Uso local (emulador)
- Copie `functions/.env.example` para `functions/.env` e preencha os valores.
- O arquivo `.env` nao deve ser commitado (ja esta no `.gitignore`).

## Produção (seguro)
- Configure variaveis no ambiente das Cloud Functions (ex: `firebase functions:config:set` ou variaveis de ambiente).
- Nunca coloque tokens privados no frontend.

## Observacoes
- Use `sandbox` ate validar todo o fluxo.
- O webhook valida a autenticidade via `x-authenticity-token`.
