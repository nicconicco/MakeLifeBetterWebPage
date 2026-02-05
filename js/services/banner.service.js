/**
 * Banner Service
 * Handles banner upload and retrieval
 */

import { app, db } from '../config/firebase.config.js';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { COLLECTIONS } from '../config/constants.js';

const storage = getStorage(app);

function sanitizeFileName(name = 'banner') {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9._-]/g, '')
        .slice(0, 80);
}

/**
 * Get all banners
 * @returns {Promise<Array>} Array of banners
 */
export async function getAllBanners() {
    const snapshot = await getDocs(collection(db, COLLECTIONS.BANNERS));
    const banners = [];

    snapshot.forEach(docSnap => {
        banners.push({ id: docSnap.id, ...docSnap.data() });
    });

    banners.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return banners;
}

/**
 * Upload a banner image and create banner document
 * @param {File} file - Image file
 * @returns {Promise<Object>} Banner data
 */
export async function uploadBanner(file) {
    const timestamp = Date.now();
    const safeName = sanitizeFileName(file?.name || 'banner');
    const storagePath = `banners/${timestamp}-${safeName}`;
    const fileRef = ref(storage, storagePath);

    await uploadBytes(fileRef, file);
    const imageUrl = await getDownloadURL(fileRef);

    const bannerData = {
        imageUrl,
        storagePath,
        originalName: file?.name || '',
        createdAt: timestamp
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.BANNERS), bannerData);
    return { id: docRef.id, ...bannerData };
}

/**
 * Delete banner document and storage file
 * @param {string} bannerId - Banner document ID
 * @param {string} storagePath - Storage path
 */
export async function deleteBanner(bannerId, storagePath) {
    if (storagePath) {
        try {
            await deleteObject(ref(storage, storagePath));
        } catch (error) {
            console.warn('Nao foi possivel remover o arquivo do banner:', error);
        }
    }

    await deleteDoc(doc(db, COLLECTIONS.BANNERS, bannerId));
}
