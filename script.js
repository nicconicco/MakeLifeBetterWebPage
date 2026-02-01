// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, increment } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDcHBBJC1BHAIDO8vSGQsNSN3y_e6sTmBM",
  authDomain: "makelifebetter-7f3c9.firebaseapp.com",
  projectId: "makelifebetter-7f3c9",
  storageBucket: "makelifebetter-7f3c9.firebasestorage.app",
  messagingSenderId: "749904577078",
  appId: "1:749904577078:web:3235cbb8e26ffaabba0e97",
  measurementId: "G-ZPNC0MZ1T7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Elementos do DOM
const authSection = document.getElementById('auth-section');
const mainSection = document.getElementById('main-section');

// Estado atual da aba
let currentTab = 'eventos';

// Verificar estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        authSection.style.display = 'none';
        mainSection.style.display = 'block';
        loadCurrentTabData();
    } else {
        authSection.style.display = 'block';
        mainSection.style.display = 'none';
    }
});

// Funções de autenticação
window.register = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Usuário registrado com sucesso!');
    } catch (error) {
        alert('Erro ao registrar: ' + error.message);
    }
}

window.login = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Login realizado com sucesso!');
    } catch (error) {
        alert('Erro ao fazer login: ' + error.message);
    }
}

window.logout = async function() {
    try {
        await signOut(auth);
        alert('Logout realizado com sucesso!');
    } catch (error) {
        alert('Erro ao fazer logout: ' + error.message);
    }
}

// Função para trocar de aba
window.showTab = function(tabName, evt) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remover classe active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar aba selecionada
    document.getElementById(tabName + '-tab').classList.add('active');

    // Ativar botão correspondente
    const clickedBtn = evt ? evt.target : document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    currentTab = tabName;
    loadCurrentTabData();
}

// Carregar dados da aba atual
function loadCurrentTabData() {
    switch(currentTab) {
        case 'eventos':
            loadEventos();
            break;
        case 'event_location':
            loadEventLocations();
            break;
        case 'duvidas':
            loadDuvidas();
            break;
        case 'lista_geral':
            loadListaGeral();
            break;
        case 'users':
            loadUsers();
            break;
        case 'produtos':
            loadProdutos();
            break;
    }
}

// ============================================
// CRUD para Eventos
// Estrutura Firebase: titulo, subtitulo, descricao, hora, lugar, categoria
// ============================================
window.addEvento = async function() {
    const titulo = document.getElementById('evento-titulo').value;
    const subtitulo = document.getElementById('evento-subtitulo').value;
    const descricao = document.getElementById('evento-descricao').value;
    const hora = document.getElementById('evento-hora').value;
    const lugar = document.getElementById('evento-lugar').value;
    const categoria = document.getElementById('evento-categoria').value;

    if (!titulo || !hora || !lugar) {
        alert('Por favor, preencha pelo menos título, hora e lugar!');
        return;
    }

    try {
        await addDoc(collection(db, 'eventos'), {
            titulo,
            subtitulo: subtitulo || '',
            descricao: descricao || '',
            hora,
            lugar,
            categoria: categoria || ''
        });

        clearEventoForm();
        loadEventos();
        alert('Evento adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar evento: ' + error.message);
    }
}

function clearEventoForm() {
    document.getElementById('evento-titulo').value = '';
    document.getElementById('evento-subtitulo').value = '';
    document.getElementById('evento-descricao').value = '';
    document.getElementById('evento-hora').value = '';
    document.getElementById('evento-lugar').value = '';
    document.getElementById('evento-categoria').value = '';
}

