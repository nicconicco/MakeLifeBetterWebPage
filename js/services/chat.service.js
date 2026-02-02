/**
 * Chat Service (Lista Geral)
 * Handles all chat message-related Firebase operations
 */
import { db, auth } from '../config/firebase.config.js';
import { COLLECTIONS } from '../config/constants.js';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy
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
 * Send a chat message
 * @param {string} message - The message content
 * @returns {Promise<string>} - The created document ID
 */
export async function sendMessage(message) {
    const docRef = await addDoc(collection(db, COLLECTIONS.CHAT), {
        author: getCurrentAuthor(),
        message,
        timestamp: Date.now()
    });
    return docRef.id;
}

/**
 * Get all chat messages ordered by timestamp
 * @returns {Promise<Array>} - Array of messages with IDs
 */
export async function getAllMessages() {
    try {
        const q = query(
            collection(db, COLLECTIONS.CHAT),
            orderBy('timestamp', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return extractDocs(querySnapshot);
    } catch (error) {
        // Fallback without ordering if index doesn't exist
        console.warn('Falling back to unordered chat query:', error);
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.CHAT));
        return extractDocs(querySnapshot);
    }
}

/**
 * Extract documents from query snapshot
 * @param {QuerySnapshot} querySnapshot
 * @returns {Array}
 */
function extractDocs(querySnapshot) {
    const messages = [];
    querySnapshot.forEach((docSnap) => {
        messages.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });
    return messages;
}

/**
 * Delete a chat message
 * @param {string} messageId - The message ID
 */
export async function deleteMessage(messageId) {
    await deleteDoc(doc(db, COLLECTIONS.CHAT, messageId));
}
