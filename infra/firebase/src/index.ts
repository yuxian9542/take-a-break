import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { loadConfig } from '@take-a-break/config';

let firebaseApp: App | null = null;

function createApp(): App {
  const config = loadConfig();

  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (config.FIREBASE_PROJECT_ID && config.FIREBASE_CLIENT_EMAIL && config.FIREBASE_PRIVATE_KEY) {
    const privateKey = config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    return initializeApp({
      credential: cert({
        projectId: config.FIREBASE_PROJECT_ID,
        clientEmail: config.FIREBASE_CLIENT_EMAIL,
        privateKey
      }),
      databaseURL: config.FIREBASE_DATABASE_URL,
      storageBucket: config.FIREBASE_STORAGE_BUCKET
    });
  }

  if (config.FIREBASE_PROJECT_ID || config.FIREBASE_STORAGE_BUCKET) {
    return initializeApp({
      projectId: config.FIREBASE_PROJECT_ID,
      storageBucket: config.FIREBASE_STORAGE_BUCKET
    });
  }

  return initializeApp();
}

export function ensureFirebaseApp(): App {
  if (!firebaseApp) {
    firebaseApp = createApp();
  }

  return firebaseApp;
}

export function getFirebaseAuth() {
  return getAuth(ensureFirebaseApp());
}

export function getFirebaseFirestore() {
  return getFirestore(ensureFirebaseApp());
}

export function getFirebaseStorage() {
  return getStorage(ensureFirebaseApp());
}