async function loadEventos() {
    try {
        const querySnapshot = await getDocs(collection(db, 'eventos'));
        const list = document.getElementById('eventos-list');
        list.innerHTML = '';

        if (querySnapshot.empty) {
            list.innerHTML = '<p class="no-data">Nenhum evento encontrado.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const evento = docSnap.data();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.innerHTML = `
                <h3>${evento.titulo || 'Sem título'}</h3>
                ${evento.subtitulo ? `<p class="subtitle">${evento.subtitulo}</p>` : ''}
                ${evento.descricao ? `<p><strong>Descrição:</strong> ${evento.descricao}</p>` : ''}
                <p><strong>Hora:</strong> ${evento.hora || 'N/A'}</p>
                <p><strong>Lugar:</strong> ${evento.lugar || 'N/A'}</p>
                ${evento.categoria ? `<p><strong>Categoria:</strong> <span class="badge">${evento.categoria}</span></p>` : ''}
                <button class="delete-btn" onclick="deleteItem('eventos', '${docSnap.id}')">Deletar</button>
            `;
            list.appendChild(itemDiv);
        });
    } catch (error) {
        alert('Erro ao carregar eventos: ' + error.message);
    }
}

// ============================================
// CRUD para Event Location
// Estrutura Firebase: name, address, city, latitude, longitude
// Subcoleção: contacts (name, phone)
// ============================================
window.addEventLocation = async function() {
    const name = document.getElementById('location-name').value;
    const address = document.getElementById('location-address').value;
    const city = document.getElementById('location-city').value;
    const latitude = document.getElementById('location-latitude').value;
    const longitude = document.getElementById('location-longitude').value;

    if (!name || !address || !city) {
        alert('Por favor, preencha pelo menos nome, endereço e cidade!');
        return;
    }

    try {
        await addDoc(collection(db, 'event_location'), {
            name,
            address,
            city,
            latitude: latitude ? parseFloat(latitude) : 0,
            longitude: longitude ? parseFloat(longitude) : 0
        });

        clearLocationForm();
        loadEventLocations();
        alert('Local adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar local: ' + error.message);
    }
}

function clearLocationForm() {
    document.getElementById('location-name').value = '';
    document.getElementById('location-address').value = '';
    document.getElementById('location-city').value = '';
    document.getElementById('location-latitude').value = '';
    document.getElementById('location-longitude').value = '';
}

async function loadEventLocations() {
    try {
        const querySnapshot = await getDocs(collection(db, 'event_location'));
        const list = document.getElementById('event_location-list');
        list.innerHTML = '';

        if (querySnapshot.empty) {
            list.innerHTML = '<p class="no-data">Nenhum local encontrado.</p>';
            return;
        }

        for (const docSnap of querySnapshot.docs) {
            const location = docSnap.data();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';

            // Carregar contatos da subcoleção
            let contactsHtml = '';
            try {
                const contactsSnapshot = await getDocs(collection(db, 'event_location', docSnap.id, 'contacts'));
                if (!contactsSnapshot.empty) {
                    contactsHtml = '<div class="contacts-section"><h4>Contatos:</h4><ul>';
                    contactsSnapshot.forEach((contactDoc) => {
                        const contact = contactDoc.data();
                        contactsHtml += `<li><strong>${contact.name || 'N/A'}:</strong> ${contact.phone || 'N/A'}</li>`;
                    });
                    contactsHtml += '</ul></div>';
                }
            } catch (e) {
                console.log('Sem contatos para este local');
            }

            itemDiv.innerHTML = `
                <h3>${location.name || 'Sem nome'}</h3>
                <p><strong>Endereço:</strong> ${location.address || 'N/A'}</p>
                <p><strong>Cidade:</strong> ${location.city || 'N/A'}</p>
                ${location.latitude && location.longitude ? `<p><strong>Coordenadas:</strong> ${location.latitude}, ${location.longitude}</p>` : ''}
                ${contactsHtml}
                <button class="add-contact-btn" onclick="showAddContactForm('${docSnap.id}')">Adicionar Contato</button>
                <button class="delete-btn" onclick="deleteItem('event_location', '${docSnap.id}')">Deletar</button>
            `;
            list.appendChild(itemDiv);
        }
    } catch (error) {
        alert('Erro ao carregar locais: ' + error.message);
    }
}

// Adicionar contato a um local
window.showAddContactForm = function(locationId) {
    const contactName = prompt('Nome do contato:');
    if (!contactName) return;

    const contactPhone = prompt('Telefone do contato:');
    if (!contactPhone) return;

    addContact(locationId, contactName, contactPhone);
}

async function addContact(locationId, name, phone) {
    try {
        await addDoc(collection(db, 'event_location', locationId, 'contacts'), {
            name,
            phone
        });
        loadEventLocations();
        alert('Contato adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar contato: ' + error.message);
    }
}

// ============================================
// CRUD para Dúvidas (Questions)
// Estrutura Firebase: title, description, author, replies, timestamp
// Subcoleção: respostas (author, content, timestamp)
// ============================================
window.addDuvida = async function() {
    const title = document.getElementById('duvida-title').value;
    const description = document.getElementById('duvida-description').value;

    if (!title || !description) {
        alert('Por favor, preencha o título e a descrição!');
        return;
    }

    // Pegar username do usuário atual (ou usar email como fallback)
    const currentUser = auth.currentUser;
    const author = currentUser.displayName || currentUser.email.split('@')[0];

    try {
        await addDoc(collection(db, 'duvidas'), {
            title,
            description,
            author,
            replies: 0,
            timestamp: Date.now()
        });

        clearDuvidaForm();
        loadDuvidas();
        alert('Dúvida adicionada com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar dúvida: ' + error.message);
    }
}

function clearDuvidaForm() {
    document.getElementById('duvida-title').value = '';
    document.getElementById('duvida-description').value = '';
}

async function loadDuvidas() {
    try {
        const q = query(collection(db, 'duvidas'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const list = document.getElementById('duvidas-list');
        list.innerHTML = '';

        if (querySnapshot.empty) {
            list.innerHTML = '<p class="no-data">Nenhuma dúvida encontrada.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const duvida = docSnap.data();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item duvida-item';

            // Formatar timestamp
            const date = duvida.timestamp ? new Date(duvida.timestamp).toLocaleString('pt-BR') : 'N/A';

            itemDiv.innerHTML = `
                <h3>${duvida.title || 'Sem título'}</h3>
                <p class="description">${duvida.description || 'Sem descrição'}</p>
                <div class="item-meta">
                    <span><strong>Autor:</strong> ${duvida.author || 'Anônimo'}</span>
                    <span><strong>Respostas:</strong> ${duvida.replies || 0}</span>
                    <span><strong>Data:</strong> ${date}</span>
                </div>
                <div class="item-actions">
                    <button class="view-btn" onclick="viewRespostas('${docSnap.id}', '${(duvida.title || '').replace(/'/g, "\\'")}')">Ver Respostas</button>
                    <button class="reply-btn" onclick="showReplyForm('${docSnap.id}')">Responder</button>
                    <button class="delete-btn" onclick="deleteItem('duvidas', '${docSnap.id}')">Deletar</button>
                </div>
                <div id="respostas-${docSnap.id}" class="respostas-container" style="display:none;"></div>
                <div id="reply-form-${docSnap.id}" class="reply-form" style="display:none;">
                    <textarea id="reply-content-${docSnap.id}" placeholder="Escreva sua resposta..."></textarea>
                    <button onclick="addResposta('${docSnap.id}')">Enviar Resposta</button>
                    <button onclick="hideReplyForm('${docSnap.id}')">Cancelar</button>
                </div>
            `;
            list.appendChild(itemDiv);
        });
    } catch (error) {
        console.error('Erro ao carregar dúvidas:', error);
        // Tentar sem ordenação se falhar
        try {
            const querySnapshot = await getDocs(collection(db, 'duvidas'));
            const list = document.getElementById('duvidas-list');
            list.innerHTML = '';

            if (querySnapshot.empty) {
                list.innerHTML = '<p class="no-data">Nenhuma dúvida encontrada.</p>';
                return;
            }

            querySnapshot.forEach((docSnap) => {
                const duvida = docSnap.data();
                const itemDiv = document.createElement('div');
                itemDiv.className = 'item duvida-item';

                const date = duvida.timestamp ? new Date(duvida.timestamp).toLocaleString('pt-BR') : 'N/A';

                itemDiv.innerHTML = `
                    <h3>${duvida.title || 'Sem título'}</h3>
                    <p class="description">${duvida.description || 'Sem descrição'}</p>
                    <div class="item-meta">
                        <span><strong>Autor:</strong> ${duvida.author || 'Anônimo'}</span>
                        <span><strong>Respostas:</strong> ${duvida.replies || 0}</span>
                        <span><strong>Data:</strong> ${date}</span>
                    </div>
                    <div class="item-actions">
                        <button class="view-btn" onclick="viewRespostas('${docSnap.id}', '${(duvida.title || '').replace(/'/g, "\\'")}')">Ver Respostas</button>
                        <button class="reply-btn" onclick="showReplyForm('${docSnap.id}')">Responder</button>
                        <button class="delete-btn" onclick="deleteItem('duvidas', '${docSnap.id}')">Deletar</button>
                    </div>
                    <div id="respostas-${docSnap.id}" class="respostas-container" style="display:none;"></div>
                    <div id="reply-form-${docSnap.id}" class="reply-form" style="display:none;">
                        <textarea id="reply-content-${docSnap.id}" placeholder="Escreva sua resposta..."></textarea>
                        <button onclick="addResposta('${docSnap.id}')">Enviar Resposta</button>
                        <button onclick="hideReplyForm('${docSnap.id}')">Cancelar</button>
                    </div>
                `;
                list.appendChild(itemDiv);
            });
        } catch (error2) {
            alert('Erro ao carregar dúvidas: ' + error2.message);
        }
    }
}

// Visualizar respostas de uma dúvida
window.viewRespostas = async function(duvidaId, title) {
    const container = document.getElementById(`respostas-${duvidaId}`);

    if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = '<p>Carregando respostas...</p>';
    container.style.display = 'block';

    try {
        const q = query(collection(db, 'duvidas', duvidaId, 'respostas'), orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = '<p class="no-data">Nenhuma resposta ainda. Seja o primeiro a responder!</p>';
            return;
        }

        let html = `<h4>Respostas para: "${title}"</h4>`;
        querySnapshot.forEach((docSnap) => {
            const resposta = docSnap.data();
            const date = resposta.timestamp ? new Date(resposta.timestamp).toLocaleString('pt-BR') : 'N/A';
            html += `
                <div class="resposta-item">
                    <p class="resposta-content">${resposta.content || 'Sem conteúdo'}</p>
                    <div class="resposta-meta">
                        <span><strong>Por:</strong> ${resposta.author || 'Anônimo'}</span>
                        <span><strong>Em:</strong> ${date}</span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        // Tentar sem ordenação
        try {
            const querySnapshot = await getDocs(collection(db, 'duvidas', duvidaId, 'respostas'));

            if (querySnapshot.empty) {
                container.innerHTML = '<p class="no-data">Nenhuma resposta ainda. Seja o primeiro a responder!</p>';
                return;
            }

            let html = `<h4>Respostas para: "${title}"</h4>`;
            querySnapshot.forEach((docSnap) => {
                const resposta = docSnap.data();
                const date = resposta.timestamp ? new Date(resposta.timestamp).toLocaleString('pt-BR') : 'N/A';
                html += `
                    <div class="resposta-item">
                        <p class="resposta-content">${resposta.content || 'Sem conteúdo'}</p>
                        <div class="resposta-meta">
                            <span><strong>Por:</strong> ${resposta.author || 'Anônimo'}</span>
                            <span><strong>Em:</strong> ${date}</span>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } catch (error2) {
            container.innerHTML = '<p class="error">Erro ao carregar respostas: ' + error2.message + '</p>';
        }
    }
}

// Mostrar formulário de resposta
window.showReplyForm = function(duvidaId) {
    document.getElementById(`reply-form-${duvidaId}`).style.display = 'block';
}

window.hideReplyForm = function(duvidaId) {
    document.getElementById(`reply-form-${duvidaId}`).style.display = 'none';
    document.getElementById(`reply-content-${duvidaId}`).value = '';
}

// Adicionar resposta a uma dúvida
window.addResposta = async function(duvidaId) {
    const content = document.getElementById(`reply-content-${duvidaId}`).value;

    if (!content.trim()) {
        alert('Por favor, escreva uma resposta!');
        return;
    }

    const currentUser = auth.currentUser;
    const author = currentUser.displayName || currentUser.email.split('@')[0];

    try {
        // Adicionar resposta na subcoleção
        await addDoc(collection(db, 'duvidas', duvidaId, 'respostas'), {
            author,
            content,
            timestamp: Date.now()
        });

        // Incrementar contador de respostas
        await updateDoc(doc(db, 'duvidas', duvidaId), {
            replies: increment(1)
        });

        hideReplyForm(duvidaId);
        loadDuvidas();
        alert('Resposta adicionada com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar resposta: ' + error.message);
    }
}

// ============================================
// CRUD para Lista Geral (Chat Messages)
// Estrutura Firebase: author, message, timestamp
// ============================================
window.addListaGeral = async function() {
    const message = document.getElementById('chat-message').value;

    if (!message.trim()) {
        alert('Por favor, escreva uma mensagem!');
        return;
    }

    const currentUser = auth.currentUser;
    const author = currentUser.displayName || currentUser.email.split('@')[0];

    try {
        await addDoc(collection(db, 'lista_geral'), {
            author,
            message,
            timestamp: Date.now()
        });

        document.getElementById('chat-message').value = '';
        loadListaGeral();
    } catch (error) {
        alert('Erro ao enviar mensagem: ' + error.message);
    }
}

async function loadListaGeral() {
    try {
        const q = query(collection(db, 'lista_geral'), orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);
        const list = document.getElementById('lista_geral-list');
        list.innerHTML = '';

        if (querySnapshot.empty) {
            list.innerHTML = '<p class="no-data">Nenhuma mensagem ainda. Comece a conversa!</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const msg = docSnap.data();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'chat-message';

            const date = msg.timestamp ? new Date(msg.timestamp).toLocaleString('pt-BR') : '';

            itemDiv.innerHTML = `
                <div class="chat-header">
                    <strong>${msg.author || 'Anônimo'}</strong>
                    <span class="chat-time">${date}</span>
                </div>
                <p class="chat-content">${msg.message || ''}</p>
                <button class="delete-btn small" onclick="deleteItem('lista_geral', '${docSnap.id}')">×</button>
            `;
            list.appendChild(itemDiv);
        });

        // Scroll para o final
        list.scrollTop = list.scrollHeight;
    } catch (error) {
        // Tentar sem ordenação
        try {
            const querySnapshot = await getDocs(collection(db, 'lista_geral'));
            const list = document.getElementById('lista_geral-list');
            list.innerHTML = '';

            if (querySnapshot.empty) {
                list.innerHTML = '<p class="no-data">Nenhuma mensagem ainda. Comece a conversa!</p>';
                return;
            }

            querySnapshot.forEach((docSnap) => {
                const msg = docSnap.data();
                const itemDiv = document.createElement('div');
                itemDiv.className = 'chat-message';

                const date = msg.timestamp ? new Date(msg.timestamp).toLocaleString('pt-BR') : '';

                itemDiv.innerHTML = `
                    <div class="chat-header">
                        <strong>${msg.author || 'Anônimo'}</strong>
                        <span class="chat-time">${date}</span>
                    </div>
                    <p class="chat-content">${msg.message || ''}</p>
                    <button class="delete-btn small" onclick="deleteItem('lista_geral', '${docSnap.id}')">×</button>
                `;
                list.appendChild(itemDiv);
            });
        } catch (error2) {
            alert('Erro ao carregar mensagens: ' + error2.message);
        }
    }
}

// ============================================
// CRUD para Users
// Estrutura Firebase: id, username, email, createdAt
// ============================================
window.addUser = async function() {
    const username = document.getElementById('user-username').value;
    const email = document.getElementById('user-email').value;

    if (!username || !email) {
        alert('Por favor, preencha username e email!');
        return;
    }

    try {
        await addDoc(collection(db, 'users'), {
            id: auth.currentUser.uid,
            username,
            email,
            createdAt: Date.now()
        });

        clearUserForm();
        loadUsers();
        alert('Usuário adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar usuário: ' + error.message);
    }
}

function clearUserForm() {
    document.getElementById('user-username').value = '';
    document.getElementById('user-email').value = '';
}

async function loadUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const list = document.getElementById('users-list');
        list.innerHTML = '';

        if (querySnapshot.empty) {
            list.innerHTML = '<p class="no-data">Nenhum usuário encontrado.</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const user = docSnap.data();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';

            const date = user.createdAt ? new Date(user.createdAt).toLocaleString('pt-BR') : 'N/A';

            itemDiv.innerHTML = `
                <h3>${user.username || 'Sem username'}</h3>
                <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                <p><strong>ID:</strong> ${user.id || docSnap.id}</p>
                <div class="item-meta">
                    Criado em: ${date}
                </div>
                <button class="delete-btn" onclick="deleteItem('users', '${docSnap.id}')">Deletar</button>
            `;
            list.appendChild(itemDiv);
        });
    } catch (error) {
        alert('Erro ao carregar usuários: ' + error.message);
    }
}

// Função genérica para deletar itens
window.deleteItem = async function(collection_name, itemId) {
    if (!confirm('Tem certeza que deseja deletar este item?')) {
        return;
    }

    try {
        await deleteDoc(doc(db, collection_name, itemId));
        loadCurrentTabData();
        alert('Item deletado com sucesso!');
    } catch (error) {
        alert('Erro ao deletar item: ' + error.message);
    }
}

// ============================================
// CRUD para Produtos (E-commerce)
// Estrutura Firebase: nome, descricao, preco, precoPromocional, imagem, categoria, estoque, ativo, createdAt, updatedAt
// ============================================

// Armazena todos os produtos para filtros
let allProdutos = [];
let categoriasSet = new Set();

// Preview da imagem
const imagemInput = document.getElementById('produto-imagem');
if (imagemInput) {
    imagemInput.addEventListener('input', function() {
        const preview = document.getElementById('produto-imagem-preview');
        const url = this.value;
        if (url) {
            preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<p class=\\'error\\'>Imagem não encontrada</p>'">`;
        } else {
            preview.innerHTML = '';
        }
    });
}

