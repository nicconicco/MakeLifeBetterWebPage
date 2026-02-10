# MakeLifeBetterWebPage — GitHub Pages

Plataforma web que combina e-commerce, eventos e comunidade, pronta para publicação via GitHub Pages.

## Demo

Depois de publicar no GitHub Pages, o site ficará disponível em:

- `https://nicconicco.github.io/MakeLifeBetterWebPage/`
- Loja: `https://nicconicco.github.io/MakeLifeBetterWebPage/store.html`

Se o nome do repositório for diferente, ajuste a URL para `https://nicconicco.github.io/<nome-do-repo>/`.

## Visão geral

O projeto possui duas interfaces principais:

- **Loja virtual pública** (`store.html`)
- **Painel administrativo** (`index.html`)

## Funcionalidades

**Loja (público)**
- Catálogo com filtros por categoria
- Carrinho com persistência local
- Checkout com múltiplos meios de pagamento
- Opções de entrega (normal, expressa e same-day)
- Conta do usuário e histórico de pedidos

**Painel administrativo**
- Gestão de produtos e estoque
- Gestão de eventos e categorias
- Cadastro de locais com endereço e coordenadas
- Q&A com respostas aninhadas
- Chat geral em tempo real
- Gestão de usuários

## Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Bibliotecas**: Font Awesome, Google Fonts

## Estrutura do projeto

```
MakeLifeBetterWebPage/
├── index.html          # Painel administrativo
├── store.html          # Loja virtual
├── style.css           # Estilos principais
├── css/                # Estilos específicos dos componentes
├── js/
│   ├── config/         # Configurações (Firebase, constantes)
│   ├── services/       # Lógica de negócio (Auth, Produtos, Carrinho, etc.)
│   ├── modules/        # Módulos de UI
│   └── utils/          # Funções auxiliares
└── README.md
```

## Documentacao de engenharia

- `docs/ARCHITECTURE.md` — visao geral da arquitetura e fluxos.
- `docs/SECURITY.md` — recomendacoes de seguranca e regras.
- `CONTRIBUTING.md` — guia rapido para contribuir.

## Publicar no GitHub Pages

1. No GitHub, acesse **Settings → Pages**
2. Em **Build and deployment**, selecione:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` e pasta `/ (root)`
3. Salve e aguarde a publicação

A página será publicada usando `index.html` como entrada principal.

## Rodar localmente

1. Clone o repositório
2. Configure as credenciais do Firebase em `js/config/firebase.config.js`
3. Abra `store.html` (loja) ou `index.html` (admin)
4. Use um servidor local (ex: Live Server) para evitar problemas de CORS

## Seguranca e chaves

- A configuracao do Firebase no frontend nao e segredo, mas as regras do Firestore/Storage devem estar bem restritas.
- Tokens privados (PagBank/Rede) devem ficar apenas no backend (`functions/`) via variaveis de ambiente.
- Existe um exemplo em `functions/.env.example` e um `.gitignore` para evitar commit acidental de segredos.

## Debug rapido

Para habilitar logs informativos no navegador:
`localStorage.setItem('mlb_debug', 'true')`
(para desativar: `localStorage.removeItem('mlb_debug')`)

## PagBank (checkout real) — Cloud Functions

Para pagamentos reais com PagBank, existe um backend em `functions/`:

1. Instale as dependências na pasta `functions`
2. Configure variáveis de ambiente:
   - `PAGBANK_TOKEN` (token privado da conta PagBank)
   - `PAGBANK_ENV` (`sandbox` ou `production`)
   - `STORE_BASE_URL` (ex: `https://seu-dominio.com`)
   - `ALLOWED_ORIGINS` (opcional, lista separada por vírgula)
   - `FUNCTIONS_BASE_URL` (opcional, se não usar o padrão do Firebase)
3. Faça o deploy das Cloud Functions

No frontend, a chave `ACTIVE_PAYMENT_PROVIDER` em `js/config/constants.js` define o modo:
- `mock`: checkout simulado (padrão)
- `pagbank`: redireciona ao PagBank (requer backend configurado)

## Licença

Este projeto é para uso educacional e pessoal.
