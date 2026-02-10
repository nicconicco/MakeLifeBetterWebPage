/**
 * Authentication Service
 * Handles all Firebase Authentication operations
 */

import { auth, db } from '../config/firebase.config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { COLLECTIONS, ADMIN_EMAILS } from '../config/constants.js';
import { logError } from '../utils/logger.js';

/**
 * Current user state
 */
let currentUser = null;
let currentUserData = null;
let authStateCallback = null;

/**
 * Initialize auth state listener
 * @param {Function} callback - Callback for auth state changes
 */
export function initAuthListener(callback) {
    authStateCallback = callback;
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) {
            await loadUserData(user);
        } else {
            currentUserData = null;
        }
        if (authStateCallback) {
            authStateCallback(user, currentUserData);
        }
    });
}

/**
 * Load user data from Firestore
 * @param {Object} user - Firebase user object
 */
async function loadUserData(user) {
    try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
        if (userDoc.exists()) {
            currentUserData = { id: user.uid, ...userDoc.data() };
        } else {
            // Create user document if doesn't exist
            currentUserData = createDefaultUserData(user);
            await setDoc(doc(db, COLLECTIONS.USERS, user.uid), currentUserData);
        }
    } catch (error) {
        logError('Error loading user data:', error);
        currentUserData = createDefaultUserData(user);
    }
}

/**
 * Create default user data object
 * @param {Object} user - Firebase user object
 * @returns {Object} User data object
 */
function createDefaultUserData(user) {
    return {
        id: user.uid,
        username: user.email.split('@')[0],
        email: user.email,
        favorites: [],
        createdAt: Date.now(),
        isAdmin: isAdminEmail(user.email)
    };
}

/**
 * Check if email is admin
 * @param {string} email - User email
 * @returns {boolean}
 */
export function isAdminEmail(email) {
    return ADMIN_EMAILS.includes(email);
}

/**
 * Register new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential
 */
export async function register(email, password) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document
    const userData = createDefaultUserData(user);
    await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userData);

    return userCredential;
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential
 */
export async function login(email, password) {
    return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Logout current user
 */
export async function logout() {
    await signOut(auth);
}

/**
 * Update user profile
 * @param {Object} data - Data to update
 */
export async function updateUserProfile(data) {
    if (!currentUser) throw new Error('No user logged in');

    await updateDoc(doc(db, COLLECTIONS.USERS, currentUser.uid), {
        ...data,
        updatedAt: Date.now()
    });

    // Update local data
    currentUserData = { ...currentUserData, ...data };
}

/**
 * Toggle favorite product for current user
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} - True if added, false if removed
 */
export async function toggleFavoriteProduct(productId) {
    if (!currentUser) throw new Error('No user logged in');
    if (!productId) return false;

    const favorites = currentUserData?.favorites || [];
    const isFavorite = favorites.includes(productId);

    await updateDoc(doc(db, COLLECTIONS.USERS, currentUser.uid), {
        favorites: isFavorite ? arrayRemove(productId) : arrayUnion(productId),
        updatedAt: Date.now()
    });

    const nextFavorites = isFavorite
        ? favorites.filter(id => id !== productId)
        : [...favorites, productId];

    currentUserData = { ...currentUserData, favorites: nextFavorites };
    return !isFavorite;
}

/**
 * Remove a product from favorites
 * @param {string} productId - Product ID
 */
export async function removeFavoriteProduct(productId) {
    if (!currentUser) throw new Error('No user logged in');
    if (!productId) return;

    const favorites = currentUserData?.favorites || [];
    await updateDoc(doc(db, COLLECTIONS.USERS, currentUser.uid), {
        favorites: arrayRemove(productId),
        updatedAt: Date.now()
    });

    currentUserData = {
        ...currentUserData,
        favorites: favorites.filter(id => id !== productId)
    };
}

/**
 * Update user password
 * @param {string} newPassword - New password
 */
export async function updateUserPassword(newPassword) {
    if (!currentUser) throw new Error('No user logged in');
    await updatePassword(currentUser, newPassword);
}

/**
 * Get current user
 * @returns {Object|null}
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Get current user data
 * @returns {Object|null}
 */
export function getCurrentUserData() {
    return currentUserData;
}

/**
 * Check if user is admin
 * @returns {boolean}
 */
export function isCurrentUserAdmin() {
    if (!currentUser || !currentUserData) return false;
    return currentUserData.isAdmin || isAdminEmail(currentUser.email);
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
    return currentUser !== null;
}

/**
 * Map Firebase auth error to user-friendly message
 * @param {Object} error - Firebase error
 * @returns {string} User-friendly message
 */
export function getAuthErrorMessage(error) {
    const errorMessages = {
        'auth/email-already-in-use': 'Este email ja esta em uso.',
        'auth/invalid-email': 'Email invalido.',
        'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
        'auth/user-not-found': 'Email ou senha incorretos.',
        'auth/wrong-password': 'Email ou senha incorretos.',
        'auth/invalid-credential': 'Email ou senha incorretos.',
        'auth/requires-recent-login': 'Por seguranca, faca login novamente para alterar a senha.'
    };

    return errorMessages[error.code] || 'Erro ao processar. Tente novamente.';
}
