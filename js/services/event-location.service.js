/**
 * Event Location Service
 * Handles all event location-related Firebase operations
 * Including contacts subcollection
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
 * Create a new event location
 * @param {Object} locationData - The location data
 * @returns {Promise<string>} - The created document ID
 */
export async function createEventLocation(locationData) {
    const docRef = await addDoc(collection(db, COLLECTIONS.EVENT_LOCATIONS), {
        name: locationData.name,
        address: locationData.address,
        city: locationData.city,
        latitude: locationData.latitude ? parseFloat(locationData.latitude) : 0,
        longitude: locationData.longitude ? parseFloat(locationData.longitude) : 0,
        createdAt: Date.now()
    });
    return docRef.id;
}

/**
 * Get all event locations
 * @returns {Promise<Array>} - Array of locations with IDs
 */
export async function getAllEventLocations() {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.EVENT_LOCATIONS));
    const locations = [];

    querySnapshot.forEach((docSnap) => {
        locations.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    return locations;
}

/**
 * Get event location with contacts
 * @param {string} locationId - The location ID
 * @returns {Promise<Object>} - Location with contacts array
 */
export async function getEventLocationWithContacts(locationId) {
    const contacts = await getLocationContacts(locationId);
    return { locationId, contacts };
}

/**
 * Get all locations with their contacts
 * @returns {Promise<Array>} - Array of locations with contacts
 */
export async function getAllLocationsWithContacts() {
    const locations = await getAllEventLocations();

    for (const location of locations) {
        try {
            location.contacts = await getLocationContacts(location.id);
        } catch (e) {
            location.contacts = [];
        }
    }

    return locations;
}

/**
 * Update an event location
 * @param {string} locationId - The location ID
 * @param {Object} locationData - The updated location data
 */
export async function updateEventLocation(locationId, locationData) {
    await updateDoc(doc(db, COLLECTIONS.EVENT_LOCATIONS, locationId), {
        ...locationData,
        updatedAt: Date.now()
    });
}

/**
 * Delete an event location
 * @param {string} locationId - The location ID
 */
export async function deleteEventLocation(locationId) {
    await deleteDoc(doc(db, COLLECTIONS.EVENT_LOCATIONS, locationId));
}

// ============================================
// Contacts Subcollection
// ============================================

/**
 * Add a contact to a location
 * @param {string} locationId - The location ID
 * @param {Object} contactData - The contact data (name, phone)
 * @returns {Promise<string>} - The created contact ID
 */
export async function addLocationContact(locationId, contactData) {
    const docRef = await addDoc(
        collection(db, COLLECTIONS.EVENT_LOCATIONS, locationId, 'contacts'),
        {
            name: contactData.name,
            phone: contactData.phone,
            createdAt: Date.now()
        }
    );
    return docRef.id;
}

/**
 * Get all contacts for a location
 * @param {string} locationId - The location ID
 * @returns {Promise<Array>} - Array of contacts
 */
export async function getLocationContacts(locationId) {
    const querySnapshot = await getDocs(
        collection(db, COLLECTIONS.EVENT_LOCATIONS, locationId, 'contacts')
    );
    const contacts = [];

    querySnapshot.forEach((docSnap) => {
        contacts.push({
            id: docSnap.id,
            ...docSnap.data()
        });
    });

    return contacts;
}

/**
 * Delete a contact from a location
 * @param {string} locationId - The location ID
 * @param {string} contactId - The contact ID
 */
export async function deleteLocationContact(locationId, contactId) {
    await deleteDoc(
        doc(db, COLLECTIONS.EVENT_LOCATIONS, locationId, 'contacts', contactId)
    );
}
