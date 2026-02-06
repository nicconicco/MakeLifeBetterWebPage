/**
 * Firebase Configuration
 * Centralized Firebase setup and initialization
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyDcHBBJC1BHAIDO8vSGQsNSN3y_e6sTmBM",
    authDomain: "makelifebetter-7f3c9.firebaseapp.com",
    projectId: "makelifebetter-7f3c9",
    storageBucket: "makelifebetter-7f3c9.firebasestorage.app",
    messagingSenderId: "749904577078",
    appId: "1:749904577078:web:3235cbb8e26ffaabba0e97",
    measurementId: "G-ZPNC0MZ1T7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const FUNCTIONS_REGION = 'us-central1';
const FUNCTIONS_BASE_URL = `https://${FUNCTIONS_REGION}-${firebaseConfig.projectId}.cloudfunctions.net`;

export { app, db, auth, FUNCTIONS_REGION, FUNCTIONS_BASE_URL };
