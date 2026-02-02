/**
 * Admin Auth Module
 * Handles authentication UI for admin panel
 */
import { auth } from '../../config/firebase.config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

/**
 * Register a new user
 */
export async function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Por favor, preencha email e senha!');
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert('Usuario registrado com sucesso!');
    } catch (error) {
        alert('Erro ao registrar: ' + error.message);
    }
}

/**
 * Login user
 */
export async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('Por favor, preencha email e senha!');
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Login realizado com sucesso!');
    } catch (error) {
        alert('Erro ao fazer login: ' + error.message);
    }
}

/**
 * Logout user
 */
export async function logout() {
    try {
        await signOut(auth);
        alert('Logout realizado com sucesso!');
    } catch (error) {
        alert('Erro ao fazer logout: ' + error.message);
    }
}

/**
 * Toggle UI based on auth state
 * @param {boolean} isLoggedIn - Whether user is logged in
 */
export function updateAuthUI(isLoggedIn) {
    const authSection = document.getElementById('auth-section');
    const mainSection = document.getElementById('main-section');

    if (authSection && mainSection) {
        authSection.style.display = isLoggedIn ? 'none' : 'block';
        mainSection.style.display = isLoggedIn ? 'block' : 'none';
    }
}