// Adicionar ou atualizar produto
window.addOrUpdateProduto = async function() {
    const editId = document.getElementById('produto-edit-id').value;
    const nome = document.getElementById('produto-nome').value;
    const descricao = document.getElementById('produto-descricao').value;
    const preco = document.getElementById('produto-preco').value;
    const precoPromocional = document.getElementById('produto-preco-promocional').value;
    const imagem = document.getElementById('produto-imagem').value;
    const categoria = document.getElementById('produto-categoria').value;
    const estoque = document.getElementById('produto-estoque').value;
    const ativo = document.getElementById('produto-ativo').value === 'true';

    if (!nome || !preco) {
        alert('Por favor, preencha pelo menos o nome e o preço!');
        return;
    }

    const produtoData = {
        nome,
        descricao: descricao || '',
        preco: parseFloat(preco),
        precoPromocional: precoPromocional ? parseFloat(precoPromocional) : null,
        imagem: imagem || '',
        categoria: categoria || 'Geral',
        estoque: estoque ? parseInt(estoque) : 0,
        ativo,
        updatedAt: Date.now()
    };

    try {
        if (editId) {
            // Atualizar produto existente
            await updateDoc(doc(db, 'produtos', editId), produtoData);
            alert('Produto atualizado com sucesso!');
        } else {
            // Adicionar novo produto
            produtoData.createdAt = Date.now();
            await addDoc(collection(db, 'produtos'), produtoData);
            alert('Produto adicionado com sucesso!');
        }

        clearProdutoForm();
        loadProdutos();
    } catch (error) {
        alert('Erro ao salvar produto: ' + error.message);
    }
}

