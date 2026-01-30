// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Configuração do Firebase
// IMPORTANTE: Substitua pelos seus dados do Firebase
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
window.showTab = function(tabName) {
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
    event.target.classList.add('active');
    
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

// CRUD para Eventos
window.addEvento = async function() {
    const nome = document.getElementById('evento-nome').value;
    const descricao = document.getElementById('evento-descricao').value;
    const data = document.getElementById('evento-data').value;
    const local = document.getElementById('evento-local').value;
    
    if (!nome || !descricao || !data || !local) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    try {
        await addDoc(collection(db, 'eventos'), {
            nome,
            descricao,
            data,
            local,
            createdBy: auth.currentUser.uid,
            createdAt: new Date()
        });
        
        clearEventoForm();
        loadEventos();
        alert('Evento adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar evento: ' + error.message);
    }
}

function clearEventoForm() {
    document.getElementById('evento-nome').value = '';
    document.getElementById('evento-descricao').value = '';
    document.getElementById('evento-data').value = '';
    document.getElementById('evento-local').value = '';
}

async function loadEventos() {
    try {
        const querySnapshot = await getDocs(collection(db, 'eventos'));
        const list = document.getElementById('eventos-list');
        list.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const evento = doc.data();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.innerHTML = `
                <h3>${evento.nome}</h3>
                <p><strong>Descrição:</strong> ${evento.descricao}</p>
                <p><strong>Data:</strong> ${evento.data}</p>
                <p><strong>Local:</strong> ${evento.local}</p>
                <div class="item-meta">
                    Criado em: ${evento.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </div>
                <button class="delete-btn" onclick="deleteItem('eventos', '${doc.id}')">Deletar</button>
            `;
            list.appendChild(itemDiv);
        });
    } catch (error) {
        alert('Erro ao carregar eventos: ' + error.message);
    }
}

// CRUD para Event Location
window.addEventLocation = async function() {
    const nome = document.getElementById('location-nome').value;
    const endereco = document.getElementById('location-endereco').value;
    const capacidade = document.getElementById('location-capacidade').value;
    
    if (!nome || !endereco || !capacidade) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    try {
        await addDoc(collection(db, 'event_location'), {
            nome,
            endereco,
            capacidade: parseInt(capacidade),
            createdBy: auth.currentUser.uid,
            createdAt: new Date()
        });
        
        clearLocationForm();
        loadEventLocations();
        alert('Local adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar local: ' + error.message);
    }
}

function clearLocationForm() {
    document.getElementById('location-nome').value = '';
    document.getElementById('location-endereco').value = '';
    document.getElementById('location-capacidade').value = '';
}

async function loadEventLocations() {
    try {
        const querySnapshot = await getDocs(collection(db, 'event_location'));
        const list = document.getElementById('event_location-list');
        list.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const location = doc.data();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.innerHTML = `
                <h3>${location.nome}</h3>
                <p><strong>Endereço:</strong> ${location.endereco}</p>
                <p><strong>Capacidade:</strong> ${location.capacidade} pessoas</p>
                <div class="item-meta">
                    Criado em: ${location.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </div>
                <button class="delete-btn" onclick="deleteItem('event_location', '${doc.id}')">Deletar</button>
            `;
            list.appendChild(itemDiv);
        });
    } catch (error) {
        alert('Erro ao carregar locais: ' + error.message);
    }
}

// CRUD para Dúvidas
window.addDuvida = async function() {
    const titulo = document.getElementById('duvida-titulo').value;
    const pergunta = document.getElementById('duvida-pergunta').value;
    const resposta = document.getElementById('duvida-resposta').value;
    
    if (!titulo || !pergunta) {
        alert('Por favor, preencha pelo menos o título e a pergunta!');
        return;
    }
    
    try {
        await addDoc(collection(db, 'duvidas'), {
            titulo,
            pergunta,
            resposta: resposta || '',
            createdBy: auth.currentUser.uid,
            createdAt: new Date()
        });
        
        clearDuvidaForm();
        loadDuvidas();
        alert('Dúvida adicionada com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar dúvida: ' + error.message);
    }
}

