/**
 * Evento Service
 * Handles all evento-related Firebase operations
 */
import { db } from '../config/firebase.config.js';
import { COLLECTIONS } from '../config/constants.js';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Create a new evento
 * @param {Object} eventoData - The evento data
 * @returns {Promise<string>} - The created documento ID
 */
export async function createEvento(eventoData) {
    const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), {
        titulo: eventoData.titulo,
        subtitulo: eventoData.subtitulo || '',
        descricao: eventoData.descricao || '',
        hora: eventoData.hora,
        lugar: eventoData.lugar,
        categoria: eventoData.categoria || '',
        createdAt: Date.now()
    });
    return docRef.id;
}

/**
 * Get all eventos
 * @returns {Promise<Array>} - Array of eventos with IDs
 */
export async function getAllEventos() {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.EVENTS));
    const eventos = [];

    querySnapshot.forEach((docSnap) => {
        eventos.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    return eventos;
}

/**
 * Update an evento
 * @param {string} eventoId - The evento ID
 * @param {Object} eventoData - The updated evento data
 */
export async function updateEvento(eventoId, eventoData) {
    await updateDoc(doc(db, COLLECTIONS.EVENTS, eventoId), {
        ...eventoData,
        updatedAt: Date.now()
    });
}

/**
 * Delete an evento
 * @param {string} eventoId - The evento ID
 */
export async function deleteEvento(eventoId) {
    await deleteDoc(doc(db, COLLECTIONS.EVENTS, eventoId));
}