// Limpar formulário de produto
function clearProdutoForm() {
    document.getElementById('produto-edit-id').value = '';
    document.getElementById('produto-nome').value = '';
    document.getElementById('produto-descricao').value = '';
    document.getElementById('produto-preco').value = '';
    document.getElementById('produto-preco-promocional').value = '';
    document.getElementById('produto-imagem').value = '';
    document.getElementById('produto-categoria').value = '';
    document.getElementById('produto-estoque').value = '';
    document.getElementById('produto-ativo').value = 'true';
    document.getElementById('produto-imagem-preview').innerHTML = '';
    document.getElementById('produto-submit-btn').textContent = 'Adicionar Produto';
    document.getElementById('produto-cancel-btn').style.display = 'none';
}

// Cancelar edição
window.cancelEditProduto = function() {
    clearProdutoForm();
}

// Carregar produtos
async function loadProdutos() {
    try {
        const q = query(collection(db, 'produtos'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const list = document.getElementById('produtos-list');
        list.innerHTML = '';

        allProdutos = [];
        categoriasSet = new Set();

        if (querySnapshot.empty) {
            list.innerHTML = '<p class="no-data">Nenhum produto encontrado. Adicione seu primeiro produto!</p>';
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const produto = { id: docSnap.id, ...docSnap.data() };
            allProdutos.push(produto);
            if (produto.categoria) {
                categoriasSet.add(produto.categoria);
            }
        });

        // Atualizar dropdown de categorias
        updateCategoriasFilter();

        // Renderizar produtos
        renderProdutos(allProdutos);

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        // Tentar sem ordenação
        try {
            const querySnapshot = await getDocs(collection(db, 'produtos'));
            const list = document.getElementById('produtos-list');

            allProdutos = [];
            categoriasSet = new Set();

            if (querySnapshot.empty) {
                list.innerHTML = '<p class="no-data">Nenhum produto encontrado. Adicione seu primeiro produto!</p>';
                return;
            }

            querySnapshot.forEach((docSnap) => {
                const produto = { id: docSnap.id, ...docSnap.data() };
                allProdutos.push(produto);
                if (produto.categoria) {
                    categoriasSet.add(produto.categoria);
                }
            });

            updateCategoriasFilter();
            renderProdutos(allProdutos);
        } catch (error2) {
            alert('Erro ao carregar produtos: ' + error2.message);
        }
    }
}

// Atualizar filtro de categorias
function updateCategoriasFilter() {
    const select = document.getElementById('produtos-filter-categoria');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Todas as categorias</option>';

    categoriasSet.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });

    select.value = currentValue;
}

