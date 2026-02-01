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