function clearDuvidaForm() {
    document.getElementById('duvida-titulo').value = '';
    document.getElementById('duvida-pergunta').value = '';
    document.getElementById('duvida-resposta').value = '';
}

async function loadDuvidas() {
    try {
        const querySnapshot = await getDocs(collection(db, 'duvidas'));
        const list = document.getElementById('duvidas-list');
        list.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const duvida = doc.data();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.innerHTML = `
                <h3>${duvida.titulo}</h3>
                <p><strong>Pergunta:</strong> ${duvida.pergunta}</p>
                ${duvida.resposta ? `<p><strong>Resposta:</strong> ${duvida.resposta}</p>` : '<p><em>Sem resposta ainda</em></p>'}
                <div class="item-meta">
                    Criado em: ${duvida.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </div>
                <button class="delete-btn" onclick="deleteItem('duvidas', '${doc.id}')">Deletar</button>
            `;
            list.appendChild(itemDiv);
        });
    } catch (error) {
        alert('Erro ao carregar dúvidas: ' + error.message);
    }
}

// CRUD para Lista Geral
window.addListaGeral = async function() {
    const item = document.getElementById('lista-item').value;
    const categoria = document.getElementById('lista-categoria').value;
    const observacoes = document.getElementById('lista-observacoes').value;
    
    if (!item || !categoria) {
        alert('Por favor, preencha pelo menos o item e a categoria!');
        return;
    }
    
    try {
        await addDoc(collection(db, 'lista_geral'), {
            item,
            categoria,
            observacoes: observacoes || '',
            createdBy: auth.currentUser.uid,
            createdAt: new Date()
        });
        
        clearListaGeralForm();
        loadListaGeral();
        alert('Item adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar item: ' + error.message);
    }
}

function clearListaGeralForm() {
    document.getElementById('lista-item').value = '';
    document.getElementById('lista-categoria').value = '';
    document.getElementById('lista-observacoes').value = '';
}

async function loadListaGeral() {
    try {
        const querySnapshot = await getDocs(collection(db, 'lista_geral'));
        const list = document.getElementById('lista_geral-list');
        list.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.innerHTML = `
                <h3>${item.item}</h3>
                <p><strong>Categoria:</strong> ${item.categoria}</p>
                ${item.observacoes ? `<p><strong>Observações:</strong> ${item.observacoes}</p>` : ''}
                <div class="item-meta">
                    Criado em: ${item.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </div>
                <button class="delete-btn" onclick="deleteItem('lista_geral', '${doc.id}')">Deletar</button>
            `;
            list.appendChild(itemDiv);
        });
    } catch (error) {
        alert('Erro ao carregar lista geral: ' + error.message);
    }
}

// CRUD para Users
window.addUser = async function() {
    const nome = document.getElementById('user-nome').value;
    const email = document.getElementById('user-email').value;
    const telefone = document.getElementById('user-telefone').value;
    const tipo = document.getElementById('user-tipo').value;
    
    if (!nome || !email || !tipo) {
        alert('Por favor, preencha pelo menos nome, email e tipo!');
        return;
    }
    
    try {
        await addDoc(collection(db, 'users'), {
            nome,
            email,
            telefone: telefone || '',
            tipo,
            createdBy: auth.currentUser.uid,
            createdAt: new Date()
        });
        
        clearUserForm();
        loadUsers();
        alert('Usuário adicionado com sucesso!');
    } catch (error) {
        alert('Erro ao adicionar usuário: ' + error.message);
    }
}

function clearUserForm() {
    document.getElementById('user-nome').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-telefone').value = '';
    document.getElementById('user-tipo').value = '';
}

async function loadUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const list = document.getElementById('users-list');
        list.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const user = doc.data();
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            itemDiv.innerHTML = `
                <h3>${user.nome}</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Tipo:</strong> ${user.tipo}</p>
                ${user.telefone ? `<p><strong>Telefone:</strong> ${user.telefone}</p>` : ''}
                <div class="item-meta">
                    Criado em: ${user.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </div>
                <button class="delete-btn" onclick="deleteItem('users', '${doc.id}')">Deletar</button>
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