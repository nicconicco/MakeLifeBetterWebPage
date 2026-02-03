# MakeLifeBetter - Plataforma de E-commerce e Eventos

## Português

### Sobre o Projeto

MakeLifeBetter é uma plataforma web completa que combina e-commerce com gerenciamento de eventos e funcionalidades de comunidade. O sistema possui duas interfaces principais: uma loja virtual pública e um painel administrativo.

### Funcionalidades

#### Loja Virtual (Público)
- **Catálogo de Produtos**: Navegação por produtos com filtros por categoria
- **Carrinho de Compras**: Adicionar/remover produtos com persistência local
- **Checkout**: Múltiplas formas de pagamento (Cartão de Crédito, Débito, PIX, Boleto)
- **Opções de Entrega**: Normal, Express e Entrega no Mesmo Dia
- **Conta do Usuário**: Cadastro, login e histórico de pedidos

#### Painel Administrativo
- **Gerenciamento de Produtos**: Criar, editar e excluir produtos com controle de estoque
- **Gerenciamento de Eventos**: Criar e organizar eventos com categorias diversas
- **Locais de Eventos**: Cadastro de locais com endereço e coordenadas
- **Sistema de Dúvidas (Q&A)**: Perguntas e respostas com sistema de respostas aninhadas
- **Chat Geral**: Comunicação em tempo real
- **Gerenciamento de Usuários**: Administração de contas de usuários

### Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Bibliotecas**: Font Awesome, Google Fonts (Inter)
- **Arquitetura**: Modular com separação de responsabilidades

### Estrutura do Projeto

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

### Como Executar

1. Clone o repositório
2. Configure as credenciais do Firebase em `js/config/firebase.config.js`
3. Abra `store.html` para acessar a loja ou `index.html` para o painel admin
4. Use um servidor local (ex: Live Server) para evitar problemas de CORS

---

## English

### About the Project

MakeLifeBetter is a complete web platform that combines e-commerce with event management and community features. The system has two main interfaces: a public online store and an administrative dashboard.

### Features

#### Online Store (Public)
- **Product Catalog**: Browse products with category filters
- **Shopping Cart**: Add/remove products with local persistence
- **Checkout**: Multiple payment methods (Credit Card, Debit Card, PIX, Bank Slip)
- **Delivery Options**: Normal, Express, and Same-Day Delivery
- **User Account**: Registration, login, and order history

#### Admin Dashboard
- **Product Management**: Create, edit, and delete products with inventory control
- **Event Management**: Create and organize events with various categories
- **Event Locations**: Register locations with address and coordinates
- **Q&A System**: Questions and answers with nested reply system
- **General Chat**: Real-time communication
- **User Management**: User account administration

### Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Libraries**: Font Awesome, Google Fonts (Inter)
- **Architecture**: Modular with separation of concerns

### Project Structure

```
MakeLifeBetterWebPage/
├── index.html          # Admin dashboard
├── store.html          # Online store
├── style.css           # Main styles
├── css/                # Component-specific styles
├── js/
│   ├── config/         # Configuration (Firebase, constants)
│   ├── services/       # Business logic (Auth, Products, Cart, etc.)
│   ├── modules/        # UI modules
│   └── utils/          # Helper functions
└── README.md
```

### How to Run

1. Clone the repository
2. Configure Firebase credentials in `js/config/firebase.config.js`
3. Open `store.html` to access the store or `index.html` for the admin panel
4. Use a local server (e.g., Live Server) to avoid CORS issues

---

## License

This project is for educational and personal use.