// Renderizar produtos na grid
function renderProdutos(produtos) {
    const list = document.getElementById('produtos-list');
    list.innerHTML = '';

    if (produtos.length === 0) {
        list.innerHTML = '<p class="no-data">Nenhum produto encontrado com os filtros aplicados.</p>';
        return;
    }

    produtos.forEach((produto) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `produto-card ${!produto.ativo ? 'inativo' : ''}`;

        const precoFormatado = produto.preco ? `R$ ${produto.preco.toFixed(2)}` : 'N/A';
        const precoPromoFormatado = produto.precoPromocional ? `R$ ${produto.precoPromocional.toFixed(2)}` : null;
        const date = produto.createdAt ? new Date(produto.createdAt).toLocaleDateString('pt-BR') : 'N/A';

        itemDiv.innerHTML = `
            <div class="produto-image">
                ${produto.imagem ? `<img src="${produto.imagem}" alt="${produto.nome}" onerror="this.src='https://via.placeholder.com/200x200?text=Sem+Imagem'">` : '<div class="no-image">Sem imagem</div>'}
                ${!produto.ativo ? '<span class="status-badge inativo">Inativo</span>' : ''}
                ${produto.precoPromocional ? '<span class="status-badge promo">Promoção</span>' : ''}
            </div>
            <div class="produto-info">
                <h3>${produto.nome || 'Sem nome'}</h3>
                <p class="produto-categoria">${produto.categoria || 'Sem categoria'}</p>
                <p class="produto-descricao">${produto.descricao || ''}</p>
                <div class="produto-preco">
                    ${precoPromoFormatado ? `<span class="preco-original">${precoFormatado}</span><span class="preco-promo">${precoPromoFormatado}</span>` : `<span class="preco">${precoFormatado}</span>`}
                </div>
                <p class="produto-estoque">Estoque: ${produto.estoque || 0} unidades</p>
                <p class="produto-data">Criado em: ${date}</p>
            </div>
            <div class="produto-actions">
                <button class="edit-btn" onclick="editProduto('${produto.id}')">Editar</button>
                <button class="toggle-btn ${produto.ativo ? 'desativar' : 'ativar'}" onclick="toggleProdutoStatus('${produto.id}', ${!produto.ativo})">
                    ${produto.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button class="delete-btn" onclick="deleteProduto('${produto.id}')">Excluir</button>
            </div>
        `;
        list.appendChild(itemDiv);
    });
}

