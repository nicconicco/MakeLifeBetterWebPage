/**
 * Duvida (Question) Service
 * Handles all duvida-related Firebase operations
 * Including respostas (answers) subcollection
 */
import { db, auth } from '../config/firebase.config.js';
import { COLLECTIONS } from '../config/constants.js';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Get current user author name
 * @returns {string} - Author name from displayName or email
 */
function getCurrentAuthor() {
    const currentUser = auth.currentUser;
    if (!currentUser) return 'Anonimo';
    return currentUser.displayName || currentUser.email.split('@')[0];
}

/**
 * Create a new duvida
 * @param {Object} duvidaData - The duvida data (title, description)
 * @returns {Promise<string>} - The created document ID
 */
export async function createDuvida(duvidaData) {
    const docRef = await addDoc(collection(db, COLLECTIONS.QUESTIONS), {
        title: duvidaData.title,
        description: duvidaData.description,
        author: getCurrentAuthor(),
        replies: 0,
        timestamp: Date.now()
    });
    return docRef.id;
}

/**
 * Get all duvidas ordered by timestamp
 * @returns {Promise<Array>} - Array of duvidas with IDs
 */
export async function getAllDuvidas() {
    try {
        const q = query(
            collection(db, COLLECTIONS.QUESTIONS),
            orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return extractDocs(querySnapshot);
    } catch (error) {
        // Fallback without ordering if index doesn't exist
        console.warn('Falling back to unordered query:', error);
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.QUESTIONS));
        return extractDocs(querySnapshot);
    }
}

/**
 * Extract documents from query snapshot
 * @param {QuerySnapshot} querySnapshot
 * @returns {Array}
 */
function extractDocs(querySnapshot) {
    const duvidas = [];
    querySnapshot.forEach((docSnap) => {
        duvidas.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });
    return duvidas;
}

/**
 * Update a duvida
 * @param {string} duvidaId - The duvida ID
 * @param {Object} duvidaData - The updated duvida data
 */
export async function updateDuvida(duvidaId, duvidaData) {
    await updateDoc(doc(db, COLLECTIONS.QUESTIONS, duvidaId), {
        ...duvidaData,
        updatedAt: Date.now()
    });
}

/**
 * Delete a duvida
 * @param {string} duvidaId - The duvida ID
 */
export async function deleteDuvida(duvidaId) {
    await deleteDoc(doc(db, COLLECTIONS.QUESTIONS, duvidaId));
}

// ============================================
// Respostas (Answers) Subcollection
// ============================================

/**
 * Add a resposta to a duvida
 * @param {string} duvidaId - The duvida ID
 * @param {string} content - The resposta content
 * @returns {Promise<string>} - The created resposta ID
 */
export async function addResposta(duvidaId, content) {
    // Add resposta to subcollection
    const docRef = await addDoc(
        collection(db, COLLECTIONS.QUESTIONS, duvidaId, 'respostas'),
        {
            author: getCurrentAuthor(),
            content,
            timestamp: Date.now()
        }
    );

    // Increment reply counter
    await updateDoc(doc(db, COLLECTIONS.QUESTIONS, duvidaId), {
        replies: increment(1)
    });

    return docRef.id;
}

/**
 * Get all respostas for a duvida
 * @param {string} duvidaId - The duvida ID
 * @returns {Promise<Array>} - Array of respostas
 */
export async function getRespostas(duvidaId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.QUESTIONS, duvidaId, 'respostas'),
            orderBy('timestamp', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return extractDocs(querySnapshot);
    } catch (error) {
        // Fallback without ordering
        console.warn('Falling back to unordered respostas query:', error);
        const querySnapshot = await getDocs(
            collection(db, COLLECTIONS.QUESTIONS, duvidaId, 'respostas')
        );
        return extractDocs(querySnapshot);
    }
}

/**
 * Delete a resposta
 * @param {string} duvidaId - The duvida ID
 * @param {string} respostaId - The resposta ID
 */
export async function deleteResposta(duvidaId, respostaId) {
    await deleteDoc(
        doc(db, COLLECTIONS.QUESTIONS, duvidaId, 'respostas', respostaId)
    );

    // Decrement reply counter
    await updateDoc(doc(db, COLLECTIONS.QUESTIONS, duvidaId), {
        replies: increment(-1)
    });
}
