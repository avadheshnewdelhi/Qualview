import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyAHcRS-shTHe66_2A3PlpVsCcznkRp71TY',
    authDomain: 'qualview-plugin.firebaseapp.com',
    projectId: 'qualview-plugin',
    storageBucket: 'qualview-plugin.firebasestorage.app',
    messagingSenderId: '532460466990',
    appId: '1:532460466990:web:d4f96152a83c4109f700bf',
};

const app = initializeApp(firebaseConfig);

// Figma plugins run in an iframe where localStorage is often blocked or cleared.
// Force Firebase to try IndexedDB first for persistence.
export const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence]
});
export const db = getFirestore(app);