// Filtrar produtos
window.filterProdutos = function() {
    const searchTerm = document.getElementById('produtos-search').value.toLowerCase();
    const categoriaFilter = document.getElementById('produtos-filter-categoria').value;
    const statusFilter = document.getElementById('produtos-filter-status').value;

    let filtered = allProdutos;

    // Filtrar por texto
    if (searchTerm) {
        filtered = filtered.filter(p =>
            (p.nome && p.nome.toLowerCase().includes(searchTerm)) ||
            (p.descricao && p.descricao.toLowerCase().includes(searchTerm))
        );
    }

    // Filtrar por categoria
    if (categoriaFilter) {
        filtered = filtered.filter(p => p.categoria === categoriaFilter);
    }

    // Filtrar por status
    if (statusFilter !== '') {
        const isAtivo = statusFilter === 'true';
        filtered = filtered.filter(p => p.ativo === isAtivo);
    }

    renderProdutos(filtered);
}

// Editar produto
window.editProduto = function(produtoId) {
    const produto = allProdutos.find(p => p.id === produtoId);
    if (!produto) {
        alert('Produto não encontrado!');
        return;
    }

    document.getElementById('produto-edit-id').value = produtoId;
    document.getElementById('produto-nome').value = produto.nome || '';
    document.getElementById('produto-descricao').value = produto.descricao || '';
    document.getElementById('produto-preco').value = produto.preco || '';
    document.getElementById('produto-preco-promocional').value = produto.precoPromocional || '';
    document.getElementById('produto-imagem').value = produto.imagem || '';
    document.getElementById('produto-categoria').value = produto.categoria || '';
    document.getElementById('produto-estoque').value = produto.estoque || '';
    document.getElementById('produto-ativo').value = produto.ativo ? 'true' : 'false';

    // Preview da imagem
    const preview = document.getElementById('produto-imagem-preview');
    if (produto.imagem) {
        preview.innerHTML = `<img src="${produto.imagem}" alt="Preview">`;
    }

    document.getElementById('produto-submit-btn').textContent = 'Atualizar Produto';
    document.getElementById('produto-cancel-btn').style.display = 'inline-block';

    // Scroll para o formulário
    document.querySelector('.produto-form').scrollIntoView({ behavior: 'smooth' });
}

