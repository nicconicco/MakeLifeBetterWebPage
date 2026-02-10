# Contribuindo

Obrigado por contribuir. Este guia ajuda a manter o projeto consistente e facil de evoluir.

## Ambiente local
1. Configure o Firebase em `js/config/firebase.config.js`.
2. Use um servidor local (ex: Live Server) para abrir `store.html` e `index.html`.
3. Para Functions:
   - Entre em `functions/` e rode `npm install`.
   - Configure `functions/.env` baseado em `.env.example`.

## Organizacao do codigo
- UI e fluxo principal ficam em `js/modules/`.
- Acesso a dados sempre via `js/services/`.
- Utilitarios e helpers em `js/utils/`.
- Constantes globais em `js/config/constants.js`.

## Padroes e estilo
- Indentacao: 4 espacos (HTML/CSS/JS).
- Prefira funcoes pequenas e nomeadas.
- Log de erros: use `logError`/`logWarn` de `js/utils/logger.js`.

## Checklist rapido
- [ ] Sem segredos no front-end.
- [ ] Fluxos principais continuam funcionando (login, carrinho, checkout).
- [ ] UI responsiva e sem erros no console.
