/**
 * Firebase Configuration
 * Fetches config from Cloud Function to avoid hardcoding secrets in the repo.
 * Uses top-level await so all importers wait for Firebase to be ready.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const CONFIG_URL = 'https://us-central1-makelifebetter-7f3c9.cloudfunctions.net/getWebConfig';

const response = await fetch(CONFIG_URL);
if (!response.ok) {
    throw new Error('Failed to fetch Firebase config');
}
const firebaseConfig = await response.json();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const FUNCTIONS_REGION = 'us-central1';
const FUNCTIONS_BASE_URL = `https://${FUNCTIONS_REGION}-${firebaseConfig.projectId}.cloudfunctions.net`;

export { app, db, auth, FUNCTIONS_REGION, FUNCTIONS_BASE_URL };