// Alternar status do produto
window.toggleProdutoStatus = async function(produtoId, novoStatus) {
    try {
        await updateDoc(doc(db, 'produtos', produtoId), {
            ativo: novoStatus,
            updatedAt: Date.now()
        });
        loadProdutos();
    } catch (error) {
        alert('Erro ao alterar status: ' + error.message);
    }
}

// Deletar produto
window.deleteProduto = async function(produtoId) {
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
        return;
    }

    try {
        await deleteDoc(doc(db, 'produtos', produtoId));
        loadProdutos();
        alert('Produto excluído com sucesso!');
    } catch (error) {
        alert('Erro ao excluir produto: ' + error.message);
    }
}

// ============================================
// Funções de Exemplo e Limpeza
// ============================================

// Produtos de exemplo
const produtosExemplo = [
    {
        nome: "Smartphone Galaxy Pro",
        descricao: "Smartphone de última geração com câmera de 108MP, tela AMOLED de 6.7 polegadas e bateria de 5000mAh. Perfeito para quem busca performance e qualidade.",
        preco: 2499.99,
        precoPromocional: 1999.99,
        imagem: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
        categoria: "Eletrônicos",
        estoque: 50,
        ativo: true
    },
    {
        nome: "Notebook UltraBook 15",
        descricao: "Notebook ultrafino com processador Intel Core i7, 16GB RAM e SSD de 512GB. Ideal para trabalho e entretenimento.",
        preco: 4999.99,
        precoPromocional: null,
        imagem: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
        categoria: "Eletrônicos",
        estoque: 25,
        ativo: true
    },
    {
        nome: "Fone de Ouvido Bluetooth Premium",
        descricao: "Fone sem fio com cancelamento de ruído ativo, 30 horas de bateria e som Hi-Fi. Conforto para uso prolongado.",
        preco: 599.99,
        precoPromocional: 449.99,
        imagem: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
        categoria: "Acessórios",
        estoque: 100,
        ativo: true
    },
    {
        nome: "Camiseta Básica Algodão",
        descricao: "Camiseta 100% algodão, confortável e durável. Disponível em várias cores. Perfeita para o dia a dia.",
        preco: 79.99,
        precoPromocional: null,
        imagem: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        categoria: "Roupas",
        estoque: 200,
        ativo: true
    },
    {
        nome: "Tênis Esportivo Runner",
        descricao: "Tênis para corrida com tecnologia de amortecimento, leve e respirável. Ideal para treinos intensos.",
        preco: 399.99,
        precoPromocional: 299.99,
        imagem: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        categoria: "Calçados",
        estoque: 75,
        ativo: true
    },
    {
        nome: "Relógio Smartwatch Fit",
        descricao: "Smartwatch com monitor cardíaco, GPS integrado e resistência à água. Acompanhe sua saúde em tempo real.",
        preco: 899.99,
        precoPromocional: 699.99,
        imagem: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
        categoria: "Acessórios",
        estoque: 40,
        ativo: true
    },
    {
        nome: "Mochila Executiva",
        descricao: "Mochila com compartimento para notebook 15.6\", porta USB externa e design moderno. Perfeita para o trabalho.",
        preco: 249.99,
        precoPromocional: null,
        imagem: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
        categoria: "Acessórios",
        estoque: 60,
        ativo: true
    },
    {
        nome: "Câmera DSLR Profissional",
        descricao: "Câmera DSLR com sensor full-frame de 45MP, gravação 4K e sistema de foco avançado. Para fotógrafos exigentes.",
        preco: 8999.99,
        precoPromocional: 7499.99,
        imagem: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
        categoria: "Eletrônicos",
        estoque: 10,
        ativo: true
    },
    {
        nome: "Cadeira Gamer RGB",
        descricao: "Cadeira ergonômica com iluminação RGB, apoio lombar ajustável e reclinável até 180°. Conforto para longas sessões.",
        preco: 1299.99,
        precoPromocional: null,
        imagem: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400",
        categoria: "Móveis",
        estoque: 30,
        ativo: true
    },
    {
        nome: "Livro: Programação Web Moderna",
        descricao: "Guia completo sobre desenvolvimento web com HTML5, CSS3, JavaScript e frameworks modernos. 500 páginas de conteúdo.",
        preco: 89.99,
        precoPromocional: 69.99,
        imagem: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400",
        categoria: "Livros",
        estoque: 150,
        ativo: true
    },
    {
        nome: "Kit Skincare Completo",
        descricao: "Kit com limpador facial, tônico, sérum e hidratante. Produtos naturais para todos os tipos de pele.",
        preco: 199.99,
        precoPromocional: 149.99,
        imagem: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",
        categoria: "Beleza",
        estoque: 80,
        ativo: true
    },
    {
        nome: "Cafeteira Expresso Automática",
        descricao: "Cafeteira com moedor integrado, 15 bar de pressão e sistema de leite. Café de cafeteria em casa.",
        preco: 1599.99,
        precoPromocional: null,
        imagem: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400",
        categoria: "Eletrodomésticos",
        estoque: 20,
        ativo: true
    }
];

