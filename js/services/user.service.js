/**
 * User Service
 * Handles user data management in Firestore
 * Note: This is different from auth.service.js which handles authentication
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
    where,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Create a new user document
 * @param {Object} userData - The user data
 * @returns {Promise<string>} - The created document ID
 */
export async function createUserDoc(userData) {
    const docRef = await addDoc(collection(db, COLLECTIONS.USERS), {
        id: auth.currentUser?.uid || userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role || 'user',
        createdAt: Date.now()
    });
    return docRef.id;
}

/**
 * Get all users
 * @returns {Promise<Array>} - Array of users with IDs
 */
export async function getAllUsers() {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    const users = [];

    querySnapshot.forEach((docSnap) => {
        users.push({
            docId: docSnap.id,
            ...docSnap.data()
        });
    });

    return users;
}

/**
 * Get user by email
 * @param {string} email - The user email
 * @returns {Promise<Object|null>} - User data or null
 */
export async function getUserByEmail(email) {
    const q = query(
        collection(db, COLLECTIONS.USERS),
        where('email', '==', email)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return null;

    const docSnap = querySnapshot.docs[0];
    return {
        docId: docSnap.id,
        ...docSnap.data()
    };
}

/**
 * Get user by auth UID
 * @param {string} uid - The Firebase Auth UID
 * @returns {Promise<Object|null>} - User data or null
 */
export async function getUserByUid(uid) {
    const q = query(
        collection(db, COLLECTIONS.USERS),
        where('id', '==', uid)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return null;

    const docSnap = querySnapshot.docs[0];
    return {
        docId: docSnap.id,
        ...docSnap.data()
    };
}

/**
 * Update a user document
 * @param {string} docId - The Firestore document ID
 * @param {Object} userData - The updated user data
 */
export async function updateUserDoc(docId, userData) {
    await updateDoc(doc(db, COLLECTIONS.USERS, docId), {
        ...userData,
        updatedAt: Date.now()
    });
}

/**
 * Delete a user document
 * @param {string} docId - The Firestore document ID
 */
export async function deleteUserDoc(docId) {
    await deleteDoc(doc(db, COLLECTIONS.USERS, docId));
}

/**
 * Check if user is admin
 * @param {string} email - The user email
 * @returns {Promise<boolean>} - True if user is admin
 */
export async function isUserAdmin(email) {
    const user = await getUserByEmail(email);
    return user?.role === 'admin';
}
