# Arquitetura

## Visao geral
O projeto e um front-end estatico (loja + admin) com Firebase como backend (Auth, Firestore e Storage). Para pagamentos reais, ha Cloud Functions em `functions/`.

## Componentes principais
- `store.html` + `js/modules/store-app.js`: experiencia da loja, carrinho e checkout.
- `index.html` + `js/modules/admin/*`: painel administrativo e manutencao de conteudo.
- `js/services/*`: camada de acesso a dados (Firestore/Storage/Auth).
- `js/config/*`: configuracoes e constantes.
- `functions/index.js`: endpoints de pagamento (PagBank/Rede) e webhook.

## Colecoes do Firestore
- `users`: perfil do usuario, favoritos e metadados.
- `produtos`: catalogo da loja.
- `pedidos`: pedidos e status de pagamento/entrega.
- `eventos`, `event_location`: conteudo de eventos.
- `duvidas` + subcolecao `respostas`: Q&A.
- `lista_geral`: chat publico.
- `banners`: midia do hero da loja.

## Fluxos principais
- Loja:
  - `store-app` carrega `produtos`, `banners` e inicializa carrinho + checkout.
  - Carrinho e pedidos usam `order.service.js` + `payment.service.js`.
- Admin:
  - `admin-app` controla tabs e carrega entidades sob demanda.
  - Cada modulo admin chama o service correspondente.
- Pagamentos:
  - Front-end chama `createPagBankCheckout` (Functions) com token do usuario.
  - Webhook atualiza o status do pedido.

## Observabilidade basica
- Logs do browser ficam centralizados no `js/utils/logger.js`.
- Para habilitar logs informativos: `localStorage.setItem('mlb_debug', 'true')`.

## Deployment
- GitHub Pages publica `index.html` (admin) e `store.html` (loja).
- Cloud Functions sao deployadas separadamente via Firebase CLI.