// Popular com produtos de exemplo
window.popularProdutosExemplo = async function() {
    if (!confirm('Isso irá adicionar 12 produtos de exemplo. Deseja continuar?')) {
        return;
    }

    const list = document.getElementById('produtos-list');
    list.innerHTML = '<p class="loading">Adicionando produtos de exemplo...</p>';

    try {
        let count = 0;
        for (const produto of produtosExemplo) {
            await addDoc(collection(db, 'produtos'), {
                ...produto,
                createdAt: Date.now() - (count * 60000), // Diferentes timestamps
                updatedAt: Date.now()
            });
            count++;
        }

        loadProdutos();
        alert(`${count} produtos de exemplo adicionados com sucesso!`);
    } catch (error) {
        alert('Erro ao adicionar produtos: ' + error.message);
        loadProdutos();
    }
}

// Deletar todos os produtos
window.deletarTodosProdutos = async function() {
    if (!confirm('ATENÇÃO: Isso irá excluir TODOS os produtos! Esta ação não pode ser desfeita. Deseja continuar?')) {
        return;
    }

    if (!confirm('Tem CERTEZA ABSOLUTA? Todos os produtos serão perdidos permanentemente!')) {
        return;
    }

    const list = document.getElementById('produtos-list');
    list.innerHTML = '<p class="loading">Excluindo todos os produtos...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, 'produtos'));
        let count = 0;

        for (const docSnap of querySnapshot.docs) {
            await deleteDoc(doc(db, 'produtos', docSnap.id));
            count++;
        }

        loadProdutos();
        alert(`${count} produtos excluídos com sucesso!`);
    } catch (error) {
        alert('Erro ao excluir produtos: ' + error.message);
        loadProdutos();
    }
}
